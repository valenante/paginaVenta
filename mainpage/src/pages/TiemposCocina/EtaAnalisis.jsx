// src/pages/TiemposCocina/EtaAnalisis.jsx
// Analytics de rendimiento de cocina — throughput, cuellos de botella, tendencias, pico vs normal.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
} from "recharts";
import api from "../../utils/api";
import "./EtaAnalisis.css";

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#22c55e", "#ef4444", "#ec4899"];

function fmtMin(v) {
  if (v == null || v === 0) return "-";
  if (v < 1) return `${Math.round(v * 60)}s`;
  return `${Math.round(v * 10) / 10}m`;
}

function fmtSeg(v) {
  if (v == null) return "-";
  if (v < 60) return `${Math.round(v)}s`;
  return `${Math.round(v / 6) / 10}m`;
}

// ── Insights builder ─────────────────────────────────────────────
function buildInsights(data) {
  if (!data) return [];
  const insights = [];

  // Bottleneck
  const bn = data.bottleneck?.bottleneck;
  if (bn) {
    insights.push({
      tipo: "red", icon: "\u{1F534}",
      msg: `${bn.estacion} es tu cuello de botella: ${bn.razon}.`,
      action: "Investiga qué la ralentiza y si necesita más personal o mejor organización.",
    });
  }

  // Peak degradation — mostrar TODAS las estaciones con degradación > 15%
  const peakBad = (data.peak?.porEstacion || [])
    .filter((e) => e.degradacion > 15 && e.pico && e.noPico)
    .sort((a, b) => b.degradacion - a.degradacion);
  if (peakBad.length > 0) {
    const worst = peakBad[0];
    const others = peakBad.slice(1).map((e) => `${e.estacion} (+${e.degradacion}%)`).join(", ");
    insights.push({
      tipo: "amber", icon: "\u26A0\uFE0F",
      msg: `${worst.estacion} se ralentiza un ${worst.degradacion}% en horas punta (${fmtMin(worst.noPico.avgDurMin)} normal vs ${fmtMin(worst.pico.avgDurMin)} punta).${others ? ` También: ${others}.` : ""}`,
      action: "Refuerza las estaciones lentas en horario de servicio (13-15h y 20-22h).",
    });
  }

  // Slowest product
  const slowest = data.products?.productos?.[0];
  if (slowest && slowest.pctTiempoTotal > 8) {
    insights.push({
      tipo: "blue", icon: "\u{1F4CB}",
      msg: `${slowest.nombre} consume el ${slowest.pctTiempoTotal}% del tiempo de ${slowest.estacion} (${fmtMin(slowest.avgDurMin)} de media).`,
      action: "Investiga si se puede pre-preparar, simplificar o reasignar a otra estación.",
    });
  }

  // Trends
  if (data.trends?.tendenciaGlobal === "mejorando") {
    insights.push({
      tipo: "green", icon: "\u2705",
      msg: `La cocina mejoró un ${Math.abs(data.trends.deltaPctUltimaSemana)}% respecto a la semana anterior.`,
      action: "Buen trabajo — mantén el ritmo.",
    });
  } else if (data.trends?.deltaPctUltimaSemana > 10) {
    insights.push({
      tipo: "amber", icon: "\u{1F4C8}",
      msg: `La cocina es un ${data.trends.deltaPctUltimaSemana}% más lenta que la semana pasada.`,
      action: "Revisa si ha cambiado el equipo o el volumen de pedidos.",
    });
  }

  return insights;
}

// ── Throughput chart data builder ─────────────────────────────────
function buildThroughputChart(throughput) {
  if (!throughput?.porEstacion?.length) return [];
  const byHour = {};
  const slugs = new Set();

  for (const est of throughput.porEstacion) {
    slugs.add(est.estacion);
    for (const h of est.porHora || []) {
      if (!byHour[h.hora]) byHour[h.hora] = { hora: `${String(h.hora).padStart(2, "0")}:00` };
      byHour[h.hora][est.estacion] = h.items;
    }
  }

  return { data: Object.values(byHour).sort((a, b) => a.hora.localeCompare(b.hora)), slugs: [...slugs] };
}

// ── PeakCard with expand/collapse ────────────────────────────────
const PREVIEW_COUNT = 6;

