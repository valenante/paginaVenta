import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import api from "../../utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AlertaMensaje from "../../components/AlertaMensaje/AlertaMensaje.jsx";
import "./ReservasAjustesPage.css";

// Backend keys: sin tildes (miercoles, sabado)
const DIAS_SEMANA = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
// Labels para UI con tildes
const DIAS_LABEL = { domingo: "Domingo", lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves", viernes: "Viernes", sabado: "Sábado" };

const DEFAULT_DIAS = {
  domingo: true, lunes: true, martes: true, miercoles: true,
  jueves: true, viernes: true, sabado: true,
};

const FRANJA_DEFAULT = { horaInicio: "13:00", horaFin: "15:00", maxReservas: 10 };

const toISODate = (d) => {
  try { return new Date(d).toISOString().slice(0, 10); } catch { return ""; }
};
const clampInt = (v, min = 1, max = 9999) => {
  const n = Number(v);
  return !Number.isFinite(n) ? min : Math.max(min, Math.min(max, Math.trunc(n)));
};
const sanitizeFranjas = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((f) => ({
      horaInicio: String(f?.horaInicio || "13:00").slice(0, 5),
      horaFin: String(f?.horaFin || "15:00").slice(0, 5),
      maxReservas: clampInt(f?.maxReservas ?? 10, 1, 9999),
    }))
    .filter((f) => f.horaInicio && f.horaFin);

const normalizeDias = (input) => {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const dias = src.disponibilidad && typeof src.disponibilidad === "object"
    ? src.disponibilidad
    : src.dias && typeof src.dias === "object"
      ? src.dias
      : src;
  const out = {};
  for (const d of DIAS_SEMANA) out[d] = typeof dias[d] === "boolean" ? dias[d] : DEFAULT_DIAS[d];
  return out;
};

export default function ReservasAjustesPage({ onClose }) {
  const dialogRef = useRef(null);

  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [franjas, setFranjas] = useState([]);
  const [diasHabilitados, setDiasHabilitados] = useState(DEFAULT_DIAS);
  const [fechaEspecialExiste, setFechaEspecialExiste] = useState(false);
  const [habilitadoEspecial, setHabilitadoEspecial] = useState(false);
  const [franjasEspeciales, setFranjasEspeciales] = useState([]);
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEspecial, setLoadingEspecial] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingEspecial, setSavingEspecial] = useState(false);

  const fechaISO = useMemo(() => toISODate(fechaSeleccionada), [fechaSeleccionada]);
  const busy = loading || savingGeneral || savingEspecial;

  // ESC para cerrar
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cargarGeneral = useCallback(async () => {
    setLoading(true);
    try {
      const [resFranjas, resDisp] = await Promise.all([
        api.get("/reservas/configuracion", { params: { fecha: fechaISO } }),
        api.get("/reservas/disponibilidad"),
      ]);
      setFranjas(sanitizeFranjas(resFranjas?.data?.franjas));
      setDiasHabilitados(normalizeDias(resDisp?.data));
    } catch {
      setAlerta({ tipo: "error", mensaje: "Error al cargar la configuración general." });
    } finally {
      setLoading(false);
    }
  }, [fechaISO]);

  const cargarEspecial = useCallback(async () => {
    setLoadingEspecial(true);
    try {
      const { data } = await api.get(`/reservas/fechasEspeciales/${fechaISO}`);
      setFechaEspecialExiste(true);
      setHabilitadoEspecial(!!data?.habilitado);
      setFranjasEspeciales(sanitizeFranjas(data?.franjas));
    } catch {
      setFechaEspecialExiste(false);
      setHabilitadoEspecial(false);
      setFranjasEspeciales([]);
    } finally {
      setLoadingEspecial(false);
    }
  }, [fechaISO]);

  useEffect(() => {
    if (!fechaISO) return;
    cargarGeneral();
    cargarEspecial();
  }, [fechaISO, cargarGeneral, cargarEspecial]);

  // Franjas generales
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
  const removeFranja = (idx) => setFranjas((prev) => prev.filter((_, i) => i !== idx));

  // Franjas especiales
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
  const addFranjaEspecial = () => setFranjasEspeciales((prev) => [...prev, { ...FRANJA_DEFAULT }]);
  const removeFranjaEspecial = (idx) => setFranjasEspeciales((prev) => prev.filter((_, i) => i !== idx));

  const toggleDia = (dia) => setDiasHabilitados((prev) => ({ ...prev, [dia]: !prev[dia] }));

  const guardarGeneral = async () => {
    try {
      setSavingGeneral(true);
      setAlerta(null);
      await api.put("/reservas/configuracion", { fecha: fechaISO, franjas: sanitizeFranjas(franjas) });
      await api.put("/reservas/disponibilidad", normalizeDias(diasHabilitados));
      setAlerta({ tipo: "exito", mensaje: "Configuración general guardada." });
      cargarGeneral();
    } catch {
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
    } catch {
      setAlerta({ tipo: "error", mensaje: "No se pudo guardar la fecha especial." });
    } finally {
      setSavingEspecial(false);
    }
  };

  const fechaPretty = useMemo(() => {
    try {
      return fechaSeleccionada.toLocaleDateString("es-ES", {
        weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
      });
    } catch { return fechaISO; }
  }, [fechaSeleccionada, fechaISO]);

  const onOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const renderFranja = (f, i, { update, remove }) => (
    <div key={`${f.horaInicio}-${f.horaFin}-${i}`} className="ra-franja">
      <div className="ra-franja-row">
        <div className="mnr-field">
          <label>Inicio</label>
          <input type="time" value={f.horaInicio} onChange={(e) => update(i, "horaInicio", e.target.value)} disabled={busy} />
        </div>
        <div className="mnr-field">
          <label>Fin</label>
          <input type="time" value={f.horaFin} onChange={(e) => update(i, "horaFin", e.target.value)} disabled={busy} />
        </div>
      </div>
      <div className="ra-franja-extra">
        <div className="mnr-field">
          <label>Max. reservas</label>
          <input type="number" min="1" value={f.maxReservas} onChange={(e) => update(i, "maxReservas", e.target.value)} disabled={busy} />
        </div>
        <button type="button" className="ra-btn-delete" onClick={() => remove(i)} disabled={busy} aria-label="Eliminar franja" title="Eliminar">
          ✕
        </button>
      </div>
    </div>
  );

  return (
    <div className="mnr-overlay" onMouseDown={onOverlayMouseDown} role="presentation">
      <div
        ref={dialogRef}
        className="card mnr-dialog ra-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ra-title"
      >
        {/* HEADER — mismo patrón que ModalNuevaReserva */}
        <header className="mnr-header">
          <div className="mnr-headtext">
            <h2 id="ra-title" className="mnr-title">Configuracion de reservas</h2>
            <p className="mnr-subtitle text-suave">
              Define dias, horarios y fechas especiales para aceptar reservas.
            </p>
          </div>
          <button
            type="button"
            className="btn-icon-only mnr-close"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        </header>

        {/* BODY — scroll interno como mnr-form */}
        <div className="mnr-form ra-body">
          {alerta && (
            <AlertaMensaje tipo={alerta.tipo} mensaje={alerta.mensaje} onClose={() => setAlerta(null)} />
          )}

          {/* Día de referencia */}
          <div className="ra-date-row">
            <div className="mnr-field ra-date-field">
              <label>Dia de referencia</label>
              <DatePicker
                selected={fechaSeleccionada}
                onChange={setFechaSeleccionada}
                dateFormat="yyyy-MM-dd"
                minDate={new Date()}
                disabled={busy}
              />
            </div>
            <div className="ra-date-pill">
              <span className="ra-date-pill-label">Seleccionado</span>
              <span className="ra-date-pill-value">{fechaPretty}</span>
            </div>
          </div>

          {/* Franjas horarias */}
          <div className="ra-section">
            <div className="ra-section-header">
              <h3 className="ra-section-title">Franjas horarias</h3>
              <p className="mnr-subtitle text-suave">Horarios disponibles para el dia seleccionado.</p>
            </div>

            {loading ? (
              <p className="text-suave">Cargando franjas...</p>
            ) : franjas.length === 0 ? (
              <p className="text-suave">No hay franjas definidas para este dia.</p>
            ) : (
              franjas.map((f, i) => renderFranja(f, i, { update: updateFranja, remove: removeFranja }))
            )}

            <button type="button" className="btn btn-secundario" onClick={addFranja} disabled={busy}>
              + Añadir franja
            </button>
          </div>

          {/* Días habilitados */}
          <div className="ra-section">
            <div className="ra-section-header">
              <h3 className="ra-section-title">Dias habilitados</h3>
              <p className="mnr-subtitle text-suave">Aplican por defecto a todas las semanas.</p>
            </div>
            <div className="ra-dias-grid" role="group" aria-label="Dias habilitados">
              {DIAS_SEMANA.map((d) => {
                const on = !!diasHabilitados?.[d];
                return (
                  <label key={d} className={`ra-dia ${on ? "ra-dia--on" : "ra-dia--off"}`}>
                    <input type="checkbox" checked={on} onChange={() => toggleDia(d)} disabled={busy} />
                    <span>{DIAS_LABEL[d]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Guardar general */}
          <footer className="mnr-actions ra-actions-single">
            <button type="button" className="btn btn-primario mnr-btn" onClick={guardarGeneral} disabled={busy}>
              {savingGeneral ? "Guardando..." : "Guardar cambios generales"}
            </button>
          </footer>

          {/* Fecha especial */}
          <div className="ra-section ra-section--special">
            <div className="ra-section-header">
              <div>
                <h3 className="ra-section-title">Fecha especial</h3>
                <p className="mnr-subtitle text-suave">Sobrescribe los horarios estandar solo para el dia seleccionado.</p>
              </div>
              {loadingEspecial ? (
                <span className="badge badge-aviso">Cargando...</span>
              ) : fechaEspecialExiste ? (
                <span className="badge badge-aviso">Especial activa</span>
              ) : (
                <span className="badge badge-exito">Estandar</span>
              )}
            </div>

            <label className="ra-toggle">
              <input type="checkbox" checked={habilitadoEspecial} onChange={(e) => setHabilitadoEspecial(e.target.checked)} disabled={loadingEspecial || busy} />
              <span>Activar esta fecha como especial</span>
            </label>

            {habilitadoEspecial && (
              <>
                {franjasEspeciales.length === 0 ? (
                  <p className="text-suave">No hay franjas especiales. Añade una.</p>
                ) : (
                  franjasEspeciales.map((f, i) => renderFranja(f, i, { update: updateFranjaEspecial, remove: removeFranjaEspecial }))
                )}
                <button type="button" className="btn btn-secundario" onClick={addFranjaEspecial} disabled={busy}>
                  + Añadir franja especial
                </button>
              </>
            )}

            <footer className="mnr-actions ra-actions-single">
              <button type="button" className="btn btn-secundario mnr-btn" onClick={guardarEspecial} disabled={loadingEspecial || busy}>
                {savingEspecial ? "Guardando..." : "Guardar fecha especial"}
              </button>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
