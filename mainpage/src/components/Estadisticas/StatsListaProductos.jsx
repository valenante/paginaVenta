// src/pages/Estadisticas/components/StatsListaProductos.jsx
import React, { useState, useMemo, useEffect } from "react";
import "./StatsListaProductos.css";

const PER_PAGE = 15;

const StatsListaProductos = ({ productosConStats, loading }) => {
  const [page, setPage] = useState(1);

  // Reset página al cambiar productos
  useEffect(() => { setPage(1); }, [productosConStats]);

  const totalPages = Math.ceil((productosConStats?.length || 0) / PER_PAGE);
  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return (productosConStats || []).slice(start, start + PER_PAGE);
  }, [productosConStats, page]);

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
        <>
          <ul className="statlist-list">
            {paginated.map((p) => (
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
                      {(p.totalIngresos ?? 0).toFixed(2)} €
                    </strong>
                    {p.tieneDesglose && p.ingresosAdicionales > 0 && (
                      <span className="statlist-desglose">
                        {(p.ingresosBase ?? 0).toFixed(2)} € base + {(p.ingresosAdicionales ?? 0).toFixed(2)} € adicionales
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="statlist-pagination">
              <button
                className="statlist-pagination__btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </button>
              <span className="statlist-pagination__info">
                {page} / {totalPages}
              </span>
              <button
                className="statlist-pagination__btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default StatsListaProductos;
