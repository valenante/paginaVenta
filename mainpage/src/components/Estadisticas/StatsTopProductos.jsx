// src/pages/Estadisticas/components/StatsTopProductos.jsx
import React, { useState, useMemo } from "react";
import "./StatsTopProductos.css";

const StatsTopProductos = ({ topProductos, totalIngresosCategoria, productosConStats }) => {
  const [modo, setModo] = useState("ingresos"); // "ingresos" | "cantidad"

  const items = useMemo(() => {
    const source = productosConStats || topProductos || [];
    const filtered = source.filter((p) => p.totalIngresos > 0 || p.totalCantidad > 0);
    const sorted = [...filtered].sort((a, b) =>
      modo === "ingresos"
        ? b.totalIngresos - a.totalIngresos
        : b.totalCantidad - a.totalCantidad
    );
    return sorted.slice(0, 5);
  }, [modo, topProductos, productosConStats]);

  const totalRef = useMemo(() => {
    if (modo === "ingresos") return totalIngresosCategoria || 0;
    return items.reduce((sum, p) => sum + (p.totalCantidad || 0), 0);
  }, [modo, items, totalIngresosCategoria]);

  if (!items.length) return null;

  return (
    <section className="toppro-container">
      <header className="toppro-header">
        <div>
          <h3 className="toppro-title">Top productos</h3>
          <p className="toppro-subtitle">
            {modo === "ingresos" ? "Los más vendidos por ingresos." : "Los más vendidos por unidades."}
          </p>
        </div>
        <div className="toppro-toggle">
          <button
            type="button"
            className={`toppro-toggle-btn${modo === "ingresos" ? " toppro-toggle-btn--active" : ""}`}
            onClick={() => setModo("ingresos")}
          >
            Importe
          </button>
          <button
            type="button"
            className={`toppro-toggle-btn${modo === "cantidad" ? " toppro-toggle-btn--active" : ""}`}
            onClick={() => setModo("cantidad")}
          >
            Cantidad
          </button>
        </div>
      </header>

      <ul className="toppro-list">
        {items.map((p) => {
          const value = modo === "ingresos" ? p.totalIngresos : p.totalCantidad;
          const share = totalRef > 0 ? (value / totalRef) * 100 : 0;

          return (
            <li key={p._id || p.nombre} className="toppro-item">
              <div className="toppro-item-header">
                <span className="toppro-item-name">{p.nombre}</span>
                <span className="toppro-item-meta">
                  {p.totalCantidad} uds · {p.totalIngresos.toFixed(2)} €
                  {p.tieneDesglose && p.ingresosAdicionales > 0 && (
                    <span className="toppro-desglose">
                      ({(p.ingresosBase ?? 0).toFixed(2)} € + {(p.ingresosAdicionales ?? 0).toFixed(2)} € adic.)
                    </span>
                  )}
                </span>
              </div>

              <div className="toppro-bar">
                <div
                  className="toppro-bar-inner"
                  style={{ width: `${share}%` }}
                />
              </div>

              <span className="toppro-share">
                {share.toFixed(1)}% {modo === "ingresos" ? "de los ingresos" : "de las unidades"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default StatsTopProductos;
