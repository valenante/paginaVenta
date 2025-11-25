import { useEffect, useState } from "react";
import api from "../../utils/api";
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

      const { data } = await api.get("/superadmin/tickets", { params });
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
      await api.post(`/superadmin/tickets/${selected._id}/mensaje`, {
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
      const { data } = await api.get(`/superadmin/tickets/${id}`);
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
      const { data } = await api.put(`/superadmin/tickets/${selected._id}`, updates);
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
      await api.delete(`/superadmin/tickets/${selected._id}`);
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
    <div className="tickets-page">
      <h1>🎫 Tickets de soporte</h1>

      {/* FILTROS */}
      <div className="ticket-filtros">
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Estado</option>
          <option value="abierto">Abierto</option>
          <option value="en_progreso">En progreso</option>
          <option value="resuelto">Resuelto</option>
          <option value="cerrado">Cerrado</option>
        </select>

        <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
          <option value="">Prioridad</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>

        <input
          type="text"
          placeholder="Tenant..."
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
        />

        <input
          type="text"
          placeholder="Buscar asunto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={fetchTickets}>🔄 Actualizar</button>
      </div>

      {/* TABLA */}
      {loading ? (
        <p>Cargando tickets...</p>
      ) : tickets.length === 0 ? (
        <p>No hay tickets.</p>
      ) : (
        <table className="tickets-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Asunto</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Creado</th>
            </tr>
          </thead>

          <tbody>
            {tickets.map((t) => (
              <tr key={t._id} onClick={() => setSelected(t)}>
                <td>{t.tenant}</td>
                <td>{t.asunto}</td>
                <td className={`prio prio-${t.prioridad}`}>{t.prioridad}</td>
                <td>{t.estado}</td>
                <td>{new Date(t.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL */}
      {selected && (
        <div className="ticket-modal" onClick={() => setSelected(null)}>
          <div className="ticket-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selected.asunto}</h2>
            <p><strong>Tenant:</strong> {selected.tenant}</p>

            <hr />

            {/* ESTADO Y PRIORIDAD */}
            <div className="ticket-data-row">
              <label>Estado:</label>
              <select
                value={selected.estado}
                onChange={(e) => updateTicket({ estado: e.target.value })}
              >
                <option value="abierto">Abierto</option>
                <option value="en_progreso">En progreso</option>
                <option value="resuelto">Resuelto</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>

            <div className="ticket-data-row">
              <label>Prioridad:</label>
              <select
                value={selected.prioridad}
                onChange={(e) => updateTicket({ prioridad: e.target.value })}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <hr />

            {/* CHAT */}
            <h3>Mensajes</h3>
            <div className="ticket-chat">
              {selected.mensajes.map((m, idx) => (
                <div key={idx} className={`mensaje mensaje-${m.autor}`}>
                  <p>{m.mensaje}</p>
                  <span>{new Date(m.fecha).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* ENVIAR MENSAJE */}
            <div className="mensaje-form">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
              />
              <button onClick={enviarMensaje}>Enviar</button>
            </div>

            {/* BOTÓN ELIMINAR */}
            <button className="delete-ticket-btn" onClick={eliminarTicket}>
              🗑 Eliminar ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
