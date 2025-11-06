import { useEffect, useState } from "react";
import api from "../utils/api";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import ModalNuevaReserva from "../components/Reservas/ModalNuevaReserva.jsx";
import ReservasAjustesPage from "../components/Reservas/ReservasAjustesPage.jsx";
import "../styles/ReservasConfigPage.css";

export default function ReservasConfigPage() {
  const [reservas, setReservas] = useState([]);
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("");
  const [alerta, setAlerta] = useState(null);
  const [modal, setModal] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);

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
    cargarReservas();
  }, [fecha, estado]);

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

  return (
    <div className="reservas-page">
      <div className="reservas-card">
        <div className="reservas-header">
          <h2>📅 Gestión de Reservas</h2>
          <button className="btn-configuracion" onClick={() => setShowConfig(true)}>
            ⚙️ Configuración
          </button>
        </div>

        {/* === FILTROS === */}
        <div className="reservas-filtros">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmada">Confirmadas</option>
            <option value="auto-confirmada">Auto-confirmadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
          <button onClick={cargarReservas} disabled={loading}>
            {loading ? "Cargando..." : "🔄 Refrescar"}
          </button>
        </div>

        {/* === BOTÓN NUEVA RESERVA === */}
        <div className="nueva-reserva-bar">
          <button className="btn-nueva-reserva" onClick={() => setModal({ tipo: "nueva" })}>
            ➕ Nueva reserva
          </button>
        </div>

        {/* === TABLA === */}
        <div className="tabla-reservas">
          {reservas.length === 0 ? (
            <p className="sin-reservas">No hay reservas para mostrar.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Personas</th>
                  <th>Fecha y hora</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Acciones</th>
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
                      <span className={`estado-reserva estado-${r.estado}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="acciones">
                      {r.estado === "pendiente" ? (
                        <>
                          <button
                            className="btn-confirmar"
                            onClick={() => confirmarReserva(r._id)}
                          >
                            ✅ Confirmar
                          </button>
                          <button
                            className="btn-cancelar"
                            onClick={() => cancelarReserva(r._id)}
                          >
                            ❌ Rechazar
                          </button>
                        </>
                      ) : r.estado === "confirmada" || r.estado === "auto-confirmada" ? (
                        <button
                          className="btn-cancelar"
                          onClick={() => cancelarReserva(r._id)}
                        >
                          🛑 Cancelar
                        </button>
                      ) : (
                        <span className="no-acciones">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* === MODAL CONFIGURACIÓN === */}
      {showConfig && (
        <div className="modal-config-overlay">
          <div className="modal-config-contenido">
            <button className="cerrar-modal" onClick={() => setShowConfig(false)}>
              ✖
            </button>
            <ReservasAjustesPage />
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
        <ModalNuevaReserva
          onClose={() => setModal(null)}
          onCreated={cargarReservas}
        />
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
    </div>
  );
}
