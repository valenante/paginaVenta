// src/pages/PrintCenterPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../utils/api";
import "../styles/PrintCenterPage.css";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje";

const STATIONS = [
  { value: "", label: "Todas" },
  { value: "cocina", label: "Cocina" },
  { value: "barra", label: "Barra" },
  { value: "caja", label: "Caja" },
  { value: "tickets", label: "Tickets" },
];

const STATUSES = [
  { value: "", label: "Todos" },
  { value: "queued", label: "Queued" },
  { value: "sending", label: "Sending" },
  { value: "printed", label: "Printed" },
  { value: "failed", label: "Failed" },
];

const MOBILE_BP = 768;

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "—";
  }
}

function badgeClass(status) {
  if (status === "printed") return "pc-badge pc-badge--ok";
  if (status === "failed") return "pc-badge pc-badge--bad";
  if (status === "sending") return "pc-badge pc-badge--warn";
  if (status === "queued") return "pc-badge pc-badge--neutral";
  return "pc-badge pc-badge--neutral";
}

function safeErr(job) {
  const e = job?.lastError;
  if (!e) return "";
  const parts = [
    e.code ? `code=${e.code}` : "",
    typeof e.status === "number" && e.status ? `http=${e.status}` : "",
    e.message || "",
  ].filter(Boolean);
  return parts.join(" · ");
}

function useIsMobile(bp = MOBILE_BP) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= bp;
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= bp);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bp]);

  return isMobile;
}

export default function PrintCenterPage() {
  const isMobile = useIsMobile(MOBILE_BP);

  const [station, setStation] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(50);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [alerta, setAlerta] = useState(null);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshMs, setRefreshMs] = useState(3500);

  // impresoras disponibles (para retry con impresora)
  const [impresoras, setImpresoras] = useState([]);
  const [estadoAgente, setEstadoAgente] = useState("unknown");

  // UI: retry printer select per-job
  const [printerPick, setPrinterPick] = useState({}); // jobId -> printerName

  const timerRef = useRef(null);

  const fetchJobs = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data } = await api.get("/impresoras/jobs", {
        params: {
          station: station || undefined,
          status: status || undefined,
          limit,
        },
      });
      setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    } catch (e) {
      setAlerta({
        tipo: "error",
        mensaje: e?.response?.data?.message || e?.message || "Error cargando jobs",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchPrinters = async () => {
    try {
      const { data } = await api.get("/impresoras/listar");
      const lista = Array.isArray(data?.impresoras) ? data.impresoras : [];
      setImpresoras(lista);
      setEstadoAgente(data?.estado || "unknown");
    } catch (e) {
      setEstadoAgente(e?.response?.data?.estado || "unknown");
    }
  };

  useEffect(() => {
    fetchJobs(false);
    fetchPrinters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchJobs(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station, status, limit]);

  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => fetchJobs(true), Math.max(1500, Number(refreshMs) || 3500));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshMs, station, status, limit]);

  const retryJob = async (jobId) => {
    try {
      setLoading(true);
      const printer = printerPick?.[jobId] || "";
      await api.post(`/impresoras/jobs/${jobId}/retry`, printer ? { impresora: printer } : {});
      setAlerta({ tipo: "success", mensaje: "✅ Reintento encolado" });
      await fetchJobs(true);
    } catch (e) {
      setAlerta({
        tipo: "error",
        mensaje: e?.response?.data?.message || e?.message || "No se pudo reintentar",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelJob = async (jobId) => {
    try {
      setLoading(true);
      await api.post(`/impresoras/jobs/${jobId}/cancel`, {});
      setAlerta({ tipo: "success", mensaje: "🧹 Job cancelado" });
      await fetchJobs(true);
    } catch (e) {
      setAlerta({
        tipo: "error",
        mensaje: e?.response?.data?.message || e?.message || "No se pudo cancelar",
      });
    } finally {
      setLoading(false);
    }
  };

  const agentLabel =
    estadoAgente === "online" ? "🟢 Online" : estadoAgente === "offline" ? "🔴 Offline" : "🟡 Unknown";

  const hasFailed = useMemo(() => jobs.some((j) => j.status === "failed"), [jobs]);

  return (
    <main className="section section--wide">
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
          autoCerrar
          duracion={3200}
        />
      )}

      <div className="card pc-card">
        <div className="pc-header">
          <div>
            <h1>🖨️ Centro de impresión</h1>
            <p className="text-suave">
              Seguimiento de trabajos (jobs) y recuperación rápida: reintentar, cambiar impresora y cancelar.
            </p>
          </div>

          <div className="pc-header__right">
            <div className="pc-agent">
              <span className="text-suave">Agente:</span> <b>{agentLabel}</b>
            </div>

            <button
              className="btn"
              onClick={() => {
                fetchPrinters();
                fetchJobs(false);
              }}
              disabled={loading}
              title="Refrescar impresoras y jobs"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        <div className="pc-controls">
          <div className="pc-control">
            <label>Estación</label>
            <select value={station} onChange={(e) => setStation(e.target.value)} disabled={loading}>
              {STATIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pc-control">
            <label>Estado</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={loading}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pc-control">
            <label>Límite</label>
            <select value={String(limit)} onChange={(e) => setLimit(Number(e.target.value))} disabled={loading}>
              {[20, 50, 100].map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="pc-control pc-control--inline">
            <label className="pc-switch">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              <span>Auto refresh</span>
            </label>

            <select
              value={String(refreshMs)}
              onChange={(e) => setRefreshMs(Number(e.target.value))}
              disabled={!autoRefresh}
              title="Intervalo de refresco"
            >
              {[2000, 3500, 5000, 8000].map((n) => (
                <option key={n} value={String(n)}>
                  {n} ms
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasFailed && <div className="pc-hint pc-hint--warn">⚠️ Hay jobs fallidos. Reintenta o cambia la impresora.</div>}

        {/* ======= MOBILE: CARDS (sin scroll horizontal) ======= */}
        {isMobile ? (
          <div className="pc-jobList">
            {!jobs.length ? (
              <div className="pc-emptyCard">{loading ? "Cargando…" : "No hay jobs para mostrar."}</div>
            ) : (
              jobs.map((j) => {
                const jobId = j._id;
                const printerValue = printerPick?.[jobId] ?? "";
                const allowActions = j.status !== "printed" && !loading;

                return (
                  <article key={jobId} className={`pc-jobCard ${j.status === "failed" ? "pc-jobCard--failed" : ""}`}>
                    <header className="pc-jobHead">
                      <div className="pc-jobTitle">
                        <div className="pc-jobKind">{j.kind || "—"}</div>
                        <div className="pc-jobMetaRow">
                          <span className="pc-mono">{formatDate(j.createdAt)}</span>
                          <span className="pc-dot">•</span>
                          <span>{j.station || "—"}</span>
                        </div>
                      </div>
                      <span className={badgeClass(j.status)}>{j.status}</span>
                    </header>

                    <div className="pc-jobBody">
                      <div className="pc-kv">
                        <span className="pc-k">Impresora</span>
                        <span className="pc-v pc-mono">{j.printer || j.payload?.impresora || "—"}</span>
                      </div>

                      <div className="pc-kv">
                        <span className="pc-k">Intentos</span>
                        <span className="pc-v pc-mono">
                          {Number(j.attempts || 0)}/{Number(j.maxAttempts || 0)}
                        </span>
                      </div>

                      <div className="pc-kv pc-kv--full">
                        <span className="pc-k">Error</span>
                        <span className="pc-v pc-err">{safeErr(j) || "—"}</span>
                      </div>

                      <div className="pc-submeta text-suave">
                        ID: <span className="pc-mono">{jobId.slice(-8)}</span>
                        {j?.meta?.batchId ? (
                          <>
                            {" "}
                            · Batch: <span className="pc-mono">{String(j.meta.batchId).slice(0, 8)}</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="pc-jobActions">
                      <select
                        className="pc-printerSelect"
                        value={printerValue}
                        disabled={!allowActions || !impresoras.length}
                        onChange={(e) => setPrinterPick((prev) => ({ ...prev, [jobId]: e.target.value }))}
                      >
                        <option value="">(misma / automática)</option>
                        {impresoras.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>

                      <div className="pc-jobBtns">
                        <button
                          className="btn btn--primario"
                          onClick={() => retryJob(jobId)}
                          disabled={!allowActions}
                          title="Reintentar job"
                        >
                          🔁 Reintentar
                        </button>

                        <button className="btn" onClick={() => cancelJob(jobId)} disabled={!allowActions} title="Cancelar job">
                          🧹 Cancelar
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        ) : (
          /* ======= DESKTOP: TABLE (con columna de acciones sticky) ======= */
          <div className="pc-tableWrap">
            <table className="pc-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Estación</th>
                  <th>Impresora</th>
                  <th>Estado</th>
                  <th>Intentos</th>
                  <th>Error</th>
                  <th className="pc-colActions">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {!jobs.length && (
                  <tr>
                    <td colSpan={8} className="pc-empty">
                      {loading ? "Cargando…" : "No hay jobs para mostrar."}
                    </td>
                  </tr>
                )}

                {jobs.map((j) => {
                  const jobId = j._id;
                  const printerValue = printerPick?.[jobId] ?? "";
                  const allowActions = j.status !== "printed" && !loading;

                  return (
                    <tr key={jobId} className={j.status === "failed" ? "pc-row--failed" : ""}>
                      <td className="pc-mono">{formatDate(j.createdAt)}</td>
                      <td>{j.kind || "—"}</td>
                      <td>{j.station || "—"}</td>
                      <td className="pc-mono">{j.printer || j.payload?.impresora || "—"}</td>
                      <td>
                        <span className={badgeClass(j.status)}>{j.status}</span>
                      </td>
                      <td className="pc-mono">
                        {Number(j.attempts || 0)}/{Number(j.maxAttempts || 0)}
                      </td>
                      <td className="pc-err">{safeErr(j) || "—"}</td>

                      <td className="pc-colActions">
                        <div className="pc-actions">
                          <select
                            className="pc-printerSelect"
                            value={printerValue}
                            disabled={!allowActions || !impresoras.length}
                            onChange={(e) => setPrinterPick((prev) => ({ ...prev, [jobId]: e.target.value }))}
                          >
                            <option value="">(misma / automática)</option>
                            {impresoras.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>

                          <button className="btn btn--primario" onClick={() => retryJob(jobId)} disabled={!allowActions}>
                            🔁 Reintentar
                          </button>

                          <button className="btn" onClick={() => cancelJob(jobId)} disabled={!allowActions}>
                            🧹 Cancelar
                          </button>
                        </div>

                        <div className="pc-submeta text-suave">
                          ID: <span className="pc-mono">{jobId.slice(-8)}</span>
                          {j?.meta?.batchId ? (
                            <>
                              {" "}
                              · Batch: <span className="pc-mono">{String(j.meta.batchId).slice(0, 8)}</span>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}