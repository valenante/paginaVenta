import React from "react";
import "./UpsellStock.css";

export default function UpsellStock() {
  return (
    <div className="upsellstock-container">
      <h2 className="upsellstock-title">🔒 Función disponible en el plan Profesional</h2>

      <p className="upsellstock-text">
        La gestión avanzada de stock permite controlar ingredientes, cantidades mínimas,
        alertas automáticas y previsión de compras.
      </p>

      <p className="upsellstock-footnote">
        Actualiza tu plan para activar el módulo de stock.
      </p>

      <button
        className="upsellstock-btn"
        onClick={() => window.open("https://wa.me/34624163497?text=" + encodeURIComponent("Hola, me interesa activar el módulo de Stock avanzado en Alef."), "_blank")}
      >
        Mejorar plan
      </button>
    </div>
  );
}
