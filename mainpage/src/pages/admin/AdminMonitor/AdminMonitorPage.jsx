import { useEffect, useMemo, useState } from "react";
import api from "../../../utils/api";
import "./AdminMonitor.css";

function StatusDot({ state }) {
  // state: "ok" | "down" | "degraded" | "skipped"
  return <span className={`status-dot ${state}`} />;
}

function formatDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString(); } catch { return "—"; }
}

export default function AdminMonitorPage() {
  const [overview, setOverview] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [onlyDown, setOnlyDown] = useState(false);
  const [q, setQ] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ov, ten] = await Promise.all([
        api.get("/admin/superadminMonitor/overview"),
        api.get("/admin/superadminMonitor/tenants", {
          params: { onlyDown, q },
        }),
      ]);

      setOverview(ov.data);
      setRows(Array.isArray(ten.data?.items) ? ten.data.items : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30000); // refresh cada 30s
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyDown]);

  const globalApiOk = overview?.global?.api?.ok === true;
  const globalSocketOk = overview?.global?.socket?.ok === true;

  const counts = overview?.counts || {};
  const openTotal = counts.openTotal ?? 0;

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const qq = q.trim().toLowerCase();
    return rows.filter(r => {
      const t = r.tenant || {};
      return (
        (r.tenantSlug || "").toLowerCase().includes(qq) ||
        (t.nombre || "").toLowerCase().includes(qq) ||
        (t.email || "").toLowerCase().includes(qq)
      );
    });
  }, [rows, q]);

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

          <button className="btn-refresh" onClick={fetchAll}>
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

        <div className="monitor-card">
          <h4>Incidentes abiertos</h4>
          <p className="big">{openTotal}</p>
          <small>
            P1: {counts.bySeverity?.P1 || 0} · P2: {counts.bySeverity?.P2 || 0} · P3:{" "}
            {counts.bySeverity?.P3 || 0}
          </small>
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
              {filtered.map((r) => {
                const skipped = !!r?.meta?.skipped;
                const hasIncident = !!r.incident;

                // degraded: ok=false y streak bajo, o ok=true pero falló antes (si quieres)
                const state = skipped ? "skipped" : (r.ok ? "ok" : "down");

                return (
                  <tr key={`${r.tenantSlug}-${r.service}`}>
                    <td>
                      <StatusDot state={state} />
                      <span className="state-label">
                        {skipped ? "SKIPPED" : (r.ok ? "OK" : "DOWN")}
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

              {!filtered.length && (
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
