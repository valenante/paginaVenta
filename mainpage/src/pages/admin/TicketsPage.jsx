import { useEffect, useState } from "react";
import api from "../../utils/api";
import Portal from "../../components/ui/Portal.jsx";
import "../../styles/TicketsPage.css";

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [estado, setEstado] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [tenant, setTenant] = useState("");
  const [search, setSearch] = useState("");

  // Modal
  const [selected, setSelected] = useState(null);
  const [nuevoMensaje, setNuevoMensaje] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {};

      if (estado) params.estado = estado;
      if (prioridad) params.prioridad = prioridad;
      if (tenant) params.tenant = tenant;
      if (search) params.search = search;

      const { data } = await api.get("/admin/superadmin/tickets", { params });
      setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [estado, prioridad, tenant, search]);

  // ============================
  // 📩 Enviar mensaje al ticket
  // ============================
  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    try {
      await api.post(`/admin/superadmin/tickets/${selected._id}/mensaje`, {
        autor: "superadmin",
        mensaje: nuevoMensaje,
      });

      setNuevoMensaje("");
      fetchTicket(selected._id); // recargar ticket
    } catch (err) {
      console.error("❌ Error enviando mensaje:", err);
    }
  };

  const fetchTicket = async (id) => {
    try {
      const { data } = await api.get(`/admin/superadmin/tickets/${id}`);
      setSelected(data.ticket);
    } catch (err) {
      console.error("❌ Error recargando ticket:", err);
    }
  };

  // ============================
  // ⚡ Actualizar estado/prioridad
  // ============================
  const updateTicket = async (updates) => {
    try {
      const { data } = await api.put(`/admin/superadmin/tickets/${selected._id}`, updates);
      setSelected(data.ticket);
      fetchTickets();
    } catch (err) {
      console.error("❌ Error actualizando ticket:", err);
    }
  };

  // ============================
  // 🗑 Eliminar ticket
  // ============================
  const eliminarTicket = async () => {
    if (!confirm("¿Eliminar ticket permanentemente?")) return;

    try {
      await api.delete(`/admin/superadmin/tickets/${selected._id}`);
      setSelected(null);
      fetchTickets();
    } catch (err) {
      console.error("❌ Error eliminando ticket:", err);
    }
  };

  // ============================
  // UI
  // ============================
  return (
    <section className="tickets">
      <header className="tickets__header">
        <div>
          <h1 className="tickets__title">🎫 Tickets de soporte</h1>
          <p className="tickets__subtitle">
            Filtra, prioriza y responde rápido: soporte que se siente premium.
          </p>
        </div>
      </header>

      {/* FILTROS */}
      <div className="tickets-filters" role="region" aria-label="Filtros de tickets">
        <select
          className="tickets-field"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="">Estado</option>
          <option value="abierto">Abierto</option>
          <option value="en_progreso">En progreso</option>
          <option value="resuelto">Resuelto</option>
          <option value="cerrado">Cerrado</option>
        </select>

        <select
          className="tickets-field"
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value)}
          aria-label="Filtrar por prioridad"
        >
          <option value="">Prioridad</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>

        <input
          className="tickets-field"
          type="text"
          placeholder="Tenant…"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          aria-label="Filtrar por tenant"
        />

        <input
          className="tickets-field"
          type="text"
          placeholder="Buscar asunto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar por asunto"
        />

        <button
          className="tickets-refreshBtn"
          onClick={fetchTickets}
          type="button"
          title="Actualizar"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* LISTA */}
      {loading ? (
        <p className="tickets-state tickets-state--muted">Cargando tickets…</p>
      ) : tickets.length === 0 ? (
        <p className="tickets-state tickets-state--muted">No hay tickets.</p>
      ) : (
        <div className="tickets-tableWrap">
          <table className="tickets-table">
            <thead className="tickets-table__thead">
              <tr>
                <th>Tenant</th>
                <th>Asunto</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>

            <tbody className="tickets-table__tbody">
              {tickets.map((t) => (
                <tr
                  key={t._id}
                  className="tickets-table__row"
                  onClick={() => setSelected(t)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelected(t);
                  }}
                  tabIndex={0}
                  role="button"
                  title="Abrir ticket"
                >
                  <td className="tickets-table__cell" data-label="Tenant">
                    {t.tenant}
                  </td>

                  <td className="tickets-table__cell tickets-subject" data-label="Asunto">
                    {t.asunto}
                  </td>

                  <td className="tickets-table__cell" data-label="Prioridad">
                    <span className={`tickets-pill tickets-pill--prio prio-${t.prioridad}`}>
                      {t.prioridad}
                    </span>
                  </td>

                  <td className="tickets-table__cell" data-label="Estado">
                    <span className={`tickets-pill tickets-pill--estado estado-${t.estado}`}>
                      {t.estado}
                    </span>
                  </td>

                  <td className="tickets-table__cell" data-label="Creado">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {selected && (
        <Portal>
          <div className="tickets-modal" onClick={() => setSelected(null)}>
            <div className="tickets-modal__content" onClick={(e) => e.stopPropagation()}>
              <header className="tickets-modal__header">
                <div>
                  <h2 className="tickets-modal__title">{selected.asunto}</h2>
                  <p className="tickets-modal__meta">
                    <strong>Tenant:</strong> {selected.tenant}
                  </p>
                </div>

                <button
                  className="tickets-modal__close"
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setSelected(null)}
                >
                  ✕
                </button>
              </header>

              <hr className="tickets-divider" />

              {/* Estado / Prioridad */}
              <div className="tickets-controls">
                <div className="tickets-control">
                  <label>Estado</label>
                  <select
                    className="tickets-field tickets-field--modal"
                    value={selected.estado}
                    onChange={(e) => updateTicket({ estado: e.target.value })}
                  >
                    <option value="abierto">Abierto</option>
                    <option value="en_progreso">En progreso</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>

                <div className="tickets-control">
                  <label>Prioridad</label>
                  <select
                    className="tickets-field tickets-field--modal"
                    value={selected.prioridad}
                    onChange={(e) => updateTicket({ prioridad: e.target.value })}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
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
                <input
                  className="tickets-field tickets-field--send"
                  type="text"
                  placeholder="Escribe un mensaje…"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
                />
                <button className="tickets-send__btn" onClick={enviarMensaje} type="button">
                  Enviar
                </button>
              </div>

              <button className="tickets-dangerBtn" onClick={eliminarTicket} type="button">
                🗑 Eliminar ticket
              </button>
            </div>
          </div>
        </Portal>
      )}
    </section>
  );
}
