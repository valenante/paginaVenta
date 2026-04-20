// src/pages/admin/AdminDashboard/components/QuickActions.jsx
import { useState } from "react";
import { FiZap, FiPrinter, FiRefreshCw, FiCheckCircle, FiUnlock, FiXCircle, FiUserX } from "react-icons/fi";
import api from "../../../../utils/api";

export default function QuickActions() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [emergencySlug, setEmergencySlug] = useState("");
  const [emergencyEmail, setEmergencyEmail] = useState("");

  const exec = async (key, fn) => {
    setLoading(p => ({ ...p, [key]: true }));
    setResults(p => ({ ...p, [key]: null }));
    try {
      const r = await fn();
      setResults(p => ({ ...p, [key]: { ok: true, msg: r } }));
    } catch (e) {
      setResults(p => ({ ...p, [key]: { ok: false, msg: e?.response?.data?.message || e.message } }));
    }
    setLoading(p => ({ ...p, [key]: false }));
  };

  const checkPrintAgents = () => exec("print", async () => {
    const { data } = await api.get("/admin/superadminMonitor/tenants?limit=100");
    const items = data?.data?.items || data?.items || [];
    const ok = items.filter(i => i.ok).length;
    const down = items.filter(i => !i.ok).length;
    return `${ok} OK, ${down} DOWN de ${items.length} tenants`;
  });

  const resolveStale = () => exec("stale", async () => {
    const { data } = await api.get("/admin/superadminMonitor/incidents?status=open&limit=50");
    const items = data?.data?.items || data?.items || [];
    const stale = items.filter(i => (Date.now() - new Date(i.lastSeenAt).getTime()) > 7 * 86400000);
    let resolved = 0;
    for (const i of stale) {
      await api.patch(`/admin/superadminMonitor/incidents/${i._id}/resolve`, { resolution: "auto-resolved (stale >7d)" });
      resolved++;
    }
    return resolved > 0 ? `${resolved} incidentes stale resueltos` : "No hay incidentes stale (>7 días)";
  });

  const reopenCaja = () => exec("caja", async () => {
    if (!emergencySlug.trim()) return "Escribe el slug del tenant";
    const { data } = await api.post("/admin/superadmin/emergency/reopen-caja", { tenantSlug: emergencySlug.trim() });
    const d = data?.data || data;
    return d.alreadyOpen ? `Ya hay caja abierta` : `Caja reabierta (${String(d.cajaId).slice(0, 8)})`;
  });

  const closeZombies = () => exec("zombies", async () => {
    if (!emergencySlug.trim()) return "Escribe el slug del tenant";
    const { data } = await api.post("/admin/superadmin/emergency/close-zombie-mesas", { tenantSlug: emergencySlug.trim() });
    const d = data?.data || data;
    return d.message;
  });

  const resetSession = () => exec("session", async () => {
    if (!emergencyEmail.trim()) return "Escribe el email del usuario";
    const { data } = await api.post("/admin/superadmin/emergency/reset-user-session", { email: emergencyEmail.trim() });
    const d = data?.data || data;
    return d.message;
  });

  const R = (key) => { const r = results[key]; return r ? <span className={`qa-result ${r.ok ? "qa-result--ok" : "qa-result--err"}`}>{r.msg}</span> : null; };

  return (
    <div className="quick-actions">
      <h3 className="quick-actions__title"><FiZap /> Acciones rápidas</h3>
      <div className="quick-actions__grid">
        <button className="qa-btn" onClick={checkPrintAgents} disabled={loading.print}>
          <FiPrinter /> {loading.print ? "Verificando..." : "Check Print Agents"}
          {R("print")}
        </button>
        <button className="qa-btn" onClick={resolveStale} disabled={loading.stale}>
          <FiCheckCircle /> {loading.stale ? "Procesando..." : "Resolver incidentes stale"}
          {R("stale")}
        </button>
        <button className="qa-btn" onClick={() => window.location.reload()}>
          <FiRefreshCw /> Refrescar dashboard
        </button>
      </div>

      <h4 className="quick-actions__subtitle">Emergencias</h4>
      <div className="qa-emergency-row">
        <input className="qa-input" placeholder="tenant slug (ej: zabor-feten)" value={emergencySlug} onChange={e => setEmergencySlug(e.target.value)} />
        <button className="qa-btn qa-btn--emergency" onClick={reopenCaja} disabled={loading.caja}>
          <FiUnlock /> {loading.caja ? "..." : "Reabrir caja"}
        </button>
        <button className="qa-btn qa-btn--emergency" onClick={closeZombies} disabled={loading.zombies}>
          <FiXCircle /> {loading.zombies ? "..." : "Cerrar mesas zombie"}
        </button>
      </div>
      <div className="qa-emergency-results">{R("caja")}{R("zombies")}</div>

      <div className="qa-emergency-row" style={{ marginTop: 8 }}>
        <input className="qa-input" placeholder="email usuario" value={emergencyEmail} onChange={e => setEmergencyEmail(e.target.value)} />
        <button className="qa-btn qa-btn--emergency" onClick={resetSession} disabled={loading.session}>
          <FiUserX /> {loading.session ? "..." : "Reset sesión"}
        </button>
      </div>
      <div className="qa-emergency-results">{R("session")}</div>
    </div>
  );
}
