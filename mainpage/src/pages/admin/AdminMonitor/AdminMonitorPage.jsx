// src/pages/admin/monitor/AdminMonitorPage.jsx  (ajusta ruta si tu proyecto la tiene distinta)
import { useEffect, useMemo, useState } from "react";
import api from "../../../utils/api";
import "./AdminMonitor.css";

function StatusDot({ state }) {
  // state: "ok" | "down" | "degraded" | "skipped"
  return <span className={`status-dot ${state}`} />;
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "—";
  }
}

function formatNum(n, suffix = "") {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  return `${v}${suffix}`;
}

// ✅ Estado de performance por tenant (HTTP)
function httpTenantState({ errorRate, p95Ms, total }) {
  // Si no hay suficiente tráfico, no declaramos KO.
  const minReq = 30;
  if ((total || 0) < minReq) return "skipped";

  const err = Number(errorRate || 0);
  const p95 = Number(p95Ms || 0);

  // Umbrales recomendados (ajustables)
  // DOWN: se nota en producción
  if (err >= 5 || p95 >= 2000) return "down";
  // DEGRADED: algo está raro
  if (err >= 1 || p95 >= 1000) return "degraded";
  return "ok";
}

export default function AdminMonitorPage() {
  const [overview, setOverview] = useState(null);
  const [rows, setRows] = useState([]); // impresión
  const [httpGlobal, setHttpGlobal] = useState(null);
  const [httpTenants, setHttpTenants] = useState([]); // ✅ HTTP por tenant
  const [loading, setLoading] = useState(true);
  const [emailTenants, setEmailTenants] = useState([]);
  const [vps, setVps] = useState(null);

  const [onlyDown, setOnlyDown] = useState(false);
  const [q, setQ] = useState("");

  const fetchAll = async () => {
    setLoading(true);

    try {
      const [ov, ten, http, httpT] = await Promise.all([
        api.get("/admin/superadminMonitor/overview"),
        api.get("/admin/superadminMonitor/tenants", { params: { onlyDown, q } }),
        api.get("/admin/metrics/http"),
        api.get("/admin/metrics/http/tenants", {
          params: { q, minReq: 30, limit: 200, onlyBad: onlyDown },
        }),
      ]);

      setOverview(ov.data);
      setRows(ten.data?.items || []);
      setHttpGlobal(http.data || null);
      setHttpTenants(httpT.data?.items || []);
    } catch (e) {
      console.error("Error core monitor:", e);
    }

    // 🔥 EMAIL AISLADO
    try {
      const emailT = await api.get("/admin/superadminMonitor/services", {
        params: { service: "email", q },
      });
      setEmailTenants(emailT.data?.items || []);
    } catch (e) {
      console.warn("Email monitor falló:", e);
      setEmailTenants([]); // fallback limpio
    } finally {
      setLoading(false);
    }
  };
  const fetchVps = async () => {
    try {
      const { data } = await api.get("/admin/superadminMonitor/vps");
      setVps(data?.ok ? data : null);
    } catch (e) {
      console.warn("VPS monitor falló:", e);
      setVps(null);
    }
  };

  function emailState({ ok, failStreak }) {
    if (ok === true) return "ok";
    if ((failStreak || 0) < 3) return "degraded";
    return "down";
  }

  useEffect(() => {
    fetchAll();
    fetchVps();

    const id = setInterval(() => {
      fetchAll();
      fetchVps();
    }, 30000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyDown]);

  function vpsState(vps) {
    // Si tu backend ya devuelve state ("ok|degraded|down"), úsalo
    if (vps?.state) return vps.state;

    // fallback por si aún no lo mandas
    const ram = Number(vps?.ram?.usagePct ?? 0);
    const disk = Number(vps?.disk?.usagePct ?? 0);
    const cpu = Number(vps?.cpu?.load1 ?? 0);

    if (disk >= 85 || ram >= 85 || cpu >= 1) return "down";
    if (disk >= 70 || ram >= 75 || cpu >= 0.7) return "degraded";
    return "ok";
  }

  const globalApiOk = overview?.global?.api?.ok === true;
  const globalSocketOk = overview?.global?.socket?.ok === true;

  const counts = overview?.counts || {};
  const openTotal = counts.openTotal ?? 0;

  // ====== PRINT tenants (frontend filter por nombre/email también) ======
  const filteredPrint = useMemo(() => {
    if (!q.trim()) return rows;
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      const t = r.tenant || {};
      return (
        (r.tenantSlug || "").toLowerCase().includes(qq) ||
        (t.nombre || "").toLowerCase().includes(qq) ||
        (t.email || "").toLowerCase().includes(qq)
      );
    });
  }, [rows, q]);

  // ====== HTTP Metrics (GLOBAL) ======
  const httpStats = httpGlobal && httpGlobal.ok ? httpGlobal : null;

  const httpState = useMemo(() => {
    if (!httpStats) return "degraded";
    const p95 = Number(httpStats?.latency?.p95Ms ?? 0);
    const err = Number(httpStats?.errorRate ?? 0);

    if (err >= 5 || p95 >= 2000) return "down";
    if (err >= 1 || p95 >= 1000) return "degraded";
    return "ok";
  }, [httpStats]);

  // ====== HTTP Tenants (frontend filter adicional por si quieres buscar por nombre/email más adelante) ======
  const filteredHttpTenants = useMemo(() => {
    // ahora mismo el backend filtra por slug con q,
    // pero dejamos este filtro por si en el futuro enriqueces con nombre/email
    if (!q.trim()) return httpTenants;
    const qq = q.trim().toLowerCase();
    return httpTenants.filter((t) => (t.tenantSlug || "").toLowerCase().includes(qq));
  }, [httpTenants, q]);

  if (loading && !overview) return <p>Cargando monitor...</p>;

  return (
    <div className="admin-monitor">
      <div className="monitor-header">
        <h2>Estado del sistema</h2>

        <div className="monitor-controls">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar tenant (slug / nombre / email)"
          />

          <label className="toggle">
            <input
              type="checkbox"
              checked={onlyDown}
              onChange={(e) => setOnlyDown(e.target.checked)}
            />
            Solo caídos
          </label>

          <button className="btn-refresh" onClick={() => { fetchAll(); fetchVps(); }}>
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* GLOBAL */}
      <section className="monitor-cards">
        <div className="monitor-card">
          <h4>API</h4>
          <p>
            <StatusDot state={globalApiOk ? "ok" : "down"} />{" "}
            {globalApiOk ? "OK" : "CAÍDA"}
          </p>
          <small>Último check: {formatDate(overview?.global?.api?.lastCheckedAt)}</small>
        </div>

        <div className="monitor-card">
          <h4>Sockets</h4>
          <p>
            <StatusDot state={globalSocketOk ? "ok" : "down"} />{" "}
            {globalSocketOk ? "OK" : "CAÍDOS"}
          </p>
          <small>Último check: {formatDate(overview?.global?.socket?.lastCheckedAt)}</small>
        </div>

        {/* ✅ HTTP GLOBAL */}
        <div className="monitor-card">
          <h4>HTTP (performance)</h4>

          <p>
            <StatusDot state={httpState} />{" "}
            {httpState === "ok" ? "OK" : httpState === "degraded" ? "DEGRADADO" : "CRÍTICO"}
          </p>

          <small style={{ display: "block" }}>
            p95: <strong>{formatNum(httpStats?.latency?.p95Ms, " ms")}</strong> · p99:{" "}
            <strong>{formatNum(httpStats?.latency?.p99Ms, " ms")}</strong>
          </small>

          <small style={{ display: "block" }}>
            avg: {formatNum(httpStats?.latency?.avgMs, " ms")} · rpm: {formatNum(httpStats?.rpm)} ·
            5xx: {formatNum(httpStats?.errorRate, "%")}
          </small>

          <small style={{ display: "block" }}>
            Ventana: {formatNum(httpStats?.windowMinutes)} min · Requests: {formatNum(httpStats?.total)}
          </small>
        </div>

        <div className="monitor-card">
          <h4>Incidentes abiertos</h4>
          <p className="big">{openTotal}</p>
          <small>
            P1: {counts.bySeverity?.P1 || 0} · P2: {counts.bySeverity?.P2 || 0} · P3:{" "}
            {counts.bySeverity?.P3 || 0}
          </small>
        </div>
      </section>

      {/* ✅ VPS */}
      <div className="monitor-card">
        <h4>Servidor (VPS)</h4>

        {vps ? (
          <>
            <p>
              <StatusDot state={vpsState(vps)} />{" "}
              {vpsState(vps) === "ok"
                ? "OK"
                : vpsState(vps) === "degraded"
                  ? "DEGRADADO"
                  : "CRÍTICO"}
            </p>

            <small style={{ display: "block" }}>
              RAM: <strong>{formatNum(vps?.ram?.usagePct, "%")}</strong> ·{" "}
              CPU (1m): <strong>{formatNum(vps?.cpu?.load1)}</strong> ·{" "}
              Disco(/): <strong>{formatNum(vps?.disk?.usagePct, "%")}</strong>
            </small>

            <small style={{ display: "block" }}>
              Último check: {formatDate(vps?.ts)}
              {vps?.cached ? " (cache)" : ""}
            </small>
          </>
        ) : (
          <>
            <p>
              <StatusDot state={"degraded"} /> SIN DATOS
            </p>
            <small>No se pudo obtener el estado del servidor.</small>
          </>
        )}
      </div>

      {/* ✅ HTTP POR TENANT */}
      <section className="monitor-table">
        <h3>HTTP por tenant (última ventana)</h3>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Tenant</th>
                <th>RPM</th>
                <th>Total</th>
                <th>5xx</th>
                <th>Error %</th>
                <th>p50</th>
                <th>p95</th>
                <th>p99</th>
                <th>Max</th>
                <th>Último visto</th>
              </tr>
            </thead>

            <tbody>
              {filteredHttpTenants.map((t) => {
                const total = t.total ?? 0;
                const state = httpTenantState({
                  total,
                  errorRate: t.errorRate,
                  p95Ms: t?.latency?.p95Ms,
                });

                const label =
                  state === "ok" ? "OK" : state === "degraded" ? "DEGRADED" : state === "down" ? "DOWN" : "SKIPPED";

                return (
                  <tr key={t.tenantSlug}>
                    <td>
                      <StatusDot state={state} />
                      <span className="state-label">{label}</span>
                    </td>

                    <td>
                      <div className="tenant-cell">
                        <strong>{t.tenantSlug}</strong>
                        <small>ventana: {formatNum(t.windowMinutes)} min</small>
                      </div>
                    </td>

                    <td>{formatNum(t.rpm)}</td>
                    <td>{formatNum(t.total)}</td>
                    <td>{formatNum(t.err5xx)}</td>
                    <td>{formatNum(t.errorRate, "%")}</td>

                    <td>{formatNum(t?.latency?.p50Ms, " ms")}</td>
                    <td>{formatNum(t?.latency?.p95Ms, " ms")}</td>
                    <td>{formatNum(t?.latency?.p99Ms, " ms")}</td>
                    <td>{formatNum(t?.latency?.maxMs, " ms")}</td>

                    <td>{formatDate(t.lastSeenAt)}</td>
                  </tr>
                );
              })}

              {!filteredHttpTenants.length && (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center", padding: 16 }}>
                    No hay datos HTTP suficientes (o no hubo tráfico en la ventana).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <small style={{ opacity: 0.8, display: "block", marginTop: 8 }}>
          * “SKIPPED” = menos de 30 requests en la ventana (evitamos falsos positivos).
        </small>
      </section>

      {/* ✅ EMAIL POR TENANT */}
      <section className="monitor-table">
        <h3>Email por tenant</h3>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Tenant</th>
                <th>Fail streak</th>
                <th>Último envío</th>
                <th>SMTP</th>
                <th>Dominio</th>
                <th>Incidente</th>
                <th>Último error</th>
              </tr>
            </thead>

            <tbody>
              {emailTenants.map((r) => {
                const state = emailState(r);
                const hasIncident = !!r.incident;

                return (
                  <tr key={`${r.tenantSlug}-email`}>
                    <td>
                      <StatusDot state={state} />
                      <span className="state-label">
                        {state === "ok" ? "OK" : state === "degraded" ? "DEGRADED" : "DOWN"}
                      </span>
                    </td>

                    <td>
                      <div className="tenant-cell">
                        <strong>{r.tenant?.nombre || r.tenantSlug}</strong>
                        <small>{r.tenantSlug}</small>
                      </div>
                    </td>

                    <td>{r.failStreak || 0}</td>
                    <td>{formatDate(r.lastCheckedAt)}</td>

                    <td>
                      {r.meta?.smtpHost
                        ? `${r.meta.smtpHost}:${r.meta.smtpPort || "—"}`
                        : "—"}
                    </td>

                    <td>{r.meta?.toDomain || "—"}</td>

                    <td>
                      {hasIncident ? (
                        <span className={`badge sev-${r.incident.severity}`}>
                          {r.incident.severity} · OPEN
                        </span>
                      ) : (
                        <span className="badge ok">—</span>
                      )}
                    </td>

                    <td className="err">
                      {r.lastError ? String(r.lastError).slice(0, 80) : "—"}
                    </td>
                  </tr>
                );
              })}

              {!emailTenants.length && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: 16 }}>
                    No hay actividad de email en la ventana.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* TENANTS PRINT */}
      <section className="monitor-table">
        <h3>Impresión por tenant</h3>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Tenant</th>
                <th>Plan</th>
                <th>Fail streak</th>
                <th>Último check</th>
                <th>Incidente</th>
                <th>Último error</th>
              </tr>
            </thead>

            <tbody>
              {filteredPrint.map((r) => {
                const skipped = !!r?.meta?.skipped;
                const hasIncident = !!r.incident;

                const degraded = !r.ok && (r.failStreak || 0) < 3;
                const state = skipped ? "skipped" : r.ok ? "ok" : degraded ? "degraded" : "down";

                return (
                  <tr key={`${r.tenantSlug}-${r.service}`}>
                    <td>
                      <StatusDot state={state} />
                      <span className="state-label">
                        {skipped ? "SKIPPED" : r.ok ? "OK" : degraded ? "DEGRADED" : "DOWN"}
                      </span>
                    </td>

                    <td>
                      <div className="tenant-cell">
                        <strong>{r.tenant?.nombre || r.tenantSlug}</strong>
                        <small>{r.tenantSlug}</small>
                      </div>
                    </td>

                    <td>{r.tenant?.plan || "—"}</td>
                    <td>{r.failStreak || 0}</td>
                    <td>{formatDate(r.lastCheckedAt)}</td>

                    <td>
                      {hasIncident ? (
                        <span className={`badge sev-${r.incident.severity}`}>
                          {r.incident.severity} · OPEN
                        </span>
                      ) : (
                        <span className="badge ok">—</span>
                      )}
                    </td>

                    <td className="err">
                      {r.lastError ? String(r.lastError).slice(0, 80) : "—"}
                    </td>
                  </tr>
                );
              })}

              {!filteredPrint.length && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: 16 }}>
                    No hay resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
