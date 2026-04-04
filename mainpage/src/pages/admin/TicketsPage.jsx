import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../utils/api";
import Portal from "../../components/ui/Portal.jsx";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../context/ToastContext";
import { FiCheckCircle, FiClock, FiAlertTriangle } from "react-icons/fi";
import "../../styles/TicketsPage.css";

function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function slaStatus(ticket) {
  if (!ticket?.slaDeadline) return { label: "—", tone: "neutral" };
  const now = Date.now();
  const deadline = new Date(ticket.slaDeadline).getTime();

  if (ticket.slaBreachedAt || now > deadline) {
    return { label: "Vencido", tone: "breached" };
  }

  const remainMs = deadline - now;
  const remainH = Math.floor(remainMs / (1000 * 60 * 60));
  const remainM = Math.floor((remainMs % (1000 * 60 * 60)) / (1000 * 60));

  const totalMs = (ticket.slaPriorityHours || 48) * 60 * 60 * 1000;
  const pct = remainMs / totalMs;

  if (pct < 0.2) return { label: `${remainH}h ${remainM}m`, tone: "critical" };
  if (pct < 0.5) return { label: `${remainH}h ${remainM}m`, tone: "warning" };
  return { label: `${remainH}h ${remainM}m`, tone: "ok" };
}

