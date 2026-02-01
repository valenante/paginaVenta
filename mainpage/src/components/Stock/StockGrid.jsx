import React, { memo, useCallback } from "react";
import "./StockGrid.css";

function getEstado(it) {
  const actual = Number(it?.stockActual ?? 0);
  const critico = Number(it?.stockCritico ?? 0);
  const minimo = Number(it?.stockMinimo ?? 0);

  if (actual <= critico) return "critico";
  if (actual <= minimo) return "bajo";
  return "ok";
}

function estadoLabel(estado) {
  if (estado === "critico") return "🔴 Crítico";
  if (estado === "bajo") return "🟠 Bajo";
  return "🟢 Óptimo";
}

function tipoLabel(it) {
  const t = String(it?.tipoItem || it?.type || "ingrediente").toLowerCase();
  return t === "consumible" ? "Consumible" : "Ingrediente";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function calcPorcentaje(stockActual, stockMax) {
  const max = Number(stockMax ?? 0);
  const actual = Number(stockActual ?? 0);
  if (!Number.isFinite(max) || max <= 0) return 0;
  const pct = (actual / max) * 100;
  return clamp(pct, 0, 100);
}

const StockGrid = memo(function StockGrid({ ingredientes = [], setModal }) {
  const openEliminar = useCallback(
    (ing) => setModal({ type: "eliminar", ingrediente: ing }),
    [setModal]
  );

  const openAjustar = useCallback(
    (ing) => setModal({ type: "ajustar", ingrediente: ing }),
    [setModal]
  );

  if (!ingredientes || ingredientes.length === 0) {
    return (
      <div className="stock-empty">
        <div className="stock-empty__card">
          <h3 className="stock-empty__title">No hay ítems de stock</h3>
          <p className="stock-empty__text">
            Crea tu primer ingrediente o consumible para empezar a controlar niveles y alertas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-grid">
      {ingredientes.map((ing) => {
        const estado = getEstado(ing);
        const porcentaje = calcPorcentaje(ing.stockActual, ing.stockMax);

        const unidad = ing.unidad || "ud";
        const tipo = tipoLabel(ing);

        const autoEnabled =
          ing?.consumoAuto?.enabled === true ||
          ing?.consumoAutoEnabled === true; // fallback por si guardas así en algún momento

        return (
          <article key={ing._id} className={`stock-card estado-${estado}`}>
            {/* acciones superiores */}
            <div className="stock-card-top">
              <div className="stock-card-badges">
                <span className={`estado-badge ${estado}`} title="Estado actual">
                  {estadoLabel(estado)}
                </span>

                <span className="stock-pill stock-pill--tipo" title="Tipo de ítem">
                  {tipo}
                </span>

                {autoEnabled && (
                  <span className="stock-pill stock-pill--auto" title="Consumo automático activo">
                    ⏳ Auto
                  </span>
                )}
              </div>

              <button
                type="button"
                className="btn-eliminar-ingrediente"
                onClick={() => openEliminar(ing)}
                aria-label={`Eliminar ${ing.nombre}`}
                title="Eliminar ítem"
              >
                ✖
              </button>
            </div>

            {/* cabecera nombre */}
            <div className="stock-card-header">
              <span className="stock-name" title={ing.nombre}>
                {ing.nombre}
              </span>
            </div>

            {/* barra */}
            <div className="stock-bar" aria-label={`Nivel de stock: ${Math.round(porcentaje)}%`}>
              <div
                className="stock-bar-fill"
                style={{ width: `${porcentaje}%` }}
              />
            </div>

            {/* detalles */}
            <div className="stock-details">
              <div className="stock-details-main">
                <strong>
                  {Number(ing.stockActual ?? 0)}
                  {unidad}
                </strong>
                <span className="max">
                  máx: {Number(ing.stockMax ?? 0)}
                  {unidad}
                </span>
              </div>

              <div className="stock-details-sub">
                <span className="umbral">
                  mín: <strong>{Number(ing.stockMinimo ?? 0)}</strong>
                  {unidad}
                </span>
                <span className="umbral">
                  crítico: <strong>{Number(ing.stockCritico ?? 0)}</strong>
                  {unidad}
                </span>
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              className="btn-ajustar"
              onClick={() => openAjustar(ing)}
              title="Ajustar stock real"
            >
              Ajustar stock
            </button>
          </article>
        );
      })}
    </div>
  );
});

export default StockGrid;
