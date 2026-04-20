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
   3. VENTAS POR HORA DEL DÍA
   ═══════════════════════════════════════ */
export function VentasPorHoraCard({ fecha }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    setLoading(true);
    api.get("/dashboard/ventas-hora", { params: { fecha } })
      .then(({ data: d }) => { if (m) setData(d?.data || d); })
      .catch(() => {})
      .finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, [fecha]);

  if (loading) return <div className="af2-card af2-card--loading">Cargando franjas...</div>;
  if (!data?.horas?.length) return null;

  const { horas, maxVentas, horaPunta, franjas } = data;

  return (
    <div className="af2-card af2-card--wide">
      <div className="af2-card__head">
        <h3>Ventas por hora</h3>
        <span className="af2-card__sub">
          Hora punta: <strong>{horaPunta}</strong>
          {franjas && <> · Mediodía {franjas.mediodia.pct}% · Noche {franjas.noche.pct}%</>}
        </span>
      </div>

      <div className="af2-hours">
        {horas.map(h => {
          const pct = maxVentas > 0 ? Math.max(2, (h.ventas / maxVentas) * 100) : 0;
          const isHot = h.ventas === maxVentas;
          return (
            <div key={h.hora} className="af2-hour-row" title={`${h.items} productos vendidos`}>
              <span className="af2-hour-label">{h.label}</span>
              <div className="af2-hour-bar-wrap">
                <div
                  className={`af2-hour-bar ${isHot ? "af2-hour-bar--hot" : ""}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="af2-hour-value">{money(h.ventas)}€</span>
              <span className="af2-hour-mesas">{h.items}u</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
