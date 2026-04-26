import React, { useState } from "react";
import "./TiemposCocinaCard.css";

const fmtMin = (v) => {
  if (v == null) return "—";
  const n = Number(v);
  return n < 1 ? "<1 min" : `${Math.round(n)} min`;
};

const TABS = [
  { key: "todo", label: "Todo" },
  { key: "platos", label: "🍽 Platos" },
  { key: "bebidas", label: "🍺 Bebidas" },
];

export default function TiemposCocinaCard({
  tiemposCocina, tiemposCocinaPlatos, tiemposCocinaBebidas,
  pantallaCocinaActiva, pantallaBarraActiva, onVerPares,
}) {
  const [tab, setTab] = useState("todo");

  const tc = tab === "platos" ? tiemposCocinaPlatos
    : tab === "bebidas" ? tiemposCocinaBebidas
    : tiemposCocina;

  // Si la pantalla de la estación está OFF, tListo no es fiable
  // (se marca automáticamente al cerrar mesa, no cuando realmente sale)
  const pantallaActiva = tab === "platos" ? pantallaCocinaActiva
    : tab === "bebidas" ? pantallaBarraActiva
    : (pantallaCocinaActiva && pantallaBarraActiva); // "todo" necesita ambas para mostrar tListo combinado

  // En "todo", si al menos una está activa, mostramos los datos de tListo
  // porque el "primer item" probablemente viene de la estación activa
  const mostrarTListo = tab === "todo"
    ? (pantallaCocinaActiva || pantallaBarraActiva)
    : pantallaActiva;

  const labelItem = tab === "bebidas" ? "1ª bebida" : tab === "platos" ? "1er plato" : "1er item";

  return (
    <div className="tsc-card">
      <div className="tsc-card__head">
        <h3>Tiempos de servicio</h3>
        {onVerPares && (
          <button className="tsc-card__link" onClick={onVerPares}>
            Ver pares de productos →
          </button>
        )}
      </div>

      {/* Toggle */}
      <div className="tsc-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tsc-tabs__btn ${tab === t.key ? "tsc-tabs__btn--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!tc ? (
        <p className="tsc-card__empty">Sin datos de {tab === "bebidas" ? "bebidas" : tab === "platos" ? "platos" : "tiempos"} hoy</p>
      ) : (
        <>
          {/* KPIs */}
          <div className={`tsc-kpis ${!mostrarTListo ? "tsc-kpis--solo" : ""}`}>
            <div className={`tsc-kpi ${!mostrarTListo ? "tsc-kpi--total" : ""}`}>
              <span className="tsc-kpi__label">Apertura → Pedido</span>
              <span className="tsc-kpi__value">{fmtMin(tc.medianaAperturaPedido)}</span>
              <span className="tsc-kpi__sub">mediana · {fmtMin(tc.promedioAperturaPedido)} avg</span>
            </div>

            {mostrarTListo && (
              <>
                <div className="tsc-kpi tsc-kpi--arrow">→</div>
                <div className="tsc-kpi">
                  <span className="tsc-kpi__label">Pedido → {labelItem}</span>
                  <span className="tsc-kpi__value">{fmtMin(tc.medianaPedidoPlato)}</span>
                  <span className="tsc-kpi__sub">mediana · {fmtMin(tc.promedioPedidoPlato)} avg</span>
                </div>
                <div className="tsc-kpi tsc-kpi--arrow">=</div>
                <div className="tsc-kpi tsc-kpi--total">
                  <span className="tsc-kpi__label">Apertura → {labelItem}</span>
                  <span className="tsc-kpi__value">{fmtMin(tc.medianaAperturaPlato)}</span>
                  <span className="tsc-kpi__sub">mediana · {fmtMin(tc.promedioAperturaPlato)} avg</span>
                </div>
              </>
            )}
          </div>

          {!mostrarTListo && (
            <p className="tsc-card__hint">
              La pantalla de {tab === "bebidas" ? "barra" : tab === "platos" ? "cocina" : "cocina/barra"} está desactivada — no hay datos de cuándo se sirve.
            </p>
          )}

          {/* Distribución — solo si tListo es fiable */}
          {mostrarTListo && tc.distribucion && (
            <div className="tsc-dist">
              <span className="tsc-dist__label">Distribución ({tc.mesas} mesas)</span>
              <div className="tsc-dist__bars">
                {Object.entries(tc.distribucion).map(([rango, count]) => {
                  const pct = tc.mesas > 0 ? (count / tc.mesas) * 100 : 0;
                  return (
                    <div key={rango} className="tsc-dist__bar-group">
                      <div className="tsc-dist__bar-wrap">
                        <div
                          className={`tsc-dist__bar ${rango === "20+" ? "tsc-dist__bar--warn" : ""}`}
                          style={{ height: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                      <span className="tsc-dist__count">{count}</span>
                      <span className="tsc-dist__range">{rango}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
