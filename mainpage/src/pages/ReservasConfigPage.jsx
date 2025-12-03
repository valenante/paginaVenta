import { useEffect, useState } from "react";
import api from "../utils/api";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import ModalNuevaReserva from "../components/Reservas/ModalNuevaReserva.jsx";
import ReservasAjustesPage from "../components/Reservas/ReservasAjustesPage.jsx";
import { useFeature } from "../Hooks/useFeature";
import "../styles/ReservasConfigPage.css";

export default function ReservasConfigPage() {
  const [reservas, setReservas] = useState([]);
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("");
  const [alerta, setAlerta] = useState(null);
  const [modal, setModal] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Usa el hook centralizado: plan + config
  const reservasHabilitadas = useFeature("reservas.habilitadas", true);

  const cargarReservas = async () => {
    try {
      setLoading(true);
      const params = {};
      if (fecha) params.fecha = fecha;
      if (estado) params.estado = estado;

      const { data } = await api.get("/reservas/fecha", { params });
      setReservas(data);
    } catch (err) {
      console.error("❌ Error al obtener reservas:", err);
      setAlerta({ tipo: "error", mensaje: "Error al cargar reservas." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!reservasHabilitadas) return; // 👈 no golpeamos backend si la feature está off
    cargarReservas();
  }, [fecha, estado, reservasHabilitadas]);

  const confirmarReserva = async (id) => {
    try {
      await api.put(`/reservas/${id}/confirmar`);
      setAlerta({ tipo: "exito", mensaje: "Reserva confirmada." });
      cargarReservas();
    } catch (err) {
      console.error(err);
      setAlerta({ tipo: "error", mensaje: "Error al confirmar la reserva." });
    }
  };

  const cancelarReserva = (id) => {
    setModal({
      titulo: "Cancelar reserva",
      mensaje: "Escribe el motivo de la cancelación:",
      placeholder: "Motivo de la cancelación",
      onConfirm: async (razon) => {
        try {
          await api.put(`/reservas/${id}/cancelar`, { razon });
          setModal(null);
          setAlerta({ tipo: "info", mensaje: "Reserva cancelada correctamente." });
          cargarReservas();
        } catch (err) {
          console.error(err);
          setModal(null);
          setAlerta({ tipo: "error", mensaje: "Error al cancelar la reserva." });
        }
      },
      onClose: () => setModal(null),
    });
  };

   // 🔒 Si la feature está deshabilitada (por plan o por config) → cartel
  if (!reservasHabilitadas) {
    return (
      <section className="reservas-page section section--wide">
        <div className="card feature-blocked-card">
          <h2 className="feature-blocked-title">📅 Reservas desactivadas</h2>
          <p className="text-suave">
            El módulo de reservas está desactivado para este restaurante. Puedes seguir
            usando el TPV y la carta digital, pero no podrás gestionar reservas desde Alef.
          </p>
          <p className="feature-blocked-note text-suave">
            Si quieres activar las reservas online, revisa tu plan y la configuración del
            restaurante o contacta con nuestro equipo de soporte.
          </p>
          <span className="badge badge-aviso feature-blocked-badge">
            Módulo de reservas inactivo
          </span>
        </div>
      </section>
    );
  }

  // 🔓 Feature activa → UI normal
  return (
    <section className="reservas-page section section--wide">
      <div className="card reservas-card">
        {/* === HEADER === */}
        <header className="reservas-header">
          <div className="reservas-header-text">
            <h2 className="reservas-title">📅 Gestión de reservas</h2>
            <p className="reservas-subtitle text-suave">
              Consulta, filtra y gestiona las reservas de tu restaurante desde un único lugar.
            </p>
          </div>

          <button
            className="btn btn-secundario btn-icon-left btn-configuracion"
            onClick={() => setShowConfig(true)}
          >
            <span>⚙️</span>
            <span>Configuración</span>
          </button>
        </header>

        {/* === FILTROS === */}
        <section className="reservas-filtros">
          <div className="filtro-group">
            <label className="filtro-label">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="filtro-control"
            />
          </div>

          <div className="filtro-group">
            <label className="filtro-label">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="filtro-control"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmada">Confirmadas</option>
              <option value="auto-confirmada">Auto-confirmadas</option>
              <option value="rechazada">Rechazadas</option>
            </select>
          </div>

          <div className="filtro-actions">
            <button
              onClick={cargarReservas}
              disabled={loading}
              className="btn btn-secundario"
            >
              {loading ? "Cargando..." : "🔄 Refrescar"}
            </button>
          </div>
        </section>

        {/* === BOTÓN NUEVA RESERVA === */}
        <section className="nueva-reserva-bar">
          <button
            className="btn btn-primario btn-nueva-reserva"
            onClick={() => setModal({ tipo: "nueva" })}
          >
            ➕ Nueva reserva
          </button>
        </section>

        {/* === TABLA === */}
        <section className="tabla-reservas-wrapper">
          {reservas.length === 0 ? (
            <p className="sin-reservas text-suave">
              No hay reservas para mostrar con los filtros seleccionados.
            </p>
          ) : (
            <div className="tabla-reservas-scroll">
              <table className="tabla-reservas">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Personas</th>
                    <th>Fecha y hora</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th className="col-acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((r) => (
                    <tr key={r._id}>
                      <td>{r.nombre}</td>
                      <td>{r.personas}</td>
                      <td>
                        {new Date(r.hora).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>{r.telefono}</td>
                      <td>{r.email}</td>
                      <td>
                        <span className={`estado-reserva badge estado-${r.estado}`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="acciones">
                        {r.estado === "pendiente" ? (
                          <div className="acciones-buttons">
                            <button
                              className="btn btn-primario btn-compact btn-confirmar"
                              onClick={() => confirmarReserva(r._id)}
                            >
                              ✅ Confirmar
                            </button>
                            <button
                              className="btn btn-secundario btn-compact btn-cancelar"
                              onClick={() => cancelarReserva(r._id)}
                            >
                              ❌ Rechazar
                            </button>
                          </div>
                        ) : r.estado === "confirmada" ||
                          r.estado === "auto-confirmada" ? (
                          <button
                            className="btn btn-secundario btn-compact btn-cancelar"
                            onClick={() => cancelarReserva(r._id)}
                          >
                            🛑 Cancelar
                          </button>
                        ) : (
                          <span className="no-acciones text-suave">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* === MODAL CONFIGURACIÓN === */}
      {showConfig && (
        <div className="modal-overlay modal-config-overlay">
          <div className="card modal-config-contenido">
            <div className="modal-config-header">
              <h3>⚙️ Ajustes de reservas</h3>
              <button
                className="btn-icon-only cerrar-modal"
                onClick={() => setShowConfig(false)}
                aria-label="Cerrar configuración"
              >
                ✖
              </button>
            </div>
            <div className="modal-config-body">
              <ReservasAjustesPage />
            </div>
          </div>
        </div>
      )}

      {/* ALERTAS Y OTROS MODALES */}
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

      {modal && modal.tipo === "nueva" && (
        <ModalNuevaReserva onClose={() => setModal(null)} onCreated={cargarReservas} />
      )}

      {modal && modal.titulo && (
        <ModalConfirmacion
          titulo={modal.titulo}
          mensaje={modal.mensaje}
          placeholder={modal.placeholder}
          onConfirm={modal.onConfirm}
          onClose={modal.onClose}
        />
      )}
    </section>
  );
}
