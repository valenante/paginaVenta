// src/pages/DayReplay/DayReplay.jsx
// Replay del día — timeline interactiva con slider, KPIs dinámicos y feed de eventos.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import api from "../../utils/api";
import "./DayReplay.css";

const EVENT_ICONS = {
  mesa_abierta: "\uD83D\uDFE2",    // green circle
  mesa_cerrada: "\uD83D\uDD34",    // red circle
  pedido: "\uD83D\uDCDD",          // memo
  item_listo: "\u2705",            // check
  eliminacion: "\u274C",           // cross
  movimiento_caja: "\uD83D\uDCB0", // money bag
};

const EVENT_COLORS = {
  mesa_abierta: "green",
  mesa_cerrada: "red",
  pedido: "blue",
  item_listo: "purple",
  eliminacion: "red",
  movimiento_caja: "amber",
};

const FILTERS = [
  { key: "todo", label: "Todo" },
  { key: "mesa_abierta,mesa_cerrada", label: "Mesas" },
  { key: "pedido", label: "Pedidos" },
  { key: "item_listo", label: "Cocina" },
  { key: "movimiento_caja", label: "Caja" },
  { key: "eliminacion", label: "Eliminaciones" },
];

function fmtEur(v) { return v != null ? `${v.toFixed(2)}\u20AC` : "-"; }

function EventRow({ ev, highlight }) {
  const icon = EVENT_ICONS[ev.tipo] || "\u2022";
  const color = EVENT_COLORS[ev.tipo] || "blue";

  let main = "";
  let detail = "";
  let badge = null;

  switch (ev.tipo) {
    case "mesa_abierta":
      main = `Mesa ${ev.mesa} abierta`;
      detail = `${ev.comensales} comensales`;
      break;
    case "mesa_cerrada":
      main = `Mesa ${ev.mesa} cerrada`;
      detail = `${ev.comensales} comensales \u00B7 ${ev.durMin ? ev.durMin + " min" : ""}`;
      badge = { text: fmtEur(ev.total), color: ev.metodoPago === "tarjeta" ? "blue" : "green" };
      break;
    case "pedido":
      main = `Pedido Mesa ${ev.mesa}`;
      detail = ev.items?.map(i => `${i.qty}x ${i.nombre}`).join(", ") || "";
      if (ev.tomadoPor) detail += ` \u00B7 ${ev.tomadoPor}`;
      badge = ev.total > 0 ? { text: fmtEur(ev.total), color: "purple" } : null;
      break;
    case "item_listo":
      main = `${ev.cantidad > 1 ? ev.cantidad + "x " : ""}${ev.nombre}`;
      detail = `${ev.estacion} \u00B7 ${ev.durMin}m`;
      break;
    case "eliminacion":
      main = `${ev.cantidad > 1 ? ev.cantidad + "x " : ""}${ev.nombre} eliminado`;
      detail = ev.usuario ? `por ${ev.usuario}` : "";
      break;
    case "movimiento_caja":
      main = ev.subtipo?.replace(/_/g, " ") || "Movimiento";
      detail = ev.usuario ? `por ${ev.usuario}` : "";
      badge = { text: `${ev.importe > 0 ? "+" : ""}${fmtEur(ev.importe)}`, color: ev.importe >= 0 ? "green" : "red" };
      break;
    default:
      main = ev.tipo;
  }

  return (
    <div className={`dr-event ${highlight ? "dr-event--highlight" : ""}`}>
      <span className="dr-event__time">{ev.hora}</span>
      <span className="dr-event__icon">{icon}</span>
      <div className="dr-event__body">
        <div className="dr-event__main">{main}</div>
        {detail && <div className="dr-event__detail">{detail}</div>}
      </div>
      {badge && <span className={`dr-event__badge dr-event__badge--${badge.color}`}>{badge.text}</span>}
    </div>
  );
}

