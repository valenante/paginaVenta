// src/pages/Estadisticas/components/UpsellEstadisticasPro.jsx
import React from "react";
import "./UpSellEstadisticasPro.css";

const UpsellEstadisticasPro = () => {
  return (
    <section className="upsellpro-container">
      <h3 className="upsellpro-title">¿Quieres estadísticas avanzadas?</h3>

      <p className="upsellpro-text">
        Activa el módulo <strong>Estadísticas ampliadas</strong> para acceder a
        análisis por mesa, rendimiento por hora, productos estrella, patrones de venta
        y mucho más.
      </p>

      <p className="upsellpro-footnote">
        Habla con tu gestor o con el equipo de Alef para añadirlo a tu plan.
      </p>

      <button
        className="upsellpro-btn"
        onClick={() => window.open(
          "https://wa.me/34623754328?text=" +
          encodeURIComponent("Hola, me interesa activar funcionalidades Premium en mi plan Alef."),
          "_blank"
        )}
      >
        Me interesa
      </button>
    </section>
  );
};

export default UpsellEstadisticasPro;
