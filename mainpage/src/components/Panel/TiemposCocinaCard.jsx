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

export default function TiemposCocinaCard({ tiemposCocina, tiemposCocinaPlatos, tiemposCocinaBebidas, onVerPares }) {
  const [tab, setTab] = useState("todo");

  const tc = tab === "platos" ? tiemposCocinaPlatos
    : tab === "bebidas" ? tiemposCocinaBebidas
    : tiemposCocina;

  const labelItem = tab === "bebidas" ? "1ª bebida" : tab === "platos" ? "1er plato" : "1er item";

  return (
    <div className="tc-card">
      <div className="tc-card__head">
        <h3>Tiempos de servicio</h3>
        {onVerPares && (
          <button className="tc-card__link" onClick={onVerPares}>
            Ver pares de productos →
          </button>
        )}
      </div>

      {/* Toggle */}
      <div className="tc-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tc-tabs__btn ${tab === t.key ? "tc-tabs__btn--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!tc ? (
        <p className="tc-card__empty">Sin datos de {tab === "bebidas" ? "bebidas" : tab === "platos" ? "platos" : "tiempos"} hoy</p>
      ) : (
        <>
          {/* KPIs principales */}
          <div className="tc-kpis">
            <div className="tc-kpi">
              <span className="tc-kpi__label">Apertura → Pedido</span>
              <span className="tc-kpi__value">{fmtMin(tc.medianaAperturaPedido)}</span>
              <span className="tc-kpi__sub">mediana · {fmtMin(tc.promedioAperturaPedido)} avg</span>
            </div>
            <div className="tc-kpi tc-kpi--arrow">→</div>
            <div className="tc-kpi">
              <span className="tc-kpi__label">Pedido → {labelItem}</span>
              <span className="tc-kpi__value">{fmtMin(tc.medianaPedidoPlato)}</span>
              <span className="tc-kpi__sub">mediana · {fmtMin(tc.promedioPedidoPlato)} avg</span>
            </div>
            <div className="tc-kpi tc-kpi--arrow">=</div>
            <div className="tc-kpi tc-kpi--total">
              <span className="tc-kpi__label">Apertura → {labelItem}</span>
              <span className="tc-kpi__value">{fmtMin(tc.medianaAperturaPlato)}</span>
              <span className="tc-kpi__sub">mediana · {fmtMin(tc.promedioAperturaPlato)} avg</span>
            </div>
          </div>

          {/* Distribución */}
          {tc.distribucion && (
            <div className="tc-dist">
              <span className="tc-dist__label">Distribución ({tc.mesas} mesas)</span>
              <div className="tc-dist__bars">
                {Object.entries(tc.distribucion).map(([rango, count]) => {
                  const pct = tc.mesas > 0 ? (count / tc.mesas) * 100 : 0;
                  return (
                    <div key={rango} className="tc-dist__bar-group">
                      <div className="tc-dist__bar-wrap">
                        <div
                          className={`tc-dist__bar ${rango === "20+" ? "tc-dist__bar--warn" : ""}`}
                          style={{ height: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                      <span className="tc-dist__count">{count}</span>
                      <span className="tc-dist__range">{rango}</span>
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