export default function DayReplay() {
  const today = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sliderIdx, setSliderIdx] = useState(0);
  const [filter, setFilter] = useState("todo");
  const feedRef = useRef(null);

  const fetchData = useCallback(async (f) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/replay/day?fecha=${f}`);
      setData(res.data || res);
      setSliderIdx(0);
    } catch (err) {
      setError("Error cargando replay. " + (err?.response?.data?.message || ""));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (fecha) fetchData(fecha); }, [fecha, fetchData]);

  // Navigate days
  const goDay = (offset) => {
    const d = new Date(fecha);
    d.setDate(d.getDate() + offset);
    setFecha(d.toISOString().slice(0, 10));
  };

  // Current slot based on slider
  const currentSlot = data?.slots?.[sliderIdx] || null;
  const currentMs = currentSlot?.ms || 0;

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (!data?.eventos) return [];
    if (filter === "todo") return data.eventos;
    const types = filter.split(",");
    return data.eventos.filter(e => types.includes(e.tipo));
  }, [data, filter]);

  // Events near slider position (show 30 around current time)
  const visibleEvents = useMemo(() => {
    if (!currentMs || !filteredEvents.length) return filteredEvents.slice(0, 50);
    // Find events closest to current slider position
    let startIdx = 0;
    for (let i = 0; i < filteredEvents.length; i++) {
      if (filteredEvents[i].ts >= currentMs) { startIdx = Math.max(0, i - 15); break; }
      startIdx = Math.max(0, i - 15);
    }
    return filteredEvents.slice(startIdx, startIdx + 40);
  }, [filteredEvents, currentMs]);

  // Chart data with reference line
  const chartData = useMemo(() => {
    if (!data?.slots) return [];
    return data.slots.map(s => ({
      hora: s.hora,
      ms: s.ms,
      ventas: s.ventasAcumuladas,
      cocina: s.itemsEnCocina,
      mesas: s.mesasAbiertas,
    }));
  }, [data]);

  if (loading) return <div className="dr-loading">Cargando replay del día...</div>;
  if (error) return <div className="dr-empty">{error}</div>;
  const headerCard = (
    <div className="dr-header-card">
      <div className="dr-header-card__top">
        <div>
          <h2>Replay del día</h2>
          <p>Reconstrucción minuto a minuto de la operación del restaurante.</p>
        </div>
        <div className="adm__header-controls">
          <button className="adm__btn-hoy" onClick={() => goDay(-1)}>&lt;</button>
          <input type="date" className="adm__date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <button className="adm__btn-hoy" onClick={() => goDay(1)}>&gt;</button>
        </div>
      </div>
    </div>
  );

  if (!data || !data.slots?.length) return (
    <div className="dr">
      {headerCard}
      <div className="dr-empty">Sin actividad este día.</div>
    </div>
  );

  const r = data.resumen;

  return (
    <div className="dr">
      {headerCard}

      {/* Slider */}
      <div className="dr-slider">
        <div className="dr-slider__current">{currentSlot?.hora || "--:--"}</div>
        <input
          type="range"
          className="dr-slider__track"
          min={0}
          max={Math.max(0, (data.slots?.length || 1) - 1)}
          value={sliderIdx}
          onChange={(e) => setSliderIdx(Number(e.target.value))}
        />
        <div className="dr-slider__label">
          <span>{data.slots[0]?.hora}</span>
          <span>{data.slots[data.slots.length - 1]?.hora}</span>
        </div>
      </div>

      {/* KPIs — live snapshot at slider position */}
      <div className="adm__kpis" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
        <div className="adm__kpi adm__kpi--mesas-live"><span className="adm__kpi-value">{currentSlot?.mesasAbiertas ?? 0}</span><span className="adm__kpi-label">Mesas abiertas</span></div>
        <div className="adm__kpi adm__kpi--comensales-live"><span className="adm__kpi-value">{currentSlot?.comensalesActivos ?? 0}</span><span className="adm__kpi-label">Comensales</span></div>
        <div className="adm__kpi adm__kpi--cocina-live"><span className="adm__kpi-value">{currentSlot?.itemsEnCocina ?? 0}</span><span className="adm__kpi-label">En cocina</span></div>
        <div className="adm__kpi adm__kpi--ventas-live"><span className="adm__kpi-value">{fmtEur(currentSlot?.ventasAcumuladas)}</span><span className="adm__kpi-label">Ventas acumuladas</span></div>
        <div className="adm__kpi adm__kpi--efectivo-live"><span className="adm__kpi-value">{fmtEur(currentSlot?.efectivoAcumulado)}</span><span className="adm__kpi-label">Efectivo</span></div>
        <div className="adm__kpi adm__kpi--tarjeta-live"><span className="adm__kpi-value">{fmtEur(currentSlot?.tarjetaAcumulada)}</span><span className="adm__kpi-label">Tarjeta</span></div>
      </div>

      {/* Summary bar — day totals */}
      <div className="adm__kpis dr-summary" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
        <div className="adm__kpi"><span className="adm__kpi-value">{r.totalMesas}</span><span className="adm__kpi-label">Mesas total</span></div>
        <div className="adm__kpi"><span className="adm__kpi-value">{r.totalComensales}</span><span className="adm__kpi-label">Comensales</span></div>
        <div className="adm__kpi"><span className="adm__kpi-value">{r.totalPlatos}</span><span className="adm__kpi-label">Platos</span></div>
        <div className="adm__kpi"><span className="adm__kpi-value">{fmtEur(r.totalVentas)}</span><span className="adm__kpi-label">Ventas día</span></div>
        <div className="adm__kpi"><span className="adm__kpi-value">{fmtEur(r.ticketMedio)}</span><span className="adm__kpi-label">Ticket medio</span></div>
        <div className="adm__kpi"><span className="adm__kpi-value">{r.duracionMediaMesa}m</span><span className="adm__kpi-label">Duración mesa</span></div>
      </div>

      {/* Chart: ventas acumuladas + cocina */}
      {chartData.length > 0 && (
        <div className="dr-chart">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="hora" tick={{ fontSize: 10, fill: "#64748b" }} interval={Math.max(0, Math.floor(chartData.length / 15))} />
              <YAxis yAxisId="ventas" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis yAxisId="cocina" orientation="right" tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip contentStyle={{ background: "#1e1b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              <Area yAxisId="ventas" type="monotone" dataKey="ventas" name="Ventas acum." stroke="#22c55e" fill="rgba(34,197,94,0.1)" strokeWidth={2} />
              <Area yAxisId="cocina" type="monotone" dataKey="cocina" name="Items cocina" stroke="#f59e0b" fill="rgba(245,158,11,0.08)" strokeWidth={2} />
              <Area yAxisId="cocina" type="monotone" dataKey="mesas" name="Mesas" stroke="#8b5cf6" fill="rgba(139,92,246,0.06)" strokeWidth={1.5} />
              {currentSlot && <ReferenceLine x={currentSlot.hora} yAxisId="ventas" stroke="#c4a7ff" strokeWidth={2} strokeDasharray="4 2" />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Event feed */}
      <div className="dr-feed">
        <div className="dr-feed__header">
          <span className="dr-feed__title">Eventos del día</span>
          <div className="dr-feed__filters">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`dr-feed__filter ${filter === f.key ? "dr-feed__filter--on" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="dr-feed__count">{filteredEvents.length} eventos</span>
        </div>
        <div className="dr-feed__list" ref={feedRef}>
          {visibleEvents.map((ev, i) => (
            <EventRow
              key={`${ev.ts}-${ev.tipo}-${i}`}
              ev={ev}
              highlight={currentMs && Math.abs(ev.ts - currentMs) < 5 * 60 * 1000}
            />
          ))}
          {visibleEvents.length === 0 && <div className="dr-empty">Sin eventos con este filtro.</div>}
        </div>
      </div>

      {/* Staff stats */}
      {data.staff?.length > 0 && (
        <div className="dr-staff">
          <div className="dr-feed__title" style={{ marginBottom: 8 }}>Actividad por camarero</div>
          <div className="dr-staff__grid">
            {data.staff.map((s) => (
              <div key={s.nombre} className="dr-staff__card">
                <div className="dr-staff__name">{s.nombre}</div>
                <div className="dr-staff__stats">
                  <span>{s.pedidos} pedidos</span>
                  <span>{s.mesas} mesas</span>
                  <span>{s.items} items</span>
                  <span className="dr-staff__importe">{fmtEur(s.importe)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
