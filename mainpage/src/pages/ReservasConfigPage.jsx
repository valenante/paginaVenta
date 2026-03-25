import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../utils/api";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import ModalNuevaReserva from "../components/Reservas/ModalNuevaReserva.jsx";
import ReservasAjustesPage from "../components/Reservas/ReservasAjustesPage.jsx";
import ErrorToast from "../components/common/ErrorToast.jsx";
import { normalizeApiError } from "../utils/normalizeApiError.js";
import { useFeature } from "../Hooks/useFeature";
import "../styles/ReservasConfigPage.css";

export default function ReservasConfigPage() {
  const [reservas, setReservas] = useState([]);
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("");

  const [alerta, setAlerta] = useState(null);
  const [error, setError] = useState(null);

  const [modal, setModal] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Usa el hook centralizado: plan + config
  const reservasHabilitadas = useFeature("reservas.habilitadas", true);

  const showAlert = useCallback((tipo, mensaje) => {
    setAlerta({ tipo, mensaje });
  }, []);

  const cargarReservas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (fecha) params.fecha = fecha;
      if (estado) params.estado = estado;

      const { data } = await api.get("/reservas/fecha", { params });
      setReservas(data);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setError({
        ...normalized,
        retryFn: cargarReservas,
      });
    } finally {
      setLoading(false);
    }
  }, [fecha, estado]);

  useEffect(() => {
    if (!reservasHabilitadas) return; // 👈 no golpeamos backend si la feature está off
    cargarReservas();
  }, [fecha, estado, reservasHabilitadas, cargarReservas]);

  const confirmarReserva = useCallback(
    async (id) => {
      try {
        setError(null);
        await api.put(`/reservas/${id}/confirmar`);
        showAlert("exito", "Reserva confirmada.");
        cargarReservas();
      } catch (err) {
        const normalized = normalizeApiError(err);
        setError({
          ...normalized,
          retryFn: () => confirmarReserva(id),
        });
      }
    },
    [cargarReservas, showAlert]
  );

  const abrirCancelarReserva = useCallback(
    (id) => {
      setModal({
        titulo: "Cancelar reserva",
        mensaje: "Escribe el motivo de la cancelación:",
        placeholder: "Motivo de la cancelación",
        onConfirm: async (razon) => {
          try {
            setError(null);
            await api.put(`/reservas/${id}/cancelar`, { razon });
            setModal(null);
            showAlert("info", "Reserva cancelada correctamente.");
            cargarReservas();
          } catch (err) {
            setModal(null);
            const normalized = normalizeApiError(err);
            setError({
              ...normalized,
              retryFn: () => abrirCancelarReserva(id), // reabre modal (simple)
            });
          }
        },
        onClose: () => setModal(null),
      });
    },
    [cargarReservas, showAlert]
  );

  // 🔒 Feature deshabilitada → cartel
  if (!reservasHabilitadas) {
    return (
      <section className="cfg-page section section--wide">
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

        {error && (
          <ErrorToast
            error={error}
            onRetry={error.canRetry ? error.retryFn : undefined}
            onClose={() => setError(null)}
          />
        )}
      </section>
    );
  }

  /* bloque eliminado: código muerto (la misma condición ya se evalúa arriba) */

  return (
    <main className="reservas-config-page cfg-page section section--wide">
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

      {error && (
        <ErrorToast
          error={error}
          onRetry={error.canRetry ? error.retryFn : undefined}
          onClose={() => setError(null)}
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

      <header className="cfg-header">
        <div>
          <h1>📅 Gestión de reservas</h1>
          <p className="text-suave">
            Consulta, filtra y administra las reservas del restaurante desde una
            vista Alef clara, ordenada y preparada para escritorio, tablet y móvil.
          </p>
        </div>

        <div className="cfg-header-status">
          <span className="badge badge-exito">Reservas activas</span>
        </div>
      </header>

      <div className="reservas-config-layout">
        <div className="reservas-config-main">
          {/* RESUMEN + ACCIONES */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Resumen y herramientas</h2>
                <p className="config-card-subtitle">
                  Revisa el estado general del módulo y accede rápidamente a la
                  configuración o a la creación manual de reservas.
                </p>
              </div>
            </div>

            <div className="reservas-config-toolbar">
              <button
                className="btn btn-secundario"
                onClick={() => setShowConfig(true)}
              >
                ⚙️ Configuración
              </button>

              <button
                className="btn btn-secundario"
                onClick={cargarReservas}
                disabled={loading}
              >
                {loading ? "Cargando..." : "🔄 Refrescar"}
              </button>

              <button
                className="btn btn-primario"
                onClick={() => setModal({ tipo: "nueva" })}
              >
                ➕ Nueva reserva
              </button>
            </div>

            <div className="reservas-config-stats">
              <article className="reservas-config-stat">
                <span className="reservas-config-stat__label">Reservas visibles</span>
                <strong>{reservas.length}</strong>
              </article>

              <article className="reservas-config-stat">
                <span className="reservas-config-stat__label">Filtro por fecha</span>
                <strong>{fecha || "Todas"}</strong>
              </article>

              <article className="reservas-config-stat">
                <span className="reservas-config-stat__label">Filtro por estado</span>
                <strong>{estado || "Todos"}</strong>
              </article>
            </div>
          </section>

          {/* FILTROS */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Filtros</h2>
                <p className="config-card-subtitle">
                  Acota la búsqueda por fecha y estado para localizar reservas más
                  rápido.
                </p>
              </div>
            </div>

            <div className="reservas-config-filtros">
              <div className="config-field">
                <label>Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>

              <div className="config-field">
                <label>Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="confirmada">Confirmadas</option>
                  <option value="auto-confirmada">Auto-confirmadas</option>
                  <option value="rechazada">Rechazadas</option>
                </select>
              </div>
            </div>
          </section>

          {/* TABLA */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Listado de reservas</h2>
                <p className="config-card-subtitle">
                  Visualiza el detalle de cada reserva y ejecuta acciones según su
                  estado actual.
                </p>
              </div>
            </div>

            <div className="reservas-table-wrapper">
              {reservas.length === 0 ? (
                <div className="reservas-empty-state">
                  <p className="text-suave">
                    No hay reservas para mostrar con los filtros seleccionados.
                  </p>
                </div>
              ) : (
                <>
                {/* ── DESKTOP: tabla ── */}
                <div className="reservas-table-scroll reservas-desktop">
                  <table className="reservas-table">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Personas</th>
                        <th>Reserva para</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Creada el</th>
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
                            {r.creadaEn || r.createdAt
                              ? new Date(r.creadaEn || r.createdAt).toLocaleString("es-ES", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                              : "—"}
                          </td>
                          <td>
                            <span className={`estado-reserva badge estado-${r.estado}`}>
                              {r.estado}
                            </span>
                          </td>
                          <td className="acciones">
                            {r.estado === "pendiente" ? (
                              <div className="acciones-buttons">
                                <button
                                  className="btn btn-primario btn-compact"
                                  onClick={() => confirmarReserva(r._id)}
                                >
                                  ✅ Confirmar
                                </button>
                                <button
                                  className="btn btn-secundario btn-compact"
                                  onClick={() => abrirCancelarReserva(r._id)}
                                >
                                  ❌ Rechazar
                                </button>
                              </div>
                            ) : r.estado === "confirmada" || r.estado === "auto-confirmada" ? (
                              <button
                                className="btn btn-secundario btn-compact"
                                onClick={() => abrirCancelarReserva(r._id)}
                              >
                                🛑 Cancelar
                              </button>
                            ) : (
                              <span className="text-suave">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── MOBILE: cards ── */}
                <div className="reservas-mobile">
                  {reservas.map((r) => (
                    <div key={r._id} className="reserva-mcard">
                      <div className="reserva-mcard-head">
                        <strong className="reserva-mcard-name">{r.nombre}</strong>
                        <span className={`estado-reserva badge estado-${r.estado}`}>
                          {r.estado}
                        </span>
                      </div>

                      <div className="reserva-mcard-grid">
                        <div>
                          <span className="reserva-mcard-k">Personas</span>
                          <span className="reserva-mcard-v">{r.personas}</span>
                        </div>
                        <div>
                          <span className="reserva-mcard-k">Reserva para</span>
                          <span className="reserva-mcard-v">
                            {new Date(r.hora).toLocaleString("es-ES", {
                              day: "2-digit", month: "2-digit",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {r.telefono && (
                          <div>
                            <span className="reserva-mcard-k">Teléfono</span>
                            <span className="reserva-mcard-v">{r.telefono}</span>
                          </div>
                        )}
                        {r.email && (
                          <div>
                            <span className="reserva-mcard-k">Email</span>
                            <span className="reserva-mcard-v">{r.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="reserva-mcard-actions">
                        {r.estado === "pendiente" ? (
                          <>
                            <button
                              className="btn btn-primario btn-compact"
                              onClick={() => confirmarReserva(r._id)}
                            >
                              ✅ Confirmar
                            </button>
                            <button
                              className="btn btn-secundario btn-compact"
                              onClick={() => abrirCancelarReserva(r._id)}
                            >
                              ❌ Rechazar
                            </button>
                          </>
                        ) : r.estado === "confirmada" || r.estado === "auto-confirmada" ? (
                          <button
                            className="btn btn-secundario btn-compact"
                            onClick={() => abrirCancelarReserva(r._id)}
                          >
                            🛑 Cancelar
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {showConfig && (
        <div className="modal-overlay modal-config-overlay">
          <div className="card modal-config-contenido reservas-config-modal">
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
    </main>
  );
}