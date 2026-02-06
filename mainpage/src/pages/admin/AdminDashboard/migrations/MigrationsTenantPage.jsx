import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../../utils/api";
import "./MigrationsTenantPage.css";

function Badge({ tone = "neutral", children }) {
  return <span className={`mig-badge ${tone}`}>{children}</span>;
}

function toneForStatus(s) {
  if (s === "applied") return "ok";
  if (s === "running") return "warn";
  if (s === "failed") return "bad";
  return "neutral";
}

export default function MigrationsTenantPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dbName, setDbName] = useState("");
  const [applied, setApplied] = useState([]);
  const [pending, setPending] = useState([]);
  const [err, setErr] = useState("");

  const [dryRunning, setDryRunning] = useState(false);
  const [dryResult, setDryResult] = useState(null);

  const fetchTenant = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get(`/admin/system/migrations/tenant/${slug}`);
      setDbName(data?.dbName || `tpv_${slug}`);
      setApplied(Array.isArray(data?.applied) ? data.applied : []);
      setPending(Array.isArray(data?.pending) ? data.pending : []);
      setDryResult(null);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "No se pudo cargar el detalle del tenant"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const runDry = async () => {
    setDryRunning(true);
    setErr("");
    try {
      const { data } = await api.post("/admin/system/migrations/dry-run", {
        tenant: slug,
      });
      setDryResult(data);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "No se pudo ejecutar el dry-run"
      );
    } finally {
      setDryRunning(false);
    }
  };

  return (
    <div className="mig-tenant-page">
      <header className="mig-tenant-header">
        <div>
          <button className="mig-btn ghost" onClick={() => navigate("/superadmin/migrations")}>
            ← Volver
          </button>
          <h2>Tenant: <span className="mig-mono">{slug}</span></h2>
          <p className="mig-sub">
            DB: <span className="mig-mono">{dbName || `tpv_${slug}`}</span>
          </p>
        </div>

        <div className="mig-actions">
          <button className="mig-btn" onClick={fetchTenant} disabled={loading}>
            Recargar
          </button>
          <button className="mig-btn" onClick={runDry} disabled={dryRunning || loading}>
            {dryRunning ? "Dry-run..." : "Dry-run"}
          </button>
        </div>
      </header>

      {err && <div className="mig-error">{err}</div>}

      {loading ? (
        <div className="mig-loading">Cargando…</div>
      ) : (
        <>
          <section className="mig-tenant-panels">
            <div className="mig-panel">
              <div className="mig-panel-title">Pendientes</div>
              {pending.length === 0 ? (
                <div className="mig-empty">No hay pendientes ✅</div>
              ) : (
                <ul className="mig-list">
                  {pending.map((id) => (
                    <li key={id} className="mig-mono">{id}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mig-panel">
              <div className="mig-panel-title">Resultado Dry-run</div>
              {!dryResult ? (
                <div className="mig-empty">Ejecuta Dry-run para recalcular pendientes.</div>
              ) : (
                <div>
                  <div className="mig-sub">
                    DB: <span className="mig-mono">{dryResult.dbName}</span>
                  </div>
                  {(dryResult.pending || []).length === 0 ? (
                    <div className="mig-empty">No hay pendientes ✅</div>
                  ) : (
                    <ul className="mig-list">
                      {dryResult.pending.map((id) => (
                        <li key={id} className="mig-mono">{id}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="mig-table-wrap">
            <h3>Migraciones registradas</h3>
            {applied.length === 0 ? (
              <div className="mig-empty">No hay registros en __migrations.</div>
            ) : (
              <table className="mig-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Estado</th>
                    <th>Duración (ms)</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                  </tr>
                </thead>
                <tbody>
                  {applied.map((m) => (
                    <tr key={m._id}>
                      <td className="mig-mono">{m._id}</td>
                      <td>{m.name}</td>
                      <td>
                        <Badge tone={toneForStatus(m.status)}>{m.status}</Badge>
                      </td>
                      <td className="mig-mono">{m.durationMs ?? "—"}</td>
                      <td className="mig-mono">{m.startedAt ? new Date(m.startedAt).toLocaleString() : "—"}</td>
                      <td className="mig-mono">{m.finishedAt ? new Date(m.finishedAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
