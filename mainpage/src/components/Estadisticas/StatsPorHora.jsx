// src/pages/Estadisticas/components/StatsPorHora.jsx
import React from "react";
import "./StatsPorHora.css";
const StatsPorHora = ({ data }) => {
  if (!data || data.every((h) => h.totalIngresos === 0)) {
    return (
      <section className="statshora-container">
        <header className="statshora-header">
          <h3>Distribución por horas</h3>
        </header>
        <p className="statshora-empty">
          No hay ventas registradas para este filtro de fecha.
        </p>
      </section>
    );
  }

  const maxIngresos = Math.max(...data.map((h) => h.totalIngresos));

  return (
    <section className="statshora-container">
      <header className="statshora-header">
        <div>
          <h3>Distribución por horas del día</h3>
          <p className="statshora-desc">
            Detecta tus franjas horarias más fuertes.
          </p>
        </div>

        <span className="statshora-badge">Horas activas</span>
      </header>

      <div className="statshora-list">
        {data.map(({ hour, totalIngresos, totalCantidad }) => {
          if (totalIngresos === 0 && totalCantidad === 0) return null;

          const porcentaje =
            maxIngresos > 0 ? (totalIngresos / maxIngresos) * 100 : 0;

          return (
            <div key={hour} className="statshora-row">
              {/* Hora */}
              <div className="statshora-hour">
                {hour.toString().padStart(2, "0")}:00
              </div>

              {/* Barra */}
              <div className="statshora-bar">
                <div
                  className="statshora-bar-inner"
                  style={{ width: `${porcentaje}%` }}
                ></div>
              </div>

              {/* Meta */}
              <div className="statshora-meta">
                <span className="statshora-units">{totalCantidad} uds</span>
                <span className="statshora-money">
                  {totalIngresos.toFixed(2)} €
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default StatsPorHora;
