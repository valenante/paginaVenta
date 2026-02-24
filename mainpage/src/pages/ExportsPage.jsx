import { useEffect, useMemo, useState } from "react";
import api from "../utils/api.js";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import "../styles/ExportsPage.css";

function Badge({ tone = "neutral", children }) {
  return <span className={`exports-badge ${tone}`}>{children}</span>;
}

function fmtDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

function toIsoStartOfDay(dateStr) {
  if (!dateStr) return null;
  return `${dateStr}T00:00:00.000Z`;
}
function toIsoEndOfDay(dateStr) {
  if (!dateStr) return null;
  return `${dateStr}T23:59:59.999Z`;
}

const TYPE_OPTIONS = [
  { value: "facturas_csv", label: "Facturas (CSV)" },
  { value: "productos_csv", label: "Productos (CSV)" },
  { value: "ventas_csv", label: "Ventas (CSV)" },
  { value: "ingredientes_csv", label: "Ingredientes (CSV)" },
  { value: "movimientos_stock_csv", label: "Movimientos Stock (CSV)" },
  { value: "movimientos_caja_csv", label: "Movimientos Caja (CSV)" },
  { value: "cajas_csv", label: "Cajas (CSV)" },
  { value: "valoraciones_csv", label: "Valoraciones (CSV)" },
];

