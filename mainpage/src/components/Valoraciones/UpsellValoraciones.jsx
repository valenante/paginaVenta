// src/components/Valoraciones/UpsellValoraciones.jsx
import React from "react";
import "./UpsellValoraciones.css";

export default function UpsellValoraciones() {
  return (
    <div className="upsell-valoraciones-container">
      <h2 className="upsell-valoraciones-title">
        ⭐ Módulo de valoraciones disponible en el plan Premium
      </h2>

      <p className="upsell-valoraciones-text">
        Activa el panel de valoraciones para ver qué platos enamoran a tus clientes,
        detectar puntos de mejora y tomar decisiones basadas en feedback real.
      </p>

      <p className="upsell-valoraciones-footnote">
        Mejora tu plan para desbloquear estadísticas detalladas de opiniones.
      </p>

      <button
        className="upsell-valoraciones-btn"
        onClick={() => window.open("https://wa.me/34623754328?text=" + encodeURIComponent("Hola, me interesa activar el módulo de Valoraciones en Alef."), "_blank")}
      >
        Mejorar plan
      </button>
    </div>
  );
}
