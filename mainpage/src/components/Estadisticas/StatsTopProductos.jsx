// src/pages/Estadisticas/components/StatsTopProductos.jsx
import React from "react";
import "./StatsTopProductos.css";

const StatsTopProductos = ({ topProductos, totalIngresosCategoria }) => {
  if (!topProductos || topProductos.length === 0) return null;

  return (
    <section className="toppro-container">
      <header className="toppro-header">
        <div>
          <h3 className="toppro-title">Top productos</h3>
          <p className="toppro-subtitle">Los más vendidos por ingresos.</p>
        </div>
      </header>

      <ul className="toppro-list">
        {topProductos.map((p) => {
          const share =
            totalIngresosCategoria > 0
              ? (p.totalIngresos / totalIngresosCategoria) * 100
              : 0;

          return (
            <li key={p._id} className="toppro-item">
              <div className="toppro-item-header">
                <span className="toppro-item-name">{p.nombre}</span>
                <span className="toppro-item-meta">
                  {p.totalCantidad} uds · {p.totalIngresos.toFixed(2)} €
                </span>
              </div>

              <div className="toppro-bar">
                <div
                  className="toppro-bar-inner"
                  style={{ width: `${share}%` }}
                />
              </div>

              <span className="toppro-share">
                {share.toFixed(1)}% de los ingresos de la categoría
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default StatsTopProductos;
