// src/components/Panel/AnalyticsFase2.jsx
// Analytics Fase 2: comparativa, ratio bebida/comida, ventas por hora
import { useEffect, useState } from "react";
import api from "../../utils/api";
import { InfoButton } from "./InfoModal";
import "./AnalyticsFase2.css";

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
        <div className="af2-card__actions">
          <span className="af2-card__sub">vs {fechaAnterior}</span>
          <InfoButton title="Comparativa semanal">
            <h4>Qué muestra</h4>
            <p>Compara las métricas del día seleccionado contra el mismo día de la semana anterior.</p>
            <h4>Cómo se calcula</h4>
            <p>Se toman las mesas cerradas de ambos días y se calculan los mismos KPIs. El % indica la diferencia.</p>
            <h4>Para qué sirve</h4>
            <p>Saber si el negocio mejora o empeora semana a semana. Un domingo con -20% vs el anterior es señal de investigar.</p>
          </InfoButton>
        </div>
      </div>
      <div className="af2-comparativa-grid">
        {items.map(it => (
          <div key={it.label} className="af2-kpi">
            <span className="af2-kpi__label">{it.label}</span>
            <span className="af2-kpi__value">{it.value}</span>
            <span className={`af2-kpi__delta ${it.delta > 0 ? "af2-kpi__delta--up" : it.delta < 0 ? "af2-kpi__delta--down" : ""}`}>{pct(it.delta)}</span>
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
        <div className="af2-card__actions">
          <span className="af2-card__sub">Total: {money(total)}€</span>
          <InfoButton title="Ratio comida / bebida">
            <h4>Qué muestra</h4>
            <p>El porcentaje de facturación que viene de comida vs bebida.</p>
            <h4>Cómo se calcula</h4>
            <p>Suma los totales de pedidos de platos (comida) y pedidos de bebidas por separado.</p>
            <h4>Para qué sirve</h4>
            <ul>
              <li><strong>60-70% comida / 30-40% bebida</strong> es lo habitual en un restaurante</li>
              <li>Si bebida es &lt;20%, los camareros no están sugiriendo bebidas</li>
              <li>Si bebida es &gt;45%, la comida puede estar barata o la carta de vinos es muy fuerte</li>
            </ul>
          </InfoButton>
        </div>
      </div>

      <div className="af2-ratio-bar">
        <div className="af2-ratio-bar__comida" style={{ width: `${comida.pct}%` }}><span>Comida {comida.pct}%</span></div>
        <div className="af2-ratio-bar__bebida" style={{ width: `${bebida.pct}%` }}><span>Bebida {bebida.pct}%</span></div>
      </div>
      <div className="af2-ratio-details">
        <div><span className="af2-ratio-dot af2-ratio-dot--comida" />Comida: {money(comida.total)}€ · {comida.cantidad} uds</div>
        <div><span className="af2-ratio-dot af2-ratio-dot--bebida" />Bebida: {money(bebida.total)}€ · {bebida.cantidad} uds</div>
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
        <div className="af2-card__actions">
          <span className="af2-card__sub">
            Hora punta: <strong>{horaPunta}</strong>
            {franjas && <> · Mediodía {franjas.mediodia.pct}% · Noche {franjas.noche.pct}%</>}
          </span>
          <InfoButton title="Ventas por hora">
            <h4>Qué muestra</h4>
            <p>La facturación por cada hora del día, basada en la hora en que se hizo cada pedido.</p>
            <h4>Cómo se calcula</h4>
            <p>Agrupa todas las ventas del día por la hora del pedido (no la hora de cierre de mesa). La barra naranja indica la hora punta.</p>
            <h4>Para qué sirve</h4>
            <ul>
              <li>Identificar hora punta para optimizar personal</li>
              <li>Ver desglose mediodía vs noche</li>
              <li>Detectar horas muertas para promos/happy hour</li>
            </ul>
          </InfoButton>
        </div>
      </div>
      <div className="af2-hours">
        {horas.map(h => {
          const pctBar = maxVentas > 0 ? Math.max(2, (h.ventas / maxVentas) * 100) : 0;
          const isHot = h.ventas === maxVentas;
          return (
            <div key={h.hora} className="af2-hour-row" title={`${h.items} productos vendidos`}>
              <span className="af2-hour-label">{h.label}</span>
              <div className="af2-hour-bar-wrap">
                <div className={`af2-hour-bar ${isHot ? "af2-hour-bar--hot" : ""}`} style={{ width: `${pctBar}%` }} />
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
