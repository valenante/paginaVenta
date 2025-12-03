import { useState, useEffect } from "react";
import api from "../../utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AlertaMensaje from "../../components/AlertaMensaje/AlertaMensaje.jsx";
import "./ReservasAjustesPage.css";

export default function ReservasAjustesPage() {
  const [franjas, setFranjas] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [diasHabilitados, setDiasHabilitados] = useState({
    domingo: true,
    lunes: true,
    martes: true,
    miércoles: true,
    jueves: true,
    viernes: true,
    sábado: true,
  });
  const [alerta, setAlerta] = useState(null);
  const [fechaEspecial, setFechaEspecial] = useState(null);
  const [habilitadoEspecial, setHabilitadoEspecial] = useState(false);
  const [franjasEspeciales, setFranjasEspeciales] = useState([]);
  const [cargandoFechaEspecial, setCargandoFechaEspecial] = useState(false);

  const diasSemana = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const fecha = fechaSeleccionada.toISOString().slice(0, 10);

        const resFranjas = await api.get(
          `/reservasConfiguracion?fecha=${fecha}`
        );
        setFranjas(resFranjas.data?.franjas || []);

        const resDisp = await api.get("/disponibilidad");
        setDiasHabilitados(resDisp.data || diasHabilitados);

        cargarFechaEspecial();
      } catch (err) {
        console.error("❌ Error al cargar configuraciones:", err);
        setAlerta({
          tipo: "error",
          mensaje: "Error al obtener configuraciones",
        });
      }
    };

    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaSeleccionada]);

  const cargarFechaEspecial = async () => {
    const fecha = fechaSeleccionada.toISOString().slice(0, 10);
    try {
      setCargandoFechaEspecial(true);
      const { data } = await api.get(`/reservas/fechasEspeciales/${fecha}`);

      setFechaEspecial(data);
      setHabilitadoEspecial(data.habilitado);
      setFranjasEspeciales(data.franjas || []);
    } catch (err) {
      // No existe fecha especial → reset
      setFechaEspecial(null);
      setHabilitadoEspecial(false);
      setFranjasEspeciales([]);
    } finally {
      setCargandoFechaEspecial(false);
    }
  };

  const guardarFechaEspecial = async () => {
    try {
      const fecha = fechaSeleccionada.toISOString().slice(0, 10);

      await api.post("/reservas/fechasEspeciales", {
        fecha,
        franjas: franjasEspeciales,
        habilitado: habilitadoEspecial,
      });

      setAlerta({ tipo: "exito", mensaje: "Fecha especial guardada." });
      cargarFechaEspecial();
    } catch (err) {
      console.error("❌ Error guardando fecha especial:", err);
      setAlerta({
        tipo: "error",
        mensaje: "No se pudo guardar la fecha especial.",
      });
    }
  };

  const toggleDia = (dia) => {
    setDiasHabilitados((prev) => ({ ...prev, [dia]: !prev[dia] }));
  };

  const handleChangeFranja = (i, campo, valor) => {
    const actualizadas = [...franjas];
    actualizadas[i][campo] = valor;
    setFranjas(actualizadas);
  };

  const agregarFranja = () =>
    setFranjas([
      ...franjas,
      { horaInicio: "13:00", horaFin: "15:00", maxReservas: 10 },
    ]);

  const eliminarFranja = (i) =>
    setFranjas(franjas.filter((_, idx) => idx !== i));

  const guardar = async () => {
    try {
      await api.post("/reservas/configuracion", {
        fecha: fechaSeleccionada.toISOString().slice(0, 10),
        franjas,
      });
      await api.put("/reservas/disponibilidad", diasHabilitados);
      setAlerta({
        tipo: "exito",
        mensaje: "Configuración guardada correctamente",
      });
    } catch (err) {
      console.error("Error al guardar:", err);
      setAlerta({
        tipo: "error",
        mensaje: "Error al guardar configuración",
      });
    }
  };

  return (
    <div className="reservas-ajustes-page">
      {/* HEADER */}
      <header className="reservas-ajustes-header">
        <div>
          <h2 className="config-title">⚙️ Configuración de reservas</h2>
          <p className="text-suave">
            Define los días, horarios y fechas especiales en los que aceptarás
            reservas desde la carta online.
          </p>
        </div>

        <div className="reservas-ajustes-fecha-pill">
          <span className="pill-label">Día seleccionado</span>
          <span className="pill-value">
            {fechaSeleccionada.toLocaleDateString("es-ES", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </div>
      </header>

      <div className="reservas-ajustes-grid">
        {/* === CONFIG GENERAL: FECHA + FRANJAS + DÍAS === */}
        <section className="config-section card reservas-ajustes-main">
          <div className="reservas-main-header">
            <h3 className="section-title">🕐 Franjas y días habilitados</h3>
            <p className="section-description text-suave">
              Elige un día de referencia, define las franjas horarias y qué días
              de la semana están abiertos a reservas.
            </p>
          </div>

          <div className="reservas-main-layout">
            {/* Columna izquierda: fecha + franjas */}
            <div className="reservas-franjas-panel">
              <div className="config-field">
                <label>Selecciona un día de referencia</label>
                <DatePicker
                  selected={fechaSeleccionada}
                  onChange={setFechaSeleccionada}
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  className="input-date"
                />
              </div>

              <div className="reservas-franjas-list">
                {franjas.length === 0 && (
                  <p className="text-suave">
                    No hay franjas definidas para este día. Añade al menos una
                    franja para empezar.
                  </p>
                )}

                {franjas.map((f, i) => (
                  <div key={i} className="franja-item card-secondary">
                    <div className="franja-horas">
                      <div className="franja-field">
                        <label>Inicio</label>
                        <input
                          type="time"
                          value={f.horaInicio}
                          onChange={(e) =>
                            handleChangeFranja(i, "horaInicio", e.target.value)
                          }
                        />
                      </div>
                      <span className="franja-separador">—</span>
                      <div className="franja-field">
                        <label>Fin</label>
                        <input
                          type="time"
                          value={f.horaFin}
                          onChange={(e) =>
                            handleChangeFranja(i, "horaFin", e.target.value)
                          }
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
                          onChange={(e) =>
                            handleChangeFranja(
                              i,
                              "maxReservas",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <button
                        type="button"
                        className="btn-icon btn-delete-franja"
                        onClick={() => eliminarFranja(i)}
                        aria-label="Eliminar franja"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-secundario btn-add-franja"
                onClick={agregarFranja}
              >
                ➕ Añadir franja
              </button>
            </div>

            {/* Columna derecha: días habilitados */}
            <div className="reservas-dias-panel">
              <h4 className="subsection-title">📆 Días habilitados</h4>
              <p className="text-suave">
                Estos días se usarán por defecto para todas las semanas, salvo
                que marques una fecha como especial.
              </p>

              <div className="dias-grid">
                {diasSemana.map((d) => (
                  <label
                    key={d}
                    className={`dia-pill ${
                      diasHabilitados[d] ? "dia-activo" : "dia-inactivo"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={diasHabilitados[d]}
                      onChange={() => toggleDia(d)}
                    />
                    <span>
                      {d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="config-actions">
            <button
              type="button"
              onClick={guardar}
              className="btn btn-primario btn-guardar-config"
            >
              💾 Guardar cambios generales
            </button>
          </div>
        </section>

        {/* === FECHA ESPECIAL === */}
        <section className="config-section card reservas-especial-card">
          <h3 className="section-title">⭐ Fecha especial</h3>
          <p className="section-description text-suave">
            Para festivos, eventos o días con horario distinto. Estas
            configuraciones sobrescriben las franjas y días estándar solo para
            la fecha seleccionada.
          </p>

          {cargandoFechaEspecial ? (
            <p className="text-suave">Cargando configuración de la fecha…</p>
          ) : fechaEspecial ? (
            <p className="estado-especial badge badge-aviso">
              Esta fecha está actualmente marcada como especial.
            </p>
          ) : (
            <p className="estado-normal text-suave">
              Esta fecha se comporta como un día normal.
            </p>
          )}

          <div className="toggle-especial">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={habilitadoEspecial}
                onChange={(e) => setHabilitadoEspecial(e.target.checked)}
              />
              <span>Activar esta fecha como especial</span>
            </label>
          </div>

          {habilitadoEspecial && (
            <div className="franjas-especiales">
              <h4 className="subsection-title">⏰ Franjas especiales</h4>

              {franjasEspeciales.length === 0 && (
                <p className="text-suave">
                  No hay franjas especiales definidas. Añade una franja para
                  este día concreto.
                </p>
              )}

              {franjasEspeciales.map((f, i) => (
                <div key={i} className="franja-especial-item card-secondary">
                  <div className="franja-horas">
                    <div className="franja-field">
                      <label>Inicio</label>
                      <input
                        type="time"
                        value={f.horaInicio}
                        onChange={(e) => {
                          const arr = [...franjasEspeciales];
                          arr[i].horaInicio = e.target.value;
                          setFranjasEspeciales(arr);
                        }}
                      />
                    </div>

                    <span className="franja-separador">—</span>

                    <div className="franja-field">
                      <label>Fin</label>
                      <input
                        type="time"
                        value={f.horaFin}
                        onChange={(e) => {
                          const arr = [...franjasEspeciales];
                          arr[i].horaFin = e.target.value;
                          setFranjasEspeciales(arr);
                        }}
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
                        onChange={(e) => {
                          const arr = [...franjasEspeciales];
                          arr[i].maxReservas = Number(e.target.value);
                          setFranjasEspeciales(arr);
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn-icon btn-delete-franja"
                      onClick={() =>
                        setFranjasEspeciales(
                          franjasEspeciales.filter((_, idx) => idx !== i)
                        )
                      }
                      aria-label="Eliminar franja especial"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secundario btn-add-franja-especial"
                onClick={() =>
                  setFranjasEspeciales([
                    ...franjasEspeciales,
                    {
                      horaInicio: "13:00",
                      horaFin: "15:00",
                      maxReservas: 10,
                    },
                  ])
                }
              >
                ➕ Añadir franja especial
              </button>
            </div>
          )}

          <div className="config-actions">
            <button
              type="button"
              className="btn btn-outline btn-guardar-especial"
              onClick={guardarFechaEspecial}
            >
              💾 Guardar fecha especial
            </button>
          </div>
        </section>
      </div>

      {/* ALERTA GLOBAL */}
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