export default function TicketsPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [estado, setEstado] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [tenant, setTenant] = useState("");
  const [search, setSearch] = useState("");

  const debouncedTenant = useDebouncedValue(tenant, 300);
  const debouncedSearch = useDebouncedValue(search, 300);

  const [selected, setSelected] = useState(null);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Assignment
  const [assignName, setAssignName] = useState("");
  // Internal note
  const [notaInterna, setNotaInterna] = useState("");
  const [savingNota, setSavingNota] = useState(false);

  const abortRef = useRef(null);

  const fetchTickets = useCallback(async () => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params = {};
      if (estado) params.estado = estado;
      if (prioridad) params.prioridad = prioridad;
      if (debouncedTenant) params.tenant = debouncedTenant;
      if (debouncedSearch) params.search = debouncedSearch;

      const { data } = await api.get("/admin/superadmin/tickets", { params, signal: controller.signal });
      setTickets(data.tickets || []);
    } catch (err) {
      if (err?.name !== "CanceledError") showToast("Error cargando tickets", "error");
    } finally {
      setLoading(false);
    }
  }, [estado, prioridad, debouncedTenant, debouncedSearch, showToast]);

  useEffect(() => {
    fetchTickets();
    return () => abortRef.current?.abort?.();
  }, [fetchTickets]);

  // Sync local state when selected ticket changes
  useEffect(() => {
    if (selected) {
      setAssignName(selected.asignadoA?.nombre || "");
      setNotaInterna(selected.notasInternas || "");
    }
  }, [selected]);

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !selected?._id) return;
    setSending(true);
    try {
      await api.post(`/admin/superadmin/tickets/${selected._id}/mensaje`, { autor: "superadmin", mensaje: nuevoMensaje });
      setNuevoMensaje("");
      await fetchTicket(selected._id);
    } catch { showToast("Error enviando mensaje", "error"); }
    finally { setSending(false); }
  };

  const fetchTicket = async (id) => {
    try {
      const { data } = await api.get(`/admin/superadmin/tickets/${id}`);
      setSelected(data.ticket);
    } catch { showToast("Error recargando ticket", "error"); }
  };

  const updateTicket = async (updates) => {
    if (!selected?._id) return;
    try {
      const { data } = await api.put(`/admin/superadmin/tickets/${selected._id}`, updates);
      setSelected(data.ticket);
      fetchTickets();
    } catch { showToast("Error actualizando ticket", "error"); }
  };

  const assignTicket = async () => {
    if (!selected?._id) return;
    try {
      const { data } = await api.patch(`/admin/superadmin/tickets/${selected._id}/assign`, { nombre: assignName.trim() || null });
      setSelected(data.ticket);
      showToast("Ticket asignado", "exito");
      fetchTickets();
    } catch { showToast("Error asignando ticket", "error"); }
  };

  const saveNota = async () => {
    if (!selected?._id) return;
    setSavingNota(true);
    try {
      const { data } = await api.post(`/admin/superadmin/tickets/${selected._id}/nota`, { nota: notaInterna });
      setSelected(data.ticket);
      showToast("Nota guardada", "exito");
    } catch { showToast("Error guardando nota", "error"); }
    finally { setSavingNota(false); }
  };

  const eliminarTicket = async () => {
    if (!selected?._id) return;
    try {
      await api.delete(`/admin/superadmin/tickets/${selected._id}`);
      setSelected(null);
      setConfirmDelete(false);
      fetchTickets();
      showToast("Ticket eliminado", "exito");
    } catch { showToast("Error eliminando ticket", "error"); }
  };

  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => { if (e.key === "Escape") { setSelected(null); setConfirmDelete(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <section className="tickets">
      <header className="tickets__header">
        <div>
          <h1 className="tickets__title">🎫 Tickets de soporte</h1>
          <p className="tickets__subtitle">Filtra, prioriza y responde rápido.</p>
        </div>
      </header>

      {/* FILTROS */}
      <div className="tickets-filters" role="region" aria-label="Filtros de tickets">
        <select className="tickets-field" value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Estado</option>
          <option value="abierto">Abierto</option>
          <option value="en_progreso">En progreso</option>
          <option value="resuelto">Resuelto</option>
          <option value="cerrado">Cerrado</option>
        </select>

        <select className="tickets-field" value={prioridad} onChange={(e) => setPrioridad(e.target.value)} aria-label="Filtrar por prioridad">
          <option value="">Prioridad</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>

        <input className="tickets-field" type="text" placeholder="Tenant…" value={tenant} onChange={(e) => setTenant(e.target.value)} aria-label="Filtrar por tenant" />
        <input className="tickets-field" type="text" placeholder="Buscar asunto…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar por asunto" />

        <button className="tickets-refreshBtn" onClick={fetchTickets} type="button" title="Actualizar">🔄</button>
      </div>

      {/* LISTA */}
      {loading ? (
        <p className="tickets-state tickets-state--muted">Cargando tickets…</p>
      ) : tickets.length === 0 ? (
        <EmptyState icon={FiCheckCircle} title="Todo en orden" description="Sin tickets pendientes." />
      ) : (
        <div className="tickets-tableWrap">
          <table className="tickets-table">
            <thead className="tickets-table__thead">
              <tr>
                <th>Tenant</th>
                <th>Asunto</th>
                <th>Prioridad</th>
                <th>SLA</th>
                <th>Asignado</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody className="tickets-table__tbody">
              {tickets.map((t) => {
                const sla = slaStatus(t);
                return (
                  <tr key={t._id} className="tickets-table__row" onClick={() => setSelected(t)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelected(t); }} tabIndex={0} role="button" title="Abrir ticket">
                    <td className="tickets-table__cell" data-label="Tenant">{t.tenantNombre || t.tenant || t.tenantSlug}</td>
                    <td className="tickets-table__cell tickets-subject" data-label="Asunto">{t.asunto}</td>
                    <td className="tickets-table__cell" data-label="Prioridad"><span className={`tickets-pill tickets-pill--prio prio-${t.prioridad}`}>{t.prioridad}</span></td>
                    <td className="tickets-table__cell" data-label="SLA"><span className={`sla-badge sla-badge--${sla.tone}`}>{sla.label}</span></td>
                    <td className="tickets-table__cell" data-label="Asignado">{t.asignadoA?.nombre || "—"}</td>
                    <td className="tickets-table__cell" data-label="Estado"><span className={`tickets-pill tickets-pill--estado estado-${t.estado}`}>{t.estado}</span></td>
                    <td className="tickets-table__cell" data-label="Creado">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {selected && (
        <Portal>
          <div className="tickets-modal" onClick={() => { setSelected(null); setConfirmDelete(false); }}>
            <div className="tickets-modal__content" onClick={(e) => e.stopPropagation()}>
              <header className="tickets-modal__header">
                <div>
                  <h2 className="tickets-modal__title">{selected.asunto}</h2>
                  <p className="tickets-modal__meta"><strong>Tenant:</strong> {selected.tenantNombre || selected.tenantSlug}</p>
                </div>
                <button className="tickets-modal__close" type="button" aria-label="Cerrar" onClick={() => { setSelected(null); setConfirmDelete(false); }}>✕</button>
              </header>

              {/* SLA Banner */}
              {(() => {
                const sla = slaStatus(selected);
                if (sla.tone === "neutral") return null;
                return (
                  <div className={`tickets-sla-banner sla-banner--${sla.tone}`}>
                    {sla.tone === "breached" ? <FiAlertTriangle /> : <FiClock />}
                    <span>SLA: <strong>{sla.label}</strong></span>
                    {selected.slaPriorityHours && <span className="tickets-sla-hours">({selected.slaPriorityHours}h para {selected.prioridad})</span>}
                  </div>
                );
              })()}

              <hr className="tickets-divider" />

              {/* Estado / Prioridad / Asignación */}
              <div className="tickets-controls">
                <div className="tickets-control">
                  <label>Estado</label>
                  <select className="tickets-field tickets-field--modal" value={selected.estado} onChange={(e) => updateTicket({ estado: e.target.value })}>
                    <option value="abierto">Abierto</option>
                    <option value="en_progreso">En progreso</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>
                <div className="tickets-control">
                  <label>Prioridad</label>
                  <select className="tickets-field tickets-field--modal" value={selected.prioridad} onChange={(e) => updateTicket({ prioridad: e.target.value })}>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div className="tickets-control">
                  <label>Asignado a</label>
                  <div className="tickets-assign-row">
                    <input className="tickets-field tickets-field--modal" type="text" value={assignName} onChange={(e) => setAssignName(e.target.value)} placeholder="Nombre..." />
                    <button className="tickets-assign-btn" onClick={assignTicket} type="button" disabled={assignName.trim() === (selected.asignadoA?.nombre || "")}>
                      Asignar
                    </button>
                  </div>
                </div>
              </div>

              <hr className="tickets-divider" />

              {/* Chat */}
              <h3 className="tickets-chat__title">Mensajes</h3>
              <div className="tickets-chat">
                {(selected.mensajes || []).map((m, idx) => (
                  <div key={idx} className={`tickets-msg msg-${m.autor}`}>
                    <p>{m.mensaje}</p>
                    <span>{new Date(m.fecha).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="tickets-send">
                <input className="tickets-field tickets-field--send" type="text" placeholder="Escribe un mensaje…" value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !sending && enviarMensaje()} disabled={sending} />
                <button className="tickets-send__btn" onClick={enviarMensaje} type="button" disabled={sending || !nuevoMensaje.trim()}>
                  {sending ? "..." : "Enviar"}
                </button>
              </div>

              <hr className="tickets-divider" />

              {/* Notas internas */}
              <div className="tickets-notas">
                <h4 className="tickets-notas__title">Notas internas (solo admin)</h4>
                <textarea className="tickets-notas__input" value={notaInterna} onChange={(e) => setNotaInterna(e.target.value)} placeholder="Notas privadas sobre este ticket..." rows={3} />
                <button className="tickets-notas__btn" onClick={saveNota} type="button" disabled={savingNota || notaInterna === (selected.notasInternas || "")}>
                  {savingNota ? "Guardando..." : "Guardar nota"}
                </button>
              </div>

              {/* Delete */}
              {!confirmDelete ? (
                <button className="tickets-dangerBtn" onClick={() => setConfirmDelete(true)} type="button">🗑 Eliminar ticket</button>
              ) : (
                <div className="tickets-confirmDelete">
                  <p>¿Eliminar este ticket permanentemente?</p>
                  <div className="tickets-confirmDelete__actions">
                    <button className="tickets-dangerBtn" onClick={eliminarTicket} type="button">Confirmar</button>
                    <button className="tickets-cancelBtn" onClick={() => setConfirmDelete(false)} type="button">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </section>
  );
}
