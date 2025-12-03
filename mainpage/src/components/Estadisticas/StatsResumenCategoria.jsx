// src/pages/Estadisticas/components/StatsResumenCategoria.jsx
import React from "react";
import "./StatsResumenCategoria.css";

const StatsResumenCategoria = ({
  category,
  resumenCategoria,
  fechaTexto,
  horaPunta,
  productoEstrella,
  isPro,
}) => {
  const { totalCantidad = 0, totalIngresos = 0, precioMedioUnidad = 0 } =
    resumenCategoria || {};

  return (
    <section className="stats-card-glass stats-resumen">
      <header className="stats-resumen-header">
        <div className="stats-resumen-titles">
          <h3 className="stats-title">📊 Resumen de la categoría</h3>
          <p className="stats-subtitle">
            Ventas de <strong>{category}</strong> para{" "}
            <strong>{fechaTexto}</strong>.
          </p>
        </div>

        {isPro && <span className="stats-tag-pro">PRO</span>}
      </header>

      <div className="stats-resumen-grid">
        <div className="stats-resumen-item">
          <span className="stats-label">Unidades vendidas</span>
          <strong className="stats-value">{totalCantidad}</strong>
        </div>

        <div className="stats-resumen-item">
          <span className="stats-label">Ingresos totales</span>
          <strong className="stats-value">{totalIngresos.toFixed(2)} €</strong>
        </div>

        <div className="stats-resumen-item">
          <span className="stats-label">Precio medio por unidad</span>
          <strong className="stats-value">
            {precioMedioUnidad > 0 ? `${precioMedioUnidad.toFixed(2)} €` : "—"}
          </strong>
        </div>

        {horaPunta != null && (
          <div className="stats-resumen-item">
            <span className="stats-label">Hora punta</span>
            <strong className="stats-value">{horaPunta}:00 h</strong>
          </div>
        )}

        {productoEstrella && (
          <div className="stats-resumen-item">
            <span className="stats-label">Producto estrella</span>
            <strong className="stats-value">{productoEstrella.nombre}</strong>
            <small className="stats-helper">
              {productoEstrella.totalIngresos.toFixed(2)} € ·{" "}
              {productoEstrella.totalCantidad} uds
            </small>
          </div>
        )}
      </div>
    </section>
  );
};

export default StatsResumenCategoria;
