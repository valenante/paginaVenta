// src/components/Panel/AnalyticsFase2.jsx
// Analytics Fase 2: Comparativa, Ratio Bebida/Comida, Heatmap Semanal
import { useEffect, useState, useMemo } from "react";
import api from "../../utils/api";
import "./AnalyticsFase2.css";

/* ── Helpers ──────────────── */
const money = (n) => Number(n || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n) => (n > 0 ? "+" : "") + Number(n || 0).toFixed(1) + "%";

/* ═══════════════════════════════════════
   1. COMPARATIVA PERIODO ANTERIOR
   ═══════════════════════════════════════ */
export function ComparativaCard({ fecha }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    setLoading(true);
    api.get("/dashboard/comparativa", { params: { fecha } })
      .then(({ data: d }) => { if (m) setData(d?.data || d); })
      .catch(() => {})
      .finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, [fecha]);

  if (loading) return <div className="af2-card af2-card--loading">Cargando comparativa...</div>;
  if (!data?.actual) return null;

  const { actual, deltas, fechaAnterior } = data;
  const items = [
    { label: "Ventas", value: `${money(actual.ventas)}€`, delta: deltas.ventas },
    { label: "Mesas", value: actual.mesas, delta: deltas.mesas },
    { label: "Comensales", value: actual.comensales, delta: deltas.comensales },
    { label: "Ticket/mesa", value: `${money(actual.ticketMedioMesa)}€`, delta: deltas.ticketMedioMesa },
    { label: "Ticket/com.", value: `${money(actual.ticketMedioComensal)}€`, delta: deltas.ticketMedioComensal },
    { label: "Pedidos", value: actual.pedidos, delta: deltas.pedidos },
  ];

  return (
    <div className="af2-card">
      <div className="af2-card__head">
        <h3>Comparativa vs semana anterior</h3>
        <span className="af2-card__sub">vs {fechaAnterior}</span>
      </div>
      <div className="af2-comparativa-grid">
        {items.map(it => (
          <div key={it.label} className="af2-kpi">
            <span className="af2-kpi__label">{it.label}</span>
            <span className="af2-kpi__value">{it.value}</span>
            <span className={`af2-kpi__delta ${it.delta > 0 ? "af2-kpi__delta--up" : it.delta < 0 ? "af2-kpi__delta--down" : ""}`}>
              {pct(it.delta)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   2. RATIO BEBIDA / COMIDA
   ═══════════════════════════════════════ */
export function RatioTipoCard({ fecha }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    setLoading(true);
    api.get("/dashboard/ratio-tipo", { params: { fecha } })
      .then(({ data: d }) => { if (m) setData(d?.data || d); })
      .catch(() => {})
      .finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, [fecha]);

  if (loading) return <div className="af2-card af2-card--loading">Cargando ratio...</div>;
  if (!data) return null;

  const { comida, bebida, total, insight } = data;
  const insightLabel = insight === "bajo" ? "Bebida baja — oportunidad de upselling" : insight === "alto" ? "Bebida alta — comida puede estar infravalorada" : "Ratio saludable";
  const insightClass = insight === "sano" ? "af2-insight--ok" : "af2-insight--warn";

  return (
    <div className="af2-card">
      <div className="af2-card__head">
        <h3>Ratio comida / bebida</h3>
        <span className="af2-card__sub">Total: {money(total)}€</span>
      </div>

      <div className="af2-ratio-bar">
        <div className="af2-ratio-bar__comida" style={{ width: `${comida.pct}%` }}>
          <span>Comida {comida.pct}%</span>
        </div>
        <div className="af2-ratio-bar__bebida" style={{ width: `${bebida.pct}%` }}>
          <span>Bebida {bebida.pct}%</span>
        </div>
      </div>

      <div className="af2-ratio-details">
        <div>
          <span className="af2-ratio-dot af2-ratio-dot--comida" />
          Comida: {money(comida.total)}€ · {comida.cantidad} uds
        </div>
        <div>
          <span className="af2-ratio-dot af2-ratio-dot--bebida" />
          Bebida: {money(bebida.total)}€ · {bebida.cantidad} uds
        </div>
      </div>

      <div className={`af2-insight ${insightClass}`}>{insightLabel}</div>
    </div>
  );
}

/* ═══════════════════════════════════════
   3. HEATMAP SEMANAL
   ═══════════════════════════════════════ */
export function HeatmapSemanalCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    setLoading(true);
    api.get("/dashboard/heatmap-semanal")
      .then(({ data: d }) => { if (m) setData(d?.data || d); })
      .catch(() => {})
      .finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, []);

  if (loading) return <div className="af2-card af2-card--loading">Cargando heatmap...</div>;
  if (!data?.matrix) return null;

  const { matrix, dias, porDia, horaPunta, maxVentas, desde, hasta } = data;

  // Filtrar solo horas con actividad (11:00 - 02:00 típico restaurante)
  const activeHours = matrix.filter(row => {
    for (let d = 0; d < 7; d++) if (row.dias[d].ventas > 0) return true;
    return false;
  });

  const intensity = (v) => {
    if (!v || maxVentas === 0) return 0;
    return Math.min(1, v / maxVentas);
  };

  return (
    <div className="af2-card af2-card--wide">
      <div className="af2-card__head">
        <h3>Mapa de calor semanal</h3>
        <span className="af2-card__sub">{desde} → {hasta} · Hora punta: {horaPunta}</span>
      </div>

      <div className="af2-heatmap-wrap">
        <table className="af2-heatmap">
          <thead>
            <tr>
              <th></th>
              {dias.map(d => <th key={d}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {activeHours.map(row => (
              <tr key={row.hora}>
                <td className="af2-heatmap__label">{row.label}</td>
                {Array.from({ length: 7 }, (_, d) => {
                  const cell = row.dias[d];
                  const alpha = intensity(cell.ventas);
                  return (
                    <td key={d} className="af2-heatmap__cell" title={`${money(cell.ventas)}€ · ${cell.mesas} mesas · ${cell.comensales} com.`}>
                      <div className="af2-heatmap__dot" style={{ backgroundColor: `rgba(168, 85, 247, ${Math.max(0.05, alpha)})` }}>
                        {cell.ventas > 0 ? <span>{Math.round(cell.ventas)}</span> : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumen por día */}
      <div className="af2-heatmap-summary">
        {porDia.map(d => (
          <div key={d.label} className="af2-day-stat">
            <strong>{d.label}</strong>
            <span>{money(d.ventas)}€</span>
            <span className="af2-day-stat__sub">{d.mesas} mesas</span>
          </div>
        ))}
      </div>
    </div>
  );
}