function PeakCard({ pico, isTop }) {
  const [modalOpen, setModalOpen] = useState(false);
  const allItems = pico.items || [];
  const totalUnidades = allItems.reduce((s, it) => s + (it.cantidad || 1), 0);

  // Agrupar por estación
  const byStation = {};
  for (const item of allItems) {
    const est = item.estacion;
    if (!byStation[est]) byStation[est] = { items: [], uds: 0 };
    byStation[est].items.push(item);
    byStation[est].uds += item.cantidad || 1;
  }

  return (
    <div className={`ka-peak-card ${isTop ? "ka-peak-card--top" : ""}`}>
      <div className="ka-peak-card__name">
        {pico.hora} — {totalUnidades} platos simultáneos
      </div>
      <div className="ka-peak-card__row">
        <span className="ka-peak-card__label">Por estación</span>
        <span className="ka-peak-card__val">
          {Object.entries(pico.porEstacion).map(([est, n]) => `${est}: ${n}`).join(", ")}
        </span>
      </div>
      <div className="ka-day-items">
        {allItems.slice(0, PREVIEW_COUNT).map((item, j) => (
          <div key={j} className="ka-day-items__row">
            <span className="ka-day-items__qty">{item.cantidad}x</span>
            <span className="ka-day-items__name">{item.nombre}</span>
            <span className="ka-day-items__est">{item.estacion}</span>
            <span className="ka-day-items__dur">{fmtMin(item.duracionMin)}</span>
          </div>
        ))}
        {allItems.length > PREVIEW_COUNT && (
          <button className="ka-day-items__toggle" onClick={() => setModalOpen(true)}>
            Ver los {totalUnidades} platos en cocina
          </button>
        )}
      </div>

      {/* Modal detalle completo */}
      {modalOpen && (
        <div className="ka-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="ka-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ka-modal__head">
              <h3>{pico.hora} — {totalUnidades} platos en cocina</h3>
              <button className="ka-modal__close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="ka-modal__body">
              {Object.entries(byStation).map(([est, data]) => (
                <div key={est} className="ka-modal__station">
                  <div className="ka-day-items__station-header">{est} ({data.uds} platos)</div>
                  {data.items.map((item, j) => (
                    <div key={j} className="ka-day-items__row">
                      <span className="ka-day-items__qty">{item.cantidad}x</span>
                      <span className="ka-day-items__name">{item.nombre}</span>
                      <span className="ka-day-items__dur">{fmtMin(item.duracionMin)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Station Detail Modal ─────────────────────────────────────────
function StationDetailModal({ estacion, desde, hasta, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!estacion) return;
    setLoading(true);
    api.get(`/admin/eta/analytics/station?estacion=${encodeURIComponent(estacion)}&desde=${desde}&hasta=${hasta}`)
      .then((res) => setData(res.data || res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [estacion, desde, hasta]);

  if (!estacion) return null;

  return (
    <div className="ka-modal-overlay" onClick={onClose}>
      <div className="ka-modal ka-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="ka-modal__head">
          <h3>Detalle: {estacion}</h3>
          <button className="ka-modal__close" onClick={onClose}>&times;</button>
        </div>
        <div className="ka-modal__body">
          {loading ? <div className="ka-loading">Cargando...</div> : !data ? <div className="ka-empty">Sin datos.</div> : (
            <>
              {/* KPIs */}
              <div className="ka-kpis" style={{ marginBottom: "1.2rem" }}>
                <div className="ka-kpi"><span className="ka-kpi__val ka-kpi__val--purple">{data.totalItems}</span><span className="ka-kpi__label">Platos totales</span></div>
                <div className="ka-kpi"><span className="ka-kpi__val ka-kpi__val--cyan">{data.productosUnicos}</span><span className="ka-kpi__label">Productos únicos</span></div>
                <div className="ka-kpi"><span className="ka-kpi__val ka-kpi__val--amber">{data.diasActivos}d</span><span className="ka-kpi__label">Días con actividad</span></div>
              </div>

              {/* Desglose productos */}
              {data.desglose?.length > 0 && (() => {
                const totalMin = data.desglose.reduce((s, d) => s + d.totalMin, 0);
                const totalItems = data.desglose.reduce((s, d) => s + d.items, 0);
                const avgEst = totalItems > 0 ? totalMin / totalItems : 0;
                return (
                  <div className="ka-section">
                    <h4 className="ka-section__title">Desglose de productos</h4>
                    <table className="ka-table">
                      <thead><tr><th>Producto</th><th>Items</th><th>Tiempo medio</th><th>vs media estación</th><th>Min</th><th>Max</th><th>% tiempo</th></tr></thead>
                      <tbody>
                        {data.desglose.map((d, i) => {
                          const vsMedia = avgEst > 0 ? Math.round(((d.avgDurMin - avgEst) / avgEst) * 100) : null;
                          const diffMin = Math.abs(d.avgDurMin - avgEst);
                          return (
                            <tr key={d.nombre} className={i < 3 ? "ka-table__top" : ""}>
                              <td style={{ fontWeight: i < 3 ? 700 : 500 }}>{d.nombre}</td>
                              <td>{d.items}</td>
                              <td>{fmtMin(d.avgDurMin)}</td>
                              <td>{vsMedia != null ? <><DeltaBadge value={vsMedia} invertColor /> <span style={{ color: "#64748b", fontSize: "0.72rem" }}>({vsMedia > 0 ? "+" : ""}{fmtMin(diffMin)})</span></> : "-"}</td>
                              <td>{fmtMin(d.minDurMin)}</td>
                              <td>{fmtMin(d.maxDurMin)}</td>
                              <td>{d.pctTiempo}%<span className="ka-table__pct-bar" style={{ width: `${Math.min(80, d.pctTiempo * 2)}px` }} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Distribución horaria */}
              {data.horaria?.length > 0 && (
                <div className="ka-section">
                  <h4 className="ka-section__title">Actividad por hora del día <span className="ka-section__subtitle">(media diaria)</span></h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.horaria} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                      <Tooltip contentStyle={{ background: "#1e1b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="items" name="Platos/día" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Degradación por carga */}
              {data.carga?.length > 0 && (
                <div className="ka-section">
                  <h4 className="ka-section__title">Tiempo medio según carga de la estación</h4>
                  <div className="ka-bars">
                    {data.carga.map((c) => {
                      const maxDur = Math.max(...data.carga.map((x) => x.avgDurMin)) || 1;
                      const pct = (c.avgDurMin / maxDur) * 100;
                      const color = c.degradacion > 50 ? "red" : c.degradacion > 20 ? "amber" : "green";
                      return (
                        <div key={c.tramo} className="ka-bar-row">
                          <span className="ka-bar__name" style={{ minWidth: 70 }}>{c.tramo}</span>
                          <div className="ka-bar__track">
                            <div className={`ka-bar__fill ka-bar__fill--${color}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="ka-bar__val">{fmtMin(c.avgDurMin)}</span>
                          <span className="ka-bar__val" style={{ color: c.degradacion > 20 ? "#ef4444" : "#64748b" }}>
                            {c.degradacion > 0 ? `+${c.degradacion}%` : "-"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {(() => {
                    const low = data.carga[0];
                    const high = data.carga[data.carga.length - 1];
                    if (low && high && high.avgDurMin > low.avgDurMin * 1.3) {
                      return <p className="ka-insight ka-insight--amber" style={{ marginTop: "0.8rem" }}>
                        <span className="ka-insight__icon">&#x26A0;&#xFE0F;</span>
                        <span className="ka-insight__body"><span className="ka-insight__msg">
                          A carga {high.tramo}, los platos tardan {fmtMin(high.avgDurMin)} vs {fmtMin(low.avgDurMin)} a carga baja (+{Math.round(((high.avgDurMin - low.avgDurMin) / low.avgDurMin) * 100)}%).
                        </span></span>
                      </p>;
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Productos inconsistentes */}
              {data.inconsistentes?.length > 0 && (
                <div className="ka-section">
                  <h4 className="ka-section__title">Productos con tiempos más irregulares</h4>
                  <table className="ka-table">
                    <thead><tr><th>Producto</th><th>Tiempo medio</th><th>Más rápido</th><th>Más lento</th><th>Variabilidad</th></tr></thead>
                    <tbody>
                      {data.inconsistentes.map((d) => (
                        <tr key={d.nombre}>
                          <td style={{ fontWeight: 600 }}>{d.nombre}</td>
                          <td>{fmtMin(d.avgDurMin)}</td>
                          <td style={{ color: "#22c55e" }}>{fmtMin(d.minDurMin)}</td>
                          <td style={{ color: "#ef4444" }}>{fmtMin(d.maxDurMin)}</td>
                          <td><span className={`ka-bar__badge ${d.cv > 0.8 ? "ka-bar__badge--bottleneck" : ""}`} style={{ background: d.cv > 0.8 ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)", color: d.cv > 0.8 ? "#f87171" : "#fbbf24", border: "1px solid", borderRadius: 999, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 700 }}>
                            {fmtMin(d.minDurMin)} – {fmtMin(d.maxDurMin)}
                          </span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Combinaciones problemáticas */}
              {data.combinaciones?.length > 0 && (
                <div className="ka-section">
                  <h4 className="ka-section__title">Combinaciones que ralentizan</h4>
                  <table className="ka-table">
                    <thead><tr><th>Par de productos</th><th>Frecuencia</th><th>Tiempo cuando coinciden</th><th>Tiempo normal</th><th>Impacto</th></tr></thead>
                    <tbody>
                      {data.combinaciones.map((c) => (
                        <tr key={c.par}>
                          <td style={{ fontWeight: 600 }}>{c.par}</td>
                          <td>{c.frecuencia}x</td>
                          <td>{fmtMin(c.avgCuandoCoinciden)}</td>
                          <td>{fmtMin(c.avgNormal)}</td>
                          <td style={{ color: c.degradacion > 30 ? "#ef4444" : c.degradacion > 10 ? "#f59e0b" : "#22c55e", fontWeight: 700 }}>
                            {c.degradacion > 0 ? `+${c.degradacion}%` : `${c.degradacion}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────
function delta(curr, prev) {
  if (prev == null || prev === 0 || curr == null) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

function DeltaBadge({ value, invertColor }) {
  if (value == null) return null;
  // invertColor: for metrics where lower is better (duration), negative delta = green
  const isGood = invertColor ? value < 0 : value > 0;
  const cls = value === 0 ? "ka-delta--flat" : isGood ? "ka-delta--good" : "ka-delta--bad";
  return <span className={`ka-delta ${cls}`}>{value > 0 ? "+" : ""}{value}%</span>;
}

export default function EtaAnalisis() {
  // Rango: desde/hasta para periodo, fechaDia para vista de un solo día
  const today = new Date().toISOString().slice(0, 10);
  const days30ago = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [desde, setDesde] = useState(days30ago);
  const [stationModal, setStationModal] = useState(null);
  const [hasta, setHasta] = useState(today);
  const [comparar, setComparar] = useState(false);
  const [fechaDia, setFechaDia] = useState("");
  const [data, setData] = useState(null);
  const [dayData, setDayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch period analytics
  const fetchData = useCallback(async (d, h, comp) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/eta/analytics?desde=${d}&hasta=${h}${comp ? "&comparar=1" : ""}`);
      setData(res.data || res);
    } catch (err) {
      setError("Error cargando analytics. " + (err?.response?.data?.message || ""));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch day analysis
  const fetchDay = useCallback(async (fecha) => {
    if (!fecha) { setDayData(null); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/eta/analytics/day?fecha=${fecha}`);
      setDayData(res.data || res);
    } catch (err) {
      setError("Error cargando día. " + (err?.response?.data?.message || ""));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fechaDia) fetchDay(fechaDia);
    else fetchData(desde, hasta, comparar);
  }, [desde, hasta, comparar, fechaDia, fetchData, fetchDay]);

  const handleSelectDay = (fecha) => {
    setFechaDia(fecha);
    setDayData(null);
  };

  const clearFilters = () => {
    setFechaDia("");
    setDayData(null);
    setDesde(days30ago);
    setHasta(today);
    setComparar(false);
  };

  const insights = useMemo(() => buildInsights(data), [data]);
  const throughputChart = useMemo(() => buildThroughputChart(data?.throughput), [data]);

  if (loading) return <div className="ka-loading">Cargando analytics...</div>;
  if (error) return <div className="ka-empty">{error}</div>;

  // ── Day view ──
  if (fechaDia && dayData) {
    const dy = dayData;
    return (
      <div className="ka">
        <div className="ka-period">
          <input type="date" className="ka-date-input" value={fechaDia} onChange={(e) => handleSelectDay(e.target.value)} />
          <button className="ka-period__btn" onClick={clearFilters}>Limpiar filtros</button>
        </div>

        {/* Day KPIs */}
        <div className="ka-kpis">
          <div className="ka-kpi">
            <span className="ka-kpi__val ka-kpi__val--purple">{dy.resumen?.totalPlatos ?? 0}</span>
            <span className="ka-kpi__label">Platos del día</span>
          </div>
          <div className="ka-kpi">
            <span className="ka-kpi__val ka-kpi__val--cyan">{fmtMin(dy.resumen?.avgDurMin)}</span>
            <span className="ka-kpi__label">Tiempo medio cocción</span>
          </div>
          <div className="ka-kpi">
            <span className="ka-kpi__val ka-kpi__val--amber">{dy.resumen?.totalEstaciones ?? 0}</span>
            <span className="ka-kpi__label">Estaciones activas</span>
          </div>
          <div className="ka-kpi">
            <span className="ka-kpi__val ka-kpi__val--red">{dy.picos?.[0]?.hora ?? "-"}</span>
            <span className="ka-kpi__label">Momento pico ({dy.picos?.[0]?.cargaTotal ?? 0} items)</span>
          </div>
        </div>

        {/* Timeline AreaChart */}
        {dy.timeline?.length > 0 && (() => {
          // Aplanar porEstacion para recharts (no soporta dot notation fiable)
          const flatTimeline = dy.timeline.map((s) => ({ slot: s.slot, total: s.total, ...s.porEstacion }));
          return (
            <div className="ka-section">
              <h3 className="ka-section__title">Carga de cocina a lo largo del día <span className="ka-section__subtitle">(items simultáneos cada 5 min)</span></h3>
              <div className="ka-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={flatTimeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="slot" tick={{ fontSize: 10, fill: "#64748b" }} interval={Math.max(0, Math.floor(flatTimeline.length / 20))} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ background: "#1e1b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#e2e8f0" }} />
                    {(dy.estaciones || []).map((slug, i) => (
                      <Bar key={slug} dataKey={slug} name={slug} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === (dy.estaciones || []).length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* Peak moments */}
        {dy.picos?.length > 0 && (
          <div className="ka-section">
            <h3 className="ka-section__title">Momentos de mayor saturación</h3>
            <div className="ka-peak-grid">
              {dy.picos.map((pico, i) => (
                <PeakCard key={i} pico={pico} isTop={i === 0} />
              ))}
            </div>
          </div>
        )}

        {/* Station summary */}
        {dy.porEstacion?.length > 0 && (
          <div className="ka-section">
            <h3 className="ka-section__title">Resumen por estación</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="ka-table">
                <thead>
                  <tr><th>Estación</th><th>Platos</th><th>Tiempo medio</th><th>Pico</th><th>Items en pico</th></tr>
                </thead>
                <tbody>
                  {dy.porEstacion.map((e) => (
                    <tr key={e.estacion}>
                      <td style={{ fontWeight: 700 }} className="ka-clickable" onClick={() => setStationModal(e.estacion)}>{e.estacion}</td>
                      <td>{e.platos}</td>
                      <td>{fmtMin(e.avgDurMin)}</td>
                      <td>{e.picoHora ?? "-"}</td>
                      <td>{e.picoItems}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Station detail modal (day view) */}
        {stationModal && (
          <StationDetailModal estacion={stationModal} desde={fechaDia} hasta={fechaDia} onClose={() => setStationModal(null)} />
        )}
      </div>
    );
  }

  // ── Period view (existing) ──
  if (!data) return <div className="ka-empty">Sin datos disponibles.</div>;

  const { throughput, bottleneck, trends, peak, products, anterior } = data;
  const prev = anterior;

  return (
    <div className="ka">
      {/* Date range + compare + day picker */}
      <div className="ka-period">
        <label className="ka-date-label">Desde</label>
        <input type="date" className="ka-date-input" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <label className="ka-date-label">Hasta</label>
        <input type="date" className="ka-date-input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        <button
          className={`ka-period__btn ka-period__btn--compare ${comparar ? "ka-period__btn--on" : ""}`}
          onClick={() => setComparar((c) => !c)}
        >
          Comparar periodo anterior
        </button>
        <span className="ka-period__sep">|</span>
        <label className="ka-date-label">Día</label>
        <input type="date" className="ka-date-input" value={fechaDia} onChange={(e) => handleSelectDay(e.target.value)} />
        {(fechaDia || desde !== days30ago || hasta !== today || comparar) && (
          <button className="ka-period__btn" onClick={clearFilters}>Limpiar filtros</button>
        )}
      </div>

      {/* Insights removed — too much noise, data speaks for itself */}

      {/* B) KPIs */}
      <div className="ka-kpis">
        <div className="ka-kpi">
          <span className="ka-kpi__val ka-kpi__val--purple">{throughput?.global?.itemsPorDia ?? "-"}</span>
          {prev && <DeltaBadge value={delta(throughput?.global?.itemsPorDia, prev.throughput?.global?.itemsPorDia)} />}
          <span className="ka-kpi__label">Platos/día (media)</span>
        </div>
        <div className="ka-kpi">
          <span className="ka-kpi__val ka-kpi__val--cyan">{fmtSeg(throughput?.global?.mediaGapSeg)}</span>
          {prev && <DeltaBadge value={delta(throughput?.global?.mediaGapSeg, prev.throughput?.global?.mediaGapSeg)} invertColor />}
          <span className="ka-kpi__label">Tiempo entre platos</span>
        </div>
        <div className="ka-kpi">
          <span className="ka-kpi__val ka-kpi__val--red">{bottleneck?.bottleneck?.estacion ?? "Ninguno"}</span>
          <span className="ka-kpi__label">Cuello de botella</span>
        </div>
        <div className="ka-kpi">
          <span className={`ka-kpi__val ${trends?.tendenciaGlobal === "mejorando" ? "ka-kpi__val--green" : trends?.tendenciaGlobal === "empeorando" ? "ka-kpi__val--red" : "ka-kpi__val--amber"}`}>
            {trends?.tendenciaGlobal === "mejorando" ? "\u2193" : trends?.tendenciaGlobal === "empeorando" ? "\u2191" : "\u2194"}{" "}
            {trends?.deltaPctUltimaSemana != null ? `${Math.abs(trends.deltaPctUltimaSemana)}%` : "-"}
          </span>
          <span className="ka-kpi__label">Tendencia semanal</span>
        </div>
        {prev && (
          <div className="ka-kpi">
            <span className="ka-kpi__val ka-kpi__val--purple">{prev.throughput?.global?.totalItems ?? "-"}</span>
            <span className="ka-kpi__label">Platos periodo anterior</span>
          </div>
        )}
      </div>

      {/* C) Throughput chart */}
      {throughputChart?.data?.length > 0 && (
        <div className="ka-section">
          <h3 className="ka-section__title">
            Platos por hora del día <span className="ka-section__subtitle">(media diaria, {throughput?.diasActivos ?? "?"} días con actividad)</span>
          </h3>
          <div className="ka-chart">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={throughputChart.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="hora" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ background: "#1e1b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                {throughputChart.slugs.map((slug, i) => (
                  <Bar key={slug} dataKey={slug} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === throughputChart.slugs.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* D) Bottleneck ranking */}
      {bottleneck?.estaciones?.length > 0 && (
        <div className="ka-section">
          <h3 className="ka-section__title">Cuellos de botella por estación</h3>
          <div className="ka-bars">
            {bottleneck.estaciones.map((e, i) => {
              const color = e.score > 70 ? "red" : e.score > 40 ? "amber" : "green";
              return (
                <div key={e.estacion} className={`ka-bar-row ${i === 0 ? "ka-bar-row--top" : ""}`}>
                  <span className="ka-bar__name ka-clickable" onClick={() => setStationModal(e.estacion)}>{e.estacion}</span>
                  <div className="ka-bar__track">
                    <div className={`ka-bar__fill ka-bar__fill--${color}`} style={{ width: `${Math.min(100, e.score)}%` }} />
                  </div>
                  <span className="ka-bar__val">{fmtMin(e.avgDurMin)} media</span>
                  {i === 0 && <span className="ka-bar__badge ka-bar__badge--bottleneck">Cuello de botella</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* E) Peak vs Normal */}
      {peak?.porEstacion?.length > 0 && (
        <div className="ka-section">
          <h3 className="ka-section__title">
            Rendimiento en horas punta vs normal
            <span className="ka-section__subtitle">Pico: {peak.horasPico?.map((h) => `${h}:00`).join(", ")}</span>
          </h3>
          <div className="ka-peak-grid">
            {peak.porEstacion.filter((e) => e.pico && e.noPico).map((e) => (
              <div key={e.estacion} className="ka-peak-card">
                <div className="ka-peak-card__name ka-clickable" onClick={() => setStationModal(e.estacion)}>{e.estacion}</div>
                <div className="ka-peak-card__row">
                  <span className="ka-peak-card__label">Tiempo medio</span>
                  <span className="ka-peak-card__val">
                    {fmtMin(e.noPico?.avgDurMin)} normal / {fmtMin(e.pico?.avgDurMin)} punta
                  </span>
                </div>
                <div className="ka-peak-card__row">
                  <span className="ka-peak-card__label">Espera cola</span>
                  <span className="ka-peak-card__val">
                    {fmtMin(e.noPico?.avgEsperaMin)} / {fmtMin(e.pico?.avgEsperaMin)}
                  </span>
                </div>
                <div className="ka-peak-card__row">
                  <span className="ka-peak-card__label">Platos</span>
                  <span className="ka-peak-card__val">{e.noPico?.items ?? 0} fuera de punta / {e.pico?.items ?? 0} en punta</span>
                </div>
                {(() => {
                  const totalEst = (e.noPico?.items ?? 0) + (e.pico?.items ?? 0);
                  const noPicoPct = totalEst > 0 ? Math.round(((e.noPico?.items ?? 0) / totalEst) * 100) : 0;
                  const pocosNormal = noPicoPct < 10;
                  if (pocosNormal) {
                    return (
                      <div className="ka-peak-card__degradacion ka-peak-card__degradacion--muted">
                        Casi toda la actividad es en horas punta — comparación no significativa
                      </div>
                    );
                  }
                  return (
                    <div className={`ka-peak-card__degradacion ${e.degradacion > 20 ? "ka-peak-card__degradacion--bad" : e.degradacion > 0 ? "ka-peak-card__degradacion--warn" : "ka-peak-card__degradacion--ok"}`}>
                      {e.degradacion > 0
                        ? `+${e.degradacion}% más lento en horas punta`
                        : e.degradacion < -10
                          ? `Media más baja en punta (platos rápidos dominan el servicio)`
                          : `Sin diferencia significativa entre punta y normal`}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* G) Products table */}
      {products?.productos?.length > 0 && (() => {
        const prevMap = {};
        if (prev?.products?.productos) {
          for (const pp of prev.products.productos) prevMap[`${pp.productoId}:${pp.estacion}`] = pp;
        }
        // Media por estación para "vs media estación"
        const estAvg = {};
        for (const e of bottleneck?.estaciones || []) estAvg[e.estacion] = e.avgDurMin;

        return (
          <div className="ka-section">
            <h3 className="ka-section__title">Productos que más tiempo consumen</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="ka-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Estación</th>
                    <th>Tiempo medio</th>
                    <th>vs media estación</th>
                    {prev && <th>vs anterior</th>}
                    <th>Tiempo total</th>
                    <th>% del total</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {products.productos.slice(0, 20).map((p, i) => {
                    const pp = prevMap[`${p.productoId}:${p.estacion}`];
                    const avg = estAvg[p.estacion];
                    const vsMedia = avg ? Math.round(((p.avgDurMin - avg) / avg) * 100) : null;
                    return (
                      <tr key={`${p.productoId}-${p.estacion}`} className={i < 3 ? "ka-table__top" : ""}>
                        <td style={{ fontWeight: i < 3 ? 700 : 500 }}>{p.nombre}</td>
                        <td>{p.estacion}</td>
                        <td>{fmtMin(p.avgDurMin)}</td>
                        <td>{vsMedia != null ? <><DeltaBadge value={vsMedia} invertColor /> <span style={{ color: "#64748b", fontSize: "0.72rem" }}>({vsMedia > 0 ? "+" : ""}{fmtMin(Math.abs(p.avgDurMin - avg))})</span></> : "-"}</td>
                        {prev && (
                          <td>
                            {pp ? <DeltaBadge value={delta(p.avgDurMin, pp.avgDurMin)} invertColor /> : <span style={{ color: "#64748b" }}>nuevo</span>}
                          </td>
                        )}
                        <td>{fmtMin(p.totalMinEstacion)}</td>
                        <td>
                          {p.pctTiempoTotal}%
                          <span className="ka-table__pct-bar" style={{ width: `${Math.min(80, p.pctTiempoTotal * 3)}px` }} />
                        </td>
                        <td>{p.count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Station detail modal */}
      {stationModal && (
        <StationDetailModal
          estacion={stationModal}
          desde={desde}
          hasta={hasta}
          onClose={() => setStationModal(null)}
        />
      )}
    </div>
  );
}
