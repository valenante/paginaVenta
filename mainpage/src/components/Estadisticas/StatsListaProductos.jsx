// src/pages/Estadisticas/components/StatsListaProductos.jsx
import React from "react";
import "./StatsListaProductos.css";

const StatsListaProductos = ({ productosConStats, loading }) => {
  return (
    <section className="statlist-container">
      <header className="statlist-header">
        <h3 className="statlist-title">Detalle por producto</h3>
        <p className="statlist-subtitle">
          Listado completo de productos de la categoría.
        </p>
      </header>

      {loading ? (
        <p className="statlist-empty">Calculando estadísticas…</p>
      ) : productosConStats.length === 0 ? (
        <p className="statlist-empty">No hay productos para esta categoría.</p>
      ) : (
        <ul className="statlist-list">
          {productosConStats.map((p) => (
            <li key={p._id} className="statlist-item">
              <div className="statlist-item-header">
                <span className="statlist-item-name">{p.nombre}</span>
              </div>

              <div className="statlist-stats-row">
                <div className="statlist-stat">
                  <span className="statlist-label">Unidades vendidas</span>
                  <strong className="statlist-value">{p.totalCantidad}</strong>
                </div>

                <div className="statlist-stat">
                  <span className="statlist-label">Ingresos</span>
                  <strong className="statlist-value statlist-money">
                    {p.totalIngresos.toFixed(2)} €
                  </strong>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default StatsListaProductos;
