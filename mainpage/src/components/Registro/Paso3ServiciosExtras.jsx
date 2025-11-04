import React from "react";
import "./Paso3ServiciosExtras.css";

export default function Paso3ServiciosExtras({ servicios, setServicios }) {
  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setServicios((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value),
    }));
  };

  return (
    <section className="paso3-servicios">
      <h2>🧾 Servicios y equipamiento</h2>
      <p>Personaliza tu plan mensual y selecciona el equipamiento que deseas incluir.</p>

      {/* === Servicios de software === */}
      <div className="servicios-grupo">
        <h3>💡 Funcionalidades avanzadas</h3>

        <label className="servicio-item">
          <input
            type="checkbox"
            name="vozCocina"
            checked={servicios.vozCocina}
            onChange={handleChange}
          />
          <span>
            <strong>Voz en cocina</strong>
            <small>+10 €/mes</small>
            <p>Los pedidos se leen automáticamente por voz al llegar a cocina.</p>
          </span>
        </label>

        <label className="servicio-item">
          <input
            type="checkbox"
            name="vozComandas"
            checked={servicios.vozComandas}
            onChange={handleChange}
          />
          <span>
            <strong>Voz en comandas</strong>
            <small>+10 €/mes</small>
            <p>Los camareros escuchan los pedidos confirmados sin mirar la pantalla.</p>
          </span>
        </label>
      </div>

      {/* === Equipamiento físico === */}
      <div className="servicios-grupo">
        <h3>🖨️ Equipamiento de hardware</h3>

        <div className="servicio-item">
          <label>Impresoras térmicas</label>
          <input
            type="number"
            name="impresoras"
            min="0"
            max="10"
            value={servicios.impresoras}
            onChange={handleChange}
          />
          <small>150 € por unidad</small>
        </div>

        <div className="servicio-item">
          <label>Pantallas de cocina/barra</label>
          <input
            type="number"
            name="pantallas"
            min="0"
            max="10"
            value={servicios.pantallas}
            onChange={handleChange}
          />
          <small>250 € por unidad</small>
        </div>

        <div className="servicio-item">
          <label>PDA o tablet para camareros</label>
          <input
            type="number"
            name="pda"
            min="0"
            max="10"
            value={servicios.pda}
            onChange={handleChange}
          />
          <small>180 € por unidad</small>
        </div>
      </div>

      {/* === Servicios adicionales === */}
      <div className="servicios-grupo">
        <h3>📷 Servicios adicionales</h3>

        <label className="servicio-item">
          <input
            type="checkbox"
            name="fotografia"
            checked={servicios.fotografia}
            onChange={handleChange}
          />
          <span>
            <strong>Servicio de fotografía profesional</strong>
            <small>+120 € único</small>
            <p>Fotografiamos tus platos y productos con calidad profesional.</p>
          </span>
        </label>

        <label className="servicio-item">
          <input
            type="checkbox"
            name="cargaDatos"
            checked={servicios.cargaDatos}
            onChange={handleChange}
          />
          <span>
            <strong>Carga inicial de carta y datos</strong>
            <small>+100 € único</small>
            <p>Nos encargamos de cargar tu carta y configuraciones iniciales.</p>
          </span>
        </label>
      </div>

      {/* === Info final === */}
      <div className="servicios-nota">
        <p>
          💬 Todos los precios incluyen soporte técnico y actualizaciones.  
          El plan base es de <strong>80 €/mes</strong> e incluye acceso completo al TPV y carta digital.
        </p>
      </div>
    </section>
  );
}
