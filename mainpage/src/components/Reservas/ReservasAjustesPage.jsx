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

  const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const fecha = fechaSeleccionada.toISOString().slice(0, 10);
        const resFranjas = await api.get(`/reservasConfiguracion?fecha=${fecha}`);
        setFranjas(resFranjas.data?.franjas || []);
        const resDisp = await api.get("/disponibilidad");
        setDiasHabilitados(resDisp.data || diasHabilitados);
      } catch (err) {
        console.error("❌ Error al cargar configuraciones:", err);
        setAlerta({ tipo: "error", mensaje: "Error al obtener configuraciones" });
      }
    };
    cargarDatos();
  }, [fechaSeleccionada]);

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
      await api.post("/reservasConfiguracion", {
        fecha: fechaSeleccionada.toISOString().slice(0, 10),
        franjas,
      });
      await api.put("/disponibilidad", diasHabilitados);
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

      <button onClick={guardar} className="btn-guardar-config">💾 Guardar cambios</button>

      {alerta && <AlertaMensaje tipo={alerta.tipo} mensaje={alerta.mensaje} onClose={() => setAlerta(null)} />}
    </div>
  );
}
