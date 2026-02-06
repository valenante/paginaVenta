import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../utils/api";
import "./MigrationsPage.css";

function Badge({ tone = "neutral", children }) {
  return <span className={`mig-badge ${tone}`}>{children}</span>;
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

export default function MigrationsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | OK | PENDING | ERROR

  const summary = useMemo(() => {
    const total = tenants.length;
    const ok = tenants.filter((t) => t.status === "OK").length;
    const pending = tenants.filter((t) => t.status === "PENDING").length;
    const error = tenants.filter((t) => t.status === "ERROR").length;
    return { total, ok, pending, error };
  }, [tenants]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return tenants.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (!qq) return true;
      return (
        String(t.slug || "").toLowerCase().includes(qq) ||
        String(t.dbName || "").toLowerCase().includes(qq)
      );
    });
  }, [tenants, q, statusFilter]);

  const fetchOverview = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/admin/system/migrations/overview");
      setTenants(safeArr(data?.tenants));
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "No se pudo cargar el overview de migraciones"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const toneForStatus = (s) => {
    if (s === "OK") return "ok";
    if (s === "PENDING") return "warn";
    if (s === "ERROR") return "bad";
    return "neutral";
  };

  return (
    <div className="mig-page">
      <header className="mig-header">
        <div>
          <h2>Migraciones DB</h2>
          <p className="mig-sub">
            Estado por tenant: aplicadas, pendientes y errores (solo lectura + dry-run)
          </p>
        </div>

        <div className="mig-actions">
          <button className="mig-btn" onClick={fetchOverview} disabled={loading}>
            Recargar
          </button>
        </div>
      </header>

      <section className="mig-cards">
        <div className="mig-card">
          <div className="mig-card-title">Tenants</div>
          <div className="mig-card-value">{summary.total}</div>
        </div>
        <div className="mig-card">
          <div className="mig-card-title">OK</div>
          <div className="mig-card-value">{summary.ok}</div>
        </div>
        <div className="mig-card">
          <div className="mig-card-title">Pendientes</div>
          <div className="mig-card-value">{summary.pending}</div>
        </div>
        <div className="mig-card">
          <div className="mig-card-title">Errores</div>
          <div className="mig-card-value">{summary.error}</div>
        </div>
      </section>

      <section className="mig-filters">
        <input
          className="mig-input"
          placeholder="Buscar por slug o dbName..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className="mig-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Todos</option>
          <option value="OK">OK</option>
          <option value="PENDING">Pendientes</option>
          <option value="ERROR">Errores</option>
        </select>
      </section>

      {err && <div className="mig-error">{err}</div>}

      <section className="mig-table-wrap">
        {loading ? (
          <div className="mig-loading">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="mig-empty">No hay tenants para mostrar.</div>
        ) : (
          <table className="mig-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>DB</th>
                <th>Última aplicada</th>
                <th>Pendientes</th>
                <th>Estado</th>
                <th style={{ width: 180 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const pendingCount = safeArr(t.pending).length;
                return (
                  <tr key={t.dbName || t.slug}>
                    <td className="mig-mono">{t.slug}</td>
                    <td className="mig-mono">{t.dbName}</td>
                    <td className="mig-mono">{t.lastApplied || "—"}</td>
                    <td>
                      {pendingCount === 0 ? (
                        <Badge tone="ok">0</Badge>
                      ) : (
                        <Badge tone="warn">{pendingCount}</Badge>
                      )}
                    </td>
                    <td>
                      <Badge tone={toneForStatus(t.status)}>{t.status}</Badge>
                    </td>
                    <td>
                      <div className="mig-row-actions">
                        <button
                          className="mig-btn ghost"
                          onClick={() => navigate(`/superadmin/migrations/${t.slug}`)}
                        >
                          Ver detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
