import { useEffect, useState, useCallback } from "react";
import api from "../utils/api";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import ModalNuevaReserva from "../components/Reservas/ModalNuevaReserva.jsx";
import ReservasAjustesPage from "../components/Reservas/ReservasAjustesPage.jsx";
import ErrorToast from "../components/common/ErrorToast.jsx";
import { normalizeApiError } from "../utils/normalizeApiError.js";
import { useFeature } from "../Hooks/useFeature";
import "../styles/ReservasConfigPage.css";

const fmtFecha = (v) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
};

export default function ReservasConfigPage() {
  const [reservas, setReservas] = useState([]);
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("");
  const [alerta, setAlerta] = useState(null);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [showAjustes, setShowAjustes] = useState(false);
  const [loading, setLoading] = useState(false);

  const reservasHabilitadas = useFeature("reservas.habilitadas", true);

  const cargarReservas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (fecha) params.fecha = fecha;
      if (estado) params.estado = estado;
      const { data } = await api.get("/reservas/fecha", { params });
      setReservas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError({ ...normalizeApiError(err), retryFn: cargarReservas });
    } finally {
      setLoading(false);
    }
  }, [fecha, estado]);

  useEffect(() => {
    if (!reservasHabilitadas) return;
    cargarReservas();
  }, [fecha, estado, reservasHabilitadas, cargarReservas]);

  const confirmarReserva = useCallback(async (id) => {
    try {
      setError(null);
      await api.put(`/reservas/${id}/confirmar`);
      setAlerta({ tipo: "exito", mensaje: "Reserva confirmada." });
      cargarReservas();
    } catch (err) {
      setError({ ...normalizeApiError(err), retryFn: () => confirmarReserva(id) });
    }
  }, [cargarReservas]);

  const abrirCancelarReserva = useCallback((id) => {
    setModal({
      titulo: "Cancelar reserva",
      mensaje: "Escribe el motivo de la cancelación:",
      placeholder: "Motivo de la cancelación",
      onConfirm: async (razon) => {
        try {
          setError(null);
          await api.put(`/reservas/${id}/cancelar`, { razon });
          setModal(null);
          setAlerta({ tipo: "exito", mensaje: "Reserva cancelada." });
          cargarReservas();
        } catch (err) {
          setModal(null);
          setError({ ...normalizeApiError(err), retryFn: () => abrirCancelarReserva(id) });
        }
      },
      onClose: () => setModal(null),
    });
  }, [cargarReservas]);

  if (!reservasHabilitadas) {
    return (
      <section className="cfg-page section section--wide">
        <div className="card rc-blocked-card">
          <h2>Reservas desactivadas</h2>
          <p className="cfg-note">
            El módulo de reservas está desactivado. Puedes seguir usando el TPV y la carta digital.
            Para activar reservas, revisa tu plan o contacta con soporte.
          </p>
          <span className="badge badge-aviso">Módulo inactivo</span>
        </div>
        {error && <ErrorToast error={error} onRetry={error.canRetry ? error.retryFn : undefined} onClose={() => setError(null)} />}
      </section>
    );
  }

  const renderActions = (r) => {
    if (r.estado === "pendiente") {
      return (
        <div className="cfg-actions">
          <button className="btn btn-primario cfg-btn-compact" onClick={() => confirmarReserva(r._id)}>Confirmar</button>
          <button className="btn btn-secundario cfg-btn-compact" onClick={() => abrirCancelarReserva(r._id)}>Rechazar</button>
        </div>
      );
    }
    if (r.estado === "confirmada" || r.estado === "auto-confirmada") {
      return <button className="btn btn-secundario cfg-btn-compact" onClick={() => abrirCancelarReserva(r._id)}>Cancelar</button>;
    }
    return <span className="text-suave">—</span>;
  };

  return (
    <main className="reservas-config-page cfg-page cfg-page--fixed-bar section section--wide">
      {alerta && <AlertaMensaje tipo={alerta.tipo} mensaje={alerta.mensaje} onClose={() => setAlerta(null)} />}
      {error && <ErrorToast error={error} onRetry={error.canRetry ? error.retryFn : undefined} onClose={() => setError(null)} />}

      {modal && modal.tipo === "nueva" && <ModalNuevaReserva onClose={() => setModal(null)} onCreated={cargarReservas} />}
      {modal && modal.titulo && <ModalConfirmacion titulo={modal.titulo} mensaje={modal.mensaje} placeholder={modal.placeholder} onConfirm={modal.onConfirm} onClose={modal.onClose} />}

      <header className="reservas-config-header cfg-header">
        <div>
          <h1>Gestión de reservas</h1>
          <p className="text-suave">Consulta, filtra y administra las reservas del restaurante.</p>
        </div>
        <div className="reservas-config-header-status">
          <span className="badge badge-exito">Reservas activas</span>
        </div>
      </header>

      <div className="reservas-config-layout cfg-layout">
        <div className="reservas-config-main cfg-main">
          {/* Toolbar + Stats */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Resumen y herramientas</h2>
                <p className="config-card-subtitle">Estado general y acciones rápidas.</p>
              </div>
            </div>

            <div className="cfg-toolbar">
              <button className="btn btn-secundario" onClick={() => setShowAjustes(true)}>Configuracion</button>
              <button className="btn btn-secundario" onClick={cargarReservas} disabled={loading}>{loading ? "Cargando..." : "Refrescar"}</button>
              <button className="btn btn-primario" onClick={() => setModal({ tipo: "nueva" })}>+ Nueva reserva</button>
            </div>

            <div className="cfg-stats">
              <article className="cfg-stat">
                <span className="cfg-stat__label">Reservas visibles</span>
                <strong>{reservas.length}</strong>
              </article>
              <article className="cfg-stat">
                <span className="cfg-stat__label">Filtro fecha</span>
                <strong>{fecha || "Todas"}</strong>
              </article>
              <article className="cfg-stat">
                <span className="cfg-stat__label">Filtro estado</span>
                <strong>{estado || "Todos"}</strong>
              </article>
            </div>
          </section>

          {/* Filters */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Filtros</h2>
                <p className="config-card-subtitle">Acota la búsqueda por fecha y estado.</p>
              </div>
            </div>
            <div className="cfg-filtros">
              <div className="config-field">
                <label>Fecha</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="config-field">
                <label>Estado</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="confirmada">Confirmadas</option>
                  <option value="auto-confirmada">Auto-confirmadas</option>
                  <option value="rechazada">Rechazadas</option>
                </select>
              </div>
            </div>
          </section>

          {/* Table */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Listado de reservas</h2>
                <p className="config-card-subtitle">Detalle de cada reserva con acciones según estado.</p>
              </div>
            </div>

            {reservas.length === 0 ? (
              <div className="cfg-empty">No hay reservas para los filtros seleccionados.</div>
            ) : (
              <>
                {/* Desktop */}
                <div className="cfg-table-scroll rc-desktop">
                  <table className="cfg-table">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Pers.</th>
                        <th>Reserva para</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Creada</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas.map((r) => (
                        <tr key={r._id}>
                          <td><strong>{r.nombre}</strong></td>
                          <td>{r.personas}</td>
                          <td>{fmtFecha(r.hora)}</td>
                          <td>{r.telefono}</td>
                          <td>{r.email}</td>
                          <td>{fmtFecha(r.creadaEn || r.createdAt)}</td>
                          <td><span className={`badge rc-estado rc-estado--${r.estado}`}>{r.estado}</span></td>
                          <td>{renderActions(r)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="rc-mcards">
                  {reservas.map((r) => (
                    <div key={r._id} className="rc-mcard">
                      <div className="rc-mcard-head">
                        <strong>{r.nombre}</strong>
                        <span className={`badge rc-estado rc-estado--${r.estado}`}>{r.estado}</span>
                      </div>
                      <div className="rc-mcard-grid">
                        <div><span className="rc-mcard-k">Personas</span><span className="rc-mcard-v">{r.personas}</span></div>
                        <div><span className="rc-mcard-k">Para</span><span className="rc-mcard-v">{fmtFecha(r.hora)}</span></div>
                        {r.telefono && <div><span className="rc-mcard-k">Tel.</span><span className="rc-mcard-v">{r.telefono}</span></div>}
                        {r.email && <div><span className="rc-mcard-k">Email</span><span className="rc-mcard-v">{r.email}</span></div>}
                      </div>
                      <div className="rc-mcard-actions">{renderActions(r)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

        </div>
      </div>

      {showAjustes && (
        <ReservasAjustesPage onClose={() => setShowAjustes(false)} />
      )}
    </main>
  );
}
