import { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AlertaMensaje from "../../components/AlertaMensaje/AlertaMensaje.jsx";
import "./ReservasAjustesPage.css";

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const DEFAULT_DIAS_HABILITADOS = {
  domingo: true,
  lunes: true,
  martes: true,
  miércoles: true,
  jueves: true,
  viernes: true,
  sábado: true,
};

const FRANJA_DEFAULT = { horaInicio: "13:00", horaFin: "15:00", maxReservas: 10 };

const toISODate = (d) => {
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const cap = (s) => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);

const clampInt = (v, min = 1, max = 9999) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
};

const sanitizeFranjas = (arr) => {
  const a = Array.isArray(arr) ? arr : [];
  return a
    .map((f) => ({
      horaInicio: String(f?.horaInicio || "13:00").slice(0, 5),
      horaFin: String(f?.horaFin || "15:00").slice(0, 5),
      maxReservas: clampInt(f?.maxReservas ?? 10, 1, 9999),
    }))
    .filter((f) => f.horaInicio && f.horaFin);
};

export default function ReservasAjustesPage() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  // Config general
  const [franjas, setFranjas] = useState([]);
  const [diasHabilitados, setDiasHabilitados] = useState(DEFAULT_DIAS_HABILITADOS);

  // Fecha especial
  const [fechaEspecialExiste, setFechaEspecialExiste] = useState(false);
  const [habilitadoEspecial, setHabilitadoEspecial] = useState(false);
  const [franjasEspeciales, setFranjasEspeciales] = useState([]);

  // UI states
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEspecial, setLoadingEspecial] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingEspecial, setSavingEspecial] = useState(false);

  const fechaISO = useMemo(() => toISODate(fechaSeleccionada), [fechaSeleccionada]);

  // =========================
  // Loaders
  // =========================
  const cargarGeneral = async () => {
    setLoading(true);
    try {
      const [resFranjas, resDisp] = await Promise.all([
        api.get(`/reservasConfiguracion`, { params: { fecha: fechaISO } }),
        api.get("/disponibilidad"),
      ]);

      setFranjas(sanitizeFranjas(resFranjas?.data?.franjas));
      setDiasHabilitados(resDisp?.data || DEFAULT_DIAS_HABILITADOS);
    } catch (err) {
      console.error("❌ Error al cargar configuración general:", err);
      setAlerta({ tipo: "error", mensaje: "Error al cargar la configuración general." });
    } finally {
      setLoading(false);
    }
  };

  const cargarEspecial = async () => {
    setLoadingEspecial(true);
    try {
      const { data } = await api.get(`/reservas/fechasEspeciales/${fechaISO}`);

      // Si existe, el backend te devuelve { fecha, habilitado, franjas }
      setFechaEspecialExiste(true);
      setHabilitadoEspecial(!!data?.habilitado);
      setFranjasEspeciales(sanitizeFranjas(data?.franjas));
    } catch (err) {
      // Si no existe: reseteo silencioso
      setFechaEspecialExiste(false);
      setHabilitadoEspecial(false);
      setFranjasEspeciales([]);
    } finally {
      setLoadingEspecial(false);
    }
  };

  useEffect(() => {
    if (!fechaISO) return;

    // 🔥 Importante: recargar todo cuando cambia el día
    cargarGeneral();
    cargarEspecial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaISO]);

  // =========================
  // Handlers - Franjas (general)
  // =========================
  const updateFranja = (idx, key, value) => {
    setFranjas((prev) => {
      const next = [...prev];
      const cur = { ...(next[idx] || FRANJA_DEFAULT) };

      if (key === "maxReservas") cur.maxReservas = clampInt(value, 1, 9999);
      else cur[key] = String(value || "").slice(0, 5);

      next[idx] = cur;
      return next;
    });
  };

  const addFranja = () => setFranjas((prev) => [...prev, { ...FRANJA_DEFAULT }]);

  const removeFranja = (idx) =>
    setFranjas((prev) => prev.filter((_, i) => i !== idx));

  // =========================
  // Handlers - Franjas (especiales)
  // =========================
  const updateFranjaEspecial = (idx, key, value) => {
    setFranjasEspeciales((prev) => {
      const next = [...prev];
      const cur = { ...(next[idx] || FRANJA_DEFAULT) };

      if (key === "maxReservas") cur.maxReservas = clampInt(value, 1, 9999);
      else cur[key] = String(value || "").slice(0, 5);

      next[idx] = cur;
      return next;
    });
  };

  const addFranjaEspecial = () =>
    setFranjasEspeciales((prev) => [...prev, { ...FRANJA_DEFAULT }]);

  const removeFranjaEspecial = (idx) =>
    setFranjasEspeciales((prev) => prev.filter((_, i) => i !== idx));

  // =========================
  // Días habilitados
  // =========================
  const toggleDia = (dia) => {
    setDiasHabilitados((prev) => ({ ...prev, [dia]: !prev[dia] }));
  };

  // =========================
  // Guardar
  // =========================
  const guardarGeneral = async () => {
    try {
      setSavingGeneral(true);
      setAlerta(null);

      const payloadFranjas = sanitizeFranjas(franjas);

      await api.post("/reservasConfiguracion", {
        fecha: fechaISO,
        franjas: payloadFranjas,
      });

      await api.put("/reservas/disponibilidad", diasHabilitados);

      setAlerta({ tipo: "exito", mensaje: "Configuración general guardada." });
      // opcional: reload para asegurar consistencia
      cargarGeneral();
    } catch (err) {
      console.error("❌ Error guardando configuración general:", err);
      setAlerta({ tipo: "error", mensaje: "No se pudo guardar la configuración general." });
    } finally {
      setSavingGeneral(false);
    }
  };

  const guardarEspecial = async () => {
    try {
      setSavingEspecial(true);
      setAlerta(null);

      await api.post("/reservas/fechasEspeciales", {
        fecha: fechaISO,
        habilitado: !!habilitadoEspecial,
        franjas: habilitadoEspecial ? sanitizeFranjas(franjasEspeciales) : [],
      });

      setAlerta({ tipo: "exito", mensaje: "Fecha especial guardada." });
      cargarEspecial();
    } catch (err) {
      console.error("❌ Error guardando fecha especial:", err);
      setAlerta({ tipo: "error", mensaje: "No se pudo guardar la fecha especial." });
    } finally {
      setSavingEspecial(false);
    }
  };

  // =========================
  // Render
  // =========================
  const fechaPretty = useMemo(() => {
    try {
      return fechaSeleccionada.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return fechaISO;
    }
  }, [fechaSeleccionada, fechaISO]);

  return (
    <div className="reservas-ajustes-page">
      {/* HEADER */}
      <header className="reservas-ajustes-header">
        <div>
          <h2 className="config-title">⚙️ Configuración de reservas</h2>
          <p className="text-suave">
            Define días, horarios y fechas especiales para aceptar reservas desde la carta online.
          </p>
        </div>

        <div className="reservas-ajustes-fecha-pill" aria-label="Día seleccionado">
          <span className="pill-label">Día seleccionado</span>
          <span className="pill-value">{fechaPretty}</span>
        </div>
      </header>

      {/* GRID GENERAL */}
      <div className="reservas-ajustes-grid">
        {/* IZQUIERDA: general */}
        <section className="config-section card reservas-ajustes-main" aria-busy={loading}>
          <div className="reservas-main-header">
            <h3 className="section-title">🕐 Franjas y días habilitados</h3>
            <p className="section-description text-suave">
              Configura franjas del día seleccionado y los días de la semana habilitados por defecto.
            </p>
          </div>

          <div className="reservas-main-layout">
            {/* Columna: fecha + franjas */}
            <div className="reservas-franjas-panel">
              <div className="config-field">
                <label>Día de referencia</label>
                <DatePicker
                  selected={fechaSeleccionada}
                  onChange={setFechaSeleccionada}
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  className="input-date"
                  disabled={loading || savingGeneral || savingEspecial}
                />
              </div>

              <div className="reservas-franjas-list">
                {loading ? (
                  <p className="text-suave">Cargando franjas…</p>
                ) : franjas.length === 0 ? (
                  <p className="text-suave">No hay franjas definidas para este día. Añade una.</p>
                ) : (
                  franjas.map((f, i) => (
                    <div key={`${f.horaInicio}-${f.horaFin}-${i}`} className="franja-item card-secondary">
                      <div className="franja-horas">
                        <div className="franja-field">
                          <label>Inicio</label>
                          <input
                            type="time"
                            value={f.horaInicio}
                            onChange={(e) => updateFranja(i, "horaInicio", e.target.value)}
                            disabled={savingGeneral || savingEspecial}
                          />
                        </div>

                        <span className="franja-separador">—</span>

                        <div className="franja-field">
                          <label>Fin</label>
                          <input
                            type="time"
                            value={f.horaFin}
                            onChange={(e) => updateFranja(i, "horaFin", e.target.value)}
                            disabled={savingGeneral || savingEspecial}
                          />
                        </div>
                      </div>

                      <div className="franja-extra">
                        <div className="franja-field">
                          <label>Máx. reservas</label>
                          <input
                            type="number"
                            min="1"
                            value={f.maxReservas}
                            onChange={(e) => updateFranja(i, "maxReservas", e.target.value)}
                            disabled={savingGeneral || savingEspecial}
                          />
                        </div>

                        <button
                          type="button"
                          className="btn-icon btn-delete-franja"
                          onClick={() => removeFranja(i)}
                          aria-label="Eliminar franja"
                          disabled={savingGeneral || savingEspecial}
                          title="Eliminar franja"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                className="btn btn-secundario btn-add-franja"
                onClick={addFranja}
                disabled={loading || savingGeneral || savingEspecial}
              >
                ➕ Añadir franja
              </button>
            </div>

            {/* Columna: días habilitados */}
            <div className="reservas-dias-panel">
              <h4 className="subsection-title">📆 Días habilitados</h4>
              <p className="text-suave">Aplican por defecto a todas las semanas.</p>

              <div className="dias-grid" role="group" aria-label="Días habilitados">
                {DIAS_SEMANA.map((d) => {
                  const activo = !!diasHabilitados?.[d];
                  return (
                    <label
                      key={d}
                      className={`dia-pill ${activo ? "dia-activo" : "dia-inactivo"}`}
                      title={activo ? "Día habilitado" : "Día deshabilitado"}
                    >
                      <input
                        type="checkbox"
                        checked={activo}
                        onChange={() => toggleDia(d)}
                        disabled={loading || savingGeneral || savingEspecial}
                      />
                      <span>{cap(d).toLowerCase().replace(/^./, (c) => c.toUpperCase())}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="config-actions">
            <button
              type="button"
              onClick={guardarGeneral}
              className="btn btn-primario btn-guardar-config"
              disabled={loading || savingGeneral || savingEspecial}
            >
              {savingGeneral ? "Guardando..." : "💾 Guardar cambios generales"}
            </button>
          </div>
        </section>

        {/* DERECHA: fecha especial */}
        <section className="config-section card reservas-especial-card" aria-busy={loadingEspecial}>
          <h3 className="section-title">⭐ Fecha especial</h3>
          <p className="section-description text-suave">
            Sobrescribe los horarios estándar solo para este día.
          </p>

          {loadingEspecial ? (
            <p className="text-suave">Cargando configuración…</p>
          ) : fechaEspecialExiste ? (
            <p className="estado-especial badge badge-aviso">Esta fecha está marcada como especial.</p>
          ) : (
            <p className="estado-normal text-suave">Esta fecha usa la configuración estándar.</p>
          )}

          <div className="toggle-especial">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={habilitadoEspecial}
                onChange={(e) => setHabilitadoEspecial(e.target.checked)}
                disabled={loadingEspecial || savingGeneral || savingEspecial}
              />
              <span>Activar esta fecha como especial</span>
            </label>
          </div>

          {habilitadoEspecial && (
            <div className="franjas-especiales">
              <h4 className="subsection-title">⏰ Franjas especiales</h4>

              {franjasEspeciales.length === 0 ? (
                <p className="text-suave">No hay franjas especiales. Añade una.</p>
              ) : (
                franjasEspeciales.map((f, i) => (
                  <div
                    key={`${f.horaInicio}-${f.horaFin}-${i}`}
                    className="franja-especial-item card-secondary"
                  >
                    <div className="franja-horas">
                      <div className="franja-field">
                        <label>Inicio</label>
                        <input
                          type="time"
                          value={f.horaInicio}
                          onChange={(e) => updateFranjaEspecial(i, "horaInicio", e.target.value)}
                          disabled={savingGeneral || savingEspecial}
                        />
                      </div>

                      <span className="franja-separador">—</span>

                      <div className="franja-field">
                        <label>Fin</label>
                        <input
                          type="time"
                          value={f.horaFin}
                          onChange={(e) => updateFranjaEspecial(i, "horaFin", e.target.value)}
                          disabled={savingGeneral || savingEspecial}
                        />
                      </div>
                    </div>

                    <div className="franja-extra">
                      <div className="franja-field">
                        <label>Máx. reservas</label>
                        <input
                          type="number"
                          min="1"
                          value={f.maxReservas}
                          onChange={(e) => updateFranjaEspecial(i, "maxReservas", e.target.value)}
                          disabled={savingGeneral || savingEspecial}
                        />
                      </div>

                      <button
                        type="button"
                        className="btn-icon btn-delete-franja"
                        onClick={() => removeFranjaEspecial(i)}
                        aria-label="Eliminar franja especial"
                        disabled={savingGeneral || savingEspecial}
                        title="Eliminar franja especial"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}

              <button
                type="button"
                className="btn btn-secundario btn-add-franja-especial"
                onClick={addFranjaEspecial}
                disabled={savingGeneral || savingEspecial}
              >
                ➕ Añadir franja especial
              </button>
            </div>
          )}

          <div className="config-actions">
            <button
              type="button"
              className="btn btn-outline btn-guardar-especial"
              onClick={guardarEspecial}
              disabled={loadingEspecial || savingGeneral || savingEspecial}
            >
              {savingEspecial ? "Guardando..." : "💾 Guardar fecha especial"}
            </button>
          </div>
        </section>
      </div>

      {alerta && (
        <div className="reservas-ajustes-alerta">
          <AlertaMensaje
            tipo={alerta.tipo}
            mensaje={alerta.mensaje}
            onClose={() => setAlerta(null)}
          />
        </div>
      )}
    </div>
  );
}