export default function ExportsPage() {
  const [tab, setTab] = useState("generate"); // generate | history

  // generar
  const [type, setType] = useState("facturas_csv");
  const [from, setFrom] = useState(""); // YYYY-MM-DD
  const [to, setTo] = useState("");     // YYYY-MM-DD
  const [includeAnulaciones, setIncludeAnulaciones] = useState(true);
  const [onlyAnulaciones, setOnlyAnulaciones] = useState(false);

  const [creating, setCreating] = useState(false);
  const [modal, setModal] = useState(null);

  // historial
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [alert, setAlert] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);

  const hasRunning = useMemo(
    () => items.some((j) => j.status === "PENDING" || j.status === "RUNNING"),
    [items]
  );

  const closeModal = () => setModal(null);

  const fetchJobs = async (opts = {}) => {
    const nextPage = opts.page ?? page;
    setLoading(true);
    try {
      const { data } = await api.get("/admin/exports", {
        params: {
          page: nextPage,
          limit,
          status: statusFilter || undefined,
          type: typeFilter || undefined,
        },
      });
      setItems(data?.items || []);
      setTotal(Number(data?.total || 0));
      setPage(Number(data?.page || nextPage));
    } catch (e) {
      setAlert({
        type: "error",
        text: e?.response?.data?.message || e?.response?.data?.error || "No se pudo cargar el historial",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch al cambiar filtros
  useEffect(() => {
    fetchJobs({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  // polling si hay jobs corriendo
  useEffect(() => {
    if (!hasRunning) return;
    const id = setInterval(() => {
      fetchJobs({ page });
    }, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRunning, page]);

  const openConfirmGenerate = () => {
    setModal("confirmGenerate");
  };

  const createJob = async () => {
    setCreating(true);
    setAlert(null);

    try {
      const params = {
        from: from ? toIsoStartOfDay(from) : undefined,
        to: to ? toIsoEndOfDay(to) : undefined,
        includeAnulaciones,
        onlyAnulaciones,
      };

      const { data } = await api.post("/admin/exports", {
        type,
        params,
        // idempotencyKey: opcional. Tu backend ya genera uno estable si no mandas.
      });

      const job = data?.job || null;
      setAlert({
        type: "ok",
        text: data?.reused
          ? `Ya existía un export igual (reutilizado). Estado: ${job?.status || "—"}`
          : "Export creado. Aparecerá en Historial en unos segundos.",
      });

      closeModal();
      setTab("history");
      await fetchJobs({ page: 1 });
    } catch (e) {
      setAlert({
        type: "error",
        text: e?.response?.data?.message || e?.response?.data?.error || "No se pudo crear el export",
      });
    } finally {
      setCreating(false);
    }
  };

  const downloadJob = async (job) => {
    try {
      setAlert(null);
      const { data } = await api.get(`/admin/exports/${job._id}/download`);
      const url = data?.url;
      if (!url) throw new Error("NO_URL");
      window.location.assign(url);
    } catch (e) {
      setAlert({
        type: "error",
        text: e?.response?.data?.error || e?.response?.data?.message || e?.message || "No se pudo descargar",
      });
    }
  };

  const toneForStatus = (s) => {
    if (s === "DONE") return "ok";
    if (s === "FAILED") return "danger";
    if (s === "RUNNING") return "warn";
    if (s === "PENDING") return "neutral";
    return "neutral";
  };

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="exports-page">
      <header className="exports-header">
        <h2>Exports / Reports</h2>
        <p>Genera y descarga exports (sin bloquear la app). Historial auditable.</p>
      </header>

      {alert && (
        <div className="exports-alert">
          <AlertaMensaje
            tipo={alert.type === "ok" ? "success" : "error"}
            mensaje={alert.text}
          />
        </div>
      )}

      <div className="exports-tabs">
        <button
          className={`exports-tab ${tab === "generate" ? "is-active" : ""}`}
          onClick={() => setTab("generate")}
        >
          Generar
        </button>
        <button
          className={`exports-tab ${tab === "history" ? "is-active" : ""}`}
          onClick={() => setTab("history")}
        >
          Historial
          {hasRunning ? <span className="exports-dot" title="Hay jobs en ejecución" /> : null}
        </button>
      </div>

      {tab === "generate" && (
        <section className="exports-card">
          <div className="exports-card-head">
            <h3>Crear export</h3>
          </div>

          <div className="exports-form">
            <label className="exports-label">
              Tipo
              <select
                className="exports-input"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="exports-row">
              <label className="exports-label">
                Desde
                <input
                  className="exports-input"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label className="exports-label">
                Hasta
                <input
                  className="exports-input"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
            </div>

            <div className="exports-row exports-row-tight">
              <label className="exports-check">
                <input
                  type="checkbox"
                  checked={includeAnulaciones}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setIncludeAnulaciones(v);
                    if (!v) setOnlyAnulaciones(false);
                  }}
                />
                Incluir anulaciones
              </label>

              <label className={`exports-check ${includeAnulaciones ? "" : "is-disabled"}`}>
                <input
                  type="checkbox"
                  disabled={!includeAnulaciones}
                  checked={onlyAnulaciones}
                  onChange={(e) => setOnlyAnulaciones(e.target.checked)}
                />
                Solo anulaciones
              </label>
            </div>

            <div className="exports-actions">
              <button
                className="exports-btn primary"
                onClick={openConfirmGenerate}
                disabled={creating}
              >
                {creating ? "Creando…" : "Generar export"}
              </button>

              <button
                className="exports-btn"
                onClick={() => {
                  setFrom("");
                  setTo("");
                  setIncludeAnulaciones(true);
                  setOnlyAnulaciones(false);
                }}
                disabled={creating}
              >
                Limpiar
              </button>
            </div>

            <p className="exports-muted">
              El export se genera en background. Luego lo descargas desde Historial.
            </p>
          </div>
        </section>
      )}

      {tab === "history" && (
        <section className="exports-card">
          <div className="exports-card-head">
            <h3>Historial</h3>
            <button className="exports-btn" onClick={() => fetchJobs({ page })} disabled={loading}>
              {loading ? "Cargando…" : "Recargar"}
            </button>
          </div>

          <div className="exports-filters">
            <label className="exports-label small">
              Estado
              <select
                className="exports-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="PENDING">PENDING</option>
                <option value="RUNNING">RUNNING</option>
                <option value="DONE">DONE</option>
                <option value="FAILED">FAILED</option>
              </select>
            </label>

            <label className="exports-label small">
              Tipo
              <select
                className="exports-input"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Todos</option>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <p className="exports-muted">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="exports-muted">Sin exports todavía.</p>
          ) : (
            <div className="exports-table">
              <div className="exports-thead">
                <div>Estado</div>
                <div>Tipo</div>
                <div>Creado</div>
                <div>Archivo</div>
                <div>Acciones</div>
              </div>

              {items.map((j) => (
                <div className="exports-row-item" key={j._id}>
                  <div className="exports-cell">
                    <Badge tone={toneForStatus(j.status)}>
                      {j.status}
                    </Badge>
                    <div className="exports-sub">
                      {j.status === "RUNNING" ? `${j.progress || 0}%` : j.message || "—"}
                    </div>
                  </div>

                  <div className="exports-cell">
                    <div className="exports-strong">{j.type}</div>
                    <div className="exports-sub">
                      {j.createdBy?.email || "—"}
                    </div>
                  </div>

                  <div className="exports-cell">
                    <div>{fmtDate(j.createdAt)}</div>
                    <div className="exports-sub">intentos: {j.attempts ?? 0}</div>
                  </div>

                  <div className="exports-cell">
                    <div className="exports-strong">{j.file?.filename || "—"}</div>
                    <div className="exports-sub">
                      expira: {j.file?.expiresAt ? fmtDate(j.file.expiresAt) : "—"}
                    </div>
                  </div>

                  <div className="exports-cell exports-actions-cell">
                    {j.status === "DONE" ? (
                      <button className="exports-btn primary" onClick={() => downloadJob(j)}>
                        Descargar
                      </button>
                    ) : (
                      <button className="exports-btn" disabled title="Aún no está listo">
                        Descargar
                      </button>
                    )}

                    {j.status === "FAILED" ? (
                      <button
                        className="exports-btn danger"
                        onClick={() => {
                          // Si aún no implementaste /retry en backend,
                          // cambia esto por “Generar de nuevo” (create export).
                          setAlert({
                            type: "error",
                            text: "Implementa POST /api/admin/exports/:id/retry para reintentar (te lo preparo si quieres).",
                          });
                        }}
                      >
                        Reintentar
                      </button>
                    ) : null}
                  </div>

                  {j.status === "FAILED" && (j.error?.message || j.error?.code) ? (
                    <div className="exports-error">
                      <b>Error:</b> {j.error?.code ? `${j.error.code} — ` : ""}{j.error?.message || "—"}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <div className="exports-pagination">
            <button
              className="exports-btn"
              onClick={() => fetchJobs({ page: Math.max(1, page - 1) })}
              disabled={page <= 1 || loading}
            >
              ←
            </button>
            <span className="exports-muted">
              Página {page} / {pages}
            </span>
            <button
              className="exports-btn"
              onClick={() => fetchJobs({ page: Math.min(pages, page + 1) })}
              disabled={page >= pages || loading}
            >
              →
            </button>
          </div>
        </section>
      )}

      {modal === "confirmGenerate" && (
        <ModalConfirmacion
          isOpen
          onClose={closeModal}
          titulo="Generar export"
          descripcion="Se generará en segundo plano y podrás descargarlo desde Historial."
          textoConfirmacion="GENERAR"
          onConfirm={createJob}
        >
          <div className="exports-modal-body">
            <div className="exports-muted"><b>Tipo:</b> {type}</div>
            <div className="exports-muted"><b>Rango:</b> {from || "—"} → {to || "—"}</div>
            <div className="exports-muted"><b>Anulaciones:</b> {onlyAnulaciones ? "Solo anulaciones" : includeAnulaciones ? "Incluidas" : "No incluidas"}</div>
          </div>
        </ModalConfirmacion>
      )}
    </div>
  );
}