// src/pages/admin/AdminMonitor/IncidentsPanel.jsx
import { useEffect, useState } from "react";
import { FiCheck, FiEye, FiVolumeX, FiRefreshCw } from "react-icons/fi";
import api from "../../../utils/api";

function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
}

function timeSince(d) {
  if (!d) return "";
  const ms = Date.now() - new Date(d).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ${min % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

export default function IncidentsPanel() {
  const [incidents, setIncidents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [acting, setActing] = useState(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/superadminMonitor/incidents?status=${filter}&limit=50`);
      setIncidents(data?.data?.items || data?.items || []);
      setTotal(data?.data?.total || data?.total || 0);
    } catch { setIncidents([]); }
    setLoading(false);
  };

  useEffect(() => { fetchIncidents(); }, [filter]);

  const doAction = async (id, action, body = {}) => {
    setActing(id);
    try {
      await api.patch(`/admin/superadminMonitor/incidents/${id}/${action}`, body);
      await fetchIncidents();
    } catch (e) {
      alert(`Error: ${e?.response?.data?.message || e.message}`);
    }
    setActing(null);
  };

  return (
    <section className="m-section">
      <div className="m-section__head">
        <h3>Incidentes ({total})</h3>
        <div className="m-section__actions">
          <select className="m-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="open">Abiertos</option>
            <option value="acknowledged">Reconocidos</option>
            <option value="resolved">Resueltos</option>
            <option value="muted">Silenciados</option>
            <option value="all">Todos</option>
          </select>
          <button className="m-btn m-btn--ghost" onClick={fetchIncidents} title="Actualizar">
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="m-empty">Cargando...</p>
      ) : incidents.length === 0 ? (
        <p className="m-empty">Sin incidentes {filter === "open" ? "abiertos" : ""}</p>
      ) : (
        <div className="m-table-wrap">
          <table className="m-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Sev.</th>
                <th>Servicio</th>
                <th>Tenant</th>
                <th>Desde</th>
                <th>Duración</th>
                <th>Error</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map(inc => (
                <tr key={inc._id} className={`m-incident-row m-incident-row--${inc.status}`}>
                  <td>
                    <span className={`m-badge m-badge--${inc.status === "open" ? "down" : inc.status === "acknowledged" ? "degraded" : "ok"}`}>
                      {inc.status === "open" ? "ABIERTO" : inc.status === "acknowledged" ? "ACK" : inc.status === "resolved" ? "RESUELTO" : "MUTED"}
                    </span>
                  </td>
                  <td><span className={`m-sev m-sev--${inc.severity}`}>{inc.severity}</span></td>
                  <td>{inc.service}</td>
                  <td>{inc.tenantSlug}</td>
                  <td>{fmt(inc.firstSeenAt)}</td>
                  <td>{timeSince(inc.firstSeenAt)}</td>
                  <td className="m-incident-error">{(inc.lastError || "").slice(0, 60)}</td>
                  <td className="m-incident-actions">
                    {inc.status === "open" && (
                      <>
                        <button
                          className="m-btn m-btn--sm m-btn--warn"
                          onClick={() => doAction(inc._id, "acknowledge")}
                          disabled={acting === inc._id}
                          title="Reconocer"
                        >
                          <FiEye />
                        </button>
                        <button
                          className="m-btn m-btn--sm m-btn--ok"
                          onClick={() => doAction(inc._id, "resolve")}
                          disabled={acting === inc._id}
                          title="Resolver"
                        >
                          <FiCheck />
                        </button>
                        <button
                          className="m-btn m-btn--sm m-btn--ghost"
                          onClick={() => doAction(inc._id, "mute")}
                          disabled={acting === inc._id}
                          title="Silenciar"
                        >
                          <FiVolumeX />
                        </button>
                      </>
                    )}
                    {inc.status === "acknowledged" && (
                      <button
                        className="m-btn m-btn--sm m-btn--ok"
                        onClick={() => doAction(inc._id, "resolve")}
                        disabled={acting === inc._id}
                        title="Resolver"
                      >
                        <FiCheck /> Resolver
                      </button>
                    )}
                    {inc.acknowledgedBy && <span className="m-incident-by">ACK: {inc.acknowledgedBy}</span>}
                    {inc.resolvedBy && <span className="m-incident-by">Resuelto: {inc.resolvedBy}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
