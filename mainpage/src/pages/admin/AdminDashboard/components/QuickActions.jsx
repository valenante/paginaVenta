// src/pages/admin/AdminDashboard/components/QuickActions.jsx
import { useState } from "react";
import { FiZap, FiPrinter, FiRefreshCw, FiCheckCircle } from "react-icons/fi";
import api from "../../../../utils/api";

export default function QuickActions() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

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

  const resolveAllMuted = () => exec("mute", async () => {
    const { data } = await api.get("/admin/superadminMonitor/incidents?status=open&limit=50");
    const items = data?.data?.items || data?.items || [];
    const stale = items.filter(i => {
      const age = Date.now() - new Date(i.lastSeenAt).getTime();
      return age > 7 * 24 * 60 * 60 * 1000; // > 7 days
    });
    let resolved = 0;
    for (const i of stale) {
      await api.patch(`/admin/superadminMonitor/incidents/${i._id}/resolve`, { resolution: "auto-resolved (stale >7d)" });
      resolved++;
    }
    return resolved > 0 ? `${resolved} incidentes stale resueltos` : "No hay incidentes stale (>7 días)";
  });

  const refreshAll = () => exec("refresh", async () => {
    await Promise.allSettled([
      api.get("/admin/superadminMonitor/overview"),
      api.get("/admin/superadminMonitor/vps"),
    ]);
    return "Monitor actualizado";
  });

  const renderResult = (key) => {
    const r = results[key];
    if (!r) return null;
    return <span className={`qa-result ${r.ok ? "qa-result--ok" : "qa-result--err"}`}>{r.msg}</span>;
  };

  return (
    <div className="quick-actions">
      <h3 className="quick-actions__title"><FiZap /> Acciones rápidas</h3>
      <div className="quick-actions__grid">
        <button className="qa-btn" onClick={checkPrintAgents} disabled={loading.print}>
          <FiPrinter /> {loading.print ? "Verificando..." : "Check Print Agents"}
          {renderResult("print")}
        </button>
        <button className="qa-btn" onClick={resolveAllMuted} disabled={loading.mute}>
          <FiCheckCircle /> {loading.mute ? "Procesando..." : "Resolver incidentes stale"}
          {renderResult("mute")}
        </button>
        <button className="qa-btn" onClick={refreshAll} disabled={loading.refresh}>
          <FiRefreshCw /> {loading.refresh ? "Actualizando..." : "Refrescar monitor"}
          {renderResult("refresh")}
        </button>
      </div>
    </div>
  );
}
