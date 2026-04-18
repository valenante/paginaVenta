// src/pages/Estadisticas/components/StatsTopProductos.jsx
import React, { useState, useMemo, useEffect } from "react";
import "./StatsTopProductos.css";

const PER_PAGE = 10;

const StatsTopProductos = ({ topProductos, totalIngresosCategoria, productosConStats }) => {
  const [modo, setModo] = useState("ingresos");
  const [page, setPage] = useState(1);

  const allSorted = useMemo(() => {
    const source = productosConStats || topProductos || [];
    const filtered = source.filter((p) => p.totalIngresos > 0 || p.totalCantidad > 0);
    return [...filtered].sort((a, b) =>
      modo === "ingresos"
        ? b.totalIngresos - a.totalIngresos
        : b.totalCantidad - a.totalCantidad
    );
  }, [modo, topProductos, productosConStats]);

  // Reset página al cambiar modo o datos
  useEffect(() => { setPage(1); }, [modo, productosConStats]);

  const totalPages = Math.ceil(allSorted.length / PER_PAGE);
  const items = allSorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalCantidadGlobal = useMemo(
    () => allSorted.reduce((sum, p) => sum + (p.totalCantidad || 0), 0),
    [allSorted]
  );

  const totalRef = modo === "ingresos" ? (totalIngresosCategoria || 0) : totalCantidadGlobal;

  if (!allSorted.length) return null;

  return (
    <section className="toppro-container">
      <header className="toppro-header">
        <div>
          <h3 className="toppro-title">Top productos</h3>
          <p className="toppro-subtitle">
            {modo === "ingresos" ? "Ranking por ingresos." : "Ranking por unidades vendidas."}
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
        {items.map((p, idx) => {
          const rank = (page - 1) * PER_PAGE + idx + 1;
          const value = modo === "ingresos" ? p.totalIngresos : p.totalCantidad;
          const share = totalRef > 0 ? (value / totalRef) * 100 : 0;

          return (
            <li key={p._id || p.nombre} className="toppro-item">
              <div className="toppro-item-header">
                <span className="toppro-item-name">
                  <span className="toppro-rank">{rank}.</span>
                  {p.nombre}
                </span>
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

      {totalPages > 1 && (
        <div className="toppro-pagination">
          <button
            className="toppro-pagination__btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </button>
          <span className="toppro-pagination__info">
            {page} / {totalPages}
          </span>
          <button
            className="toppro-pagination__btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </section>
  );
};

export default StatsTopProductos;
