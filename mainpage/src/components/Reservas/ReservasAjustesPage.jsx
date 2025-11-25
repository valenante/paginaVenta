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

  const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const fecha = fechaSeleccionada.toISOString().slice(0, 10);

        const resFranjas = await api.get(`/reservasConfiguracion?fecha=${fecha}`);
        setFranjas(resFranjas.data?.franjas || []);

        const resDisp = await api.get("/disponibilidad");
        setDiasHabilitados(resDisp.data || diasHabilitados);

        cargarFechaEspecial();
      } catch (err) {
        console.error("❌ Error al cargar configuraciones:", err);
        setAlerta({ tipo: "error", mensaje: "Error al obtener configuraciones" });
      }
    };

    cargarDatos();
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
      setAlerta({ tipo: "error", mensaje: "No se pudo guardar la fecha especial." });
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

  const agregarFranja = () => setFranjas([...franjas, { horaInicio: "13:00", horaFin: "15:00", maxReservas: 10 }]);

  const eliminarFranja = (i) => setFranjas(franjas.filter((_, idx) => idx !== i));

  const guardar = async () => {
    try {
      await api.post("/reservas/configuracion", {
        fecha: fechaSeleccionada.toISOString().slice(0, 10),
        franjas,
      });
      await api.put("/reservas/disponibilidad", diasHabilitados);
      setAlerta({ tipo: "exito", mensaje: "Configuración guardada correctamente" });
    } catch (err) {
      console.error("Error al guardar:", err);
      setAlerta({ tipo: "error", mensaje: "Error al guardar configuración" });
    }
  };

  return (
    <div className="reservas-ajustes-page">
      <h2>⚙️ Configuración de Reservas</h2>

      <div className="fecha-selector">
        <label>Selecciona un día:</label>
        <DatePicker selected={fechaSeleccionada} onChange={setFechaSeleccionada} dateFormat="yyyy-MM-dd" minDate={new Date()} />
      </div>

      <section className="franjas-config">
        <h3>🕐 Franjas Horarias</h3>
        {franjas.map((f, i) => (
          <div key={i} className="franja-item">
            <input type="time" value={f.horaInicio} onChange={(e) => handleChangeFranja(i, "horaInicio", e.target.value)} />
            <span>—</span>
            <input type="time" value={f.horaFin} onChange={(e) => handleChangeFranja(i, "horaFin", e.target.value)} />
            <input type="number" min="1" value={f.maxReservas} onChange={(e) => handleChangeFranja(i, "maxReservas", e.target.value)} />
            <button onClick={() => eliminarFranja(i)}>🗑</button>
          </div>
        ))}
        <button onClick={agregarFranja}>➕ Añadir franja</button>
      </section>

      <section className="dias-config">
        <h3>📆 Días Habilitados</h3>
        <div className="dias-grid">
          {diasSemana.map((d) => (
            <label key={d}>
              <input type="checkbox" checked={diasHabilitados[d]} onChange={() => toggleDia(d)} />
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </label>
          ))}
        </div>
      </section>

      <section className="fecha-especial-section">
        <h3>⭐ Configuración de Fecha Especial</h3>

        {cargandoFechaEspecial ? (
          <p>Cargando...</p>
        ) : fechaEspecial ? (
          <p className="estado-especial">Esta fecha está configurada como especial.</p>
        ) : (
          <p className="estado-normal">Esta fecha es un día normal.</p>
        )}

        <div className="toggle-especial">
          <label>
            <input
              type="checkbox"
              checked={habilitadoEspecial}
              onChange={(e) => setHabilitadoEspecial(e.target.checked)}
            />
            Activar como fecha especial
          </label>
        </div>

        {habilitadoEspecial && (
          <div className="franjas-especiales">
            <h4>⏰ Franjas especiales</h4>
            {franjasEspeciales.map((f, i) => (
              <div key={i} className="franja-especial-item">
                <input
                  type="time"
                  value={f.horaInicio}
                  onChange={(e) => {
                    const arr = [...franjasEspeciales];
                    arr[i].horaInicio = e.target.value;
                    setFranjasEspeciales(arr);
                  }}
                />
                <input
                  type="time"
                  value={f.horaFin}
                  onChange={(e) => {
                    const arr = [...franjasEspeciales];
                    arr[i].horaFin = e.target.value;
                    setFranjasEspeciales(arr);
                  }}
                />
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
                <button onClick={() =>
                  setFranjasEspeciales(franjasEspeciales.filter((_, idx) => idx !== i))
                }>
                  🗑
                </button>
              </div>
            ))}

            <button
              onClick={() =>
                setFranjasEspeciales([
                  ...franjasEspeciales,
                  { horaInicio: "13:00", horaFin: "15:00", maxReservas: 10 },
                ])
              }
            >
              ➕ Añadir franja especial
            </button>
          </div>
        )}

        <button className="btn-guardar-especial" onClick={guardarFechaEspecial}>
          💾 Guardar fecha especial
        </button>
      </section>

      <button onClick={guardar} className="btn-guardar-config">💾 Guardar cambios</button>

      {alerta && <AlertaMensaje tipo={alerta.tipo} mensaje={alerta.mensaje} onClose={() => setAlerta(null)} />}
    </div>
  );
}
