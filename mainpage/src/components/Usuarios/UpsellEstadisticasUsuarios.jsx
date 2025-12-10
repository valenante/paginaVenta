import React from "react";
import "./UpsellEstadisticasUsuarios.css";

export default function UpsellEstadisticasUsuarios() {
  return (
    <div className="upsellusers-container">
      <h3 className="upsellusers-title">📊 Estadísticas de empleados</h3>

      <p className="upsellusers-text">
        Descubre quién atiende más mesas, quién genera más ingresos,
        productividad por estación, comparación de rendimiento y mucho más.
      </p>

      <p className="upsellusers-footnote">
        Esta funcionalidad está disponible solo en el <strong>Plan Pro</strong>.
      </p>

      <button className="upsellusers-btn">
        Quiero activar estadísticas avanzadas
      </button>
    </div>
  );
}
