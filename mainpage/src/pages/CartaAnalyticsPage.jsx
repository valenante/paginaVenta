/**
 * CartaAnalyticsPage — v2 (auditoría 9-mayo-2026)
 *
 * Reglas de veracidad:
 * - "Abrieron la carta" = sesiones únicas (no recargas)
 * - "Miraron platos" = veces que se abrió modal de detalle
 * - "Lo añadieron" = veces que se pulsó agregar (NO unidades)
 * - "Interacciones" = total eventos raw
 * - Conversión capeada a 100%, productos con 0 vistas NO se muestran
 * - Revenue usa cantidad×precio (dinero real)
 * - Comparativa solo se muestra si hay datos en periodo anterior (no "+100%")
 * - Insights solo con datos verificables
 */
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import api from "../utils/api";
import "./CartaAnalyticsPage.css";

const fmtDate = (d) => d.toISOString().split("T")[0];
const flagEmoji = { es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", de: "🇩🇪", it: "🇮🇹", pt: "🇵🇹" };
const allergenEmoji = { gluten: "🌾", lactosa: "🥛", "frutos secos": "🥜", huevo: "🥚", pescado: "🐟", marisco: "🦐", soja: "🫘", apio: "🌿", mostaza: "🟡", sesamo: "⚪", sulfitos: "🍷", moluscos: "🐚", altramuz: "🌱" };

export default function CartaAnalyticsPage({ onBack }) {
  const hoyStr = fmtDate(new Date());
  const [modo, setModo] = useState("hoy");
  const [desde, setDesde] = useState(hoyStr);
  const [hasta, setHasta] = useState(hoyStr);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let qDesde, qHasta;
        if (modo === "hoy") { qDesde = qHasta = hoyStr; }
        else if (modo === "rango") { qDesde = desde; qHasta = hasta; }
        else { qDesde = "2020-01-01"; qHasta = hoyStr; }
        const { data: res } = await api.get(`/analytics/carta?desde=${qDesde}&hasta=${qHasta}`);
        setData(res);
      } catch { setData(null); }
      finally { setLoading(false); }
    })();
  }, [modo, desde, hasta, hoyStr]);

  const r = data?.resumen || {};
  const comp = data?.comparativa || {};
  const dias = data?.dias || [];

  const totalVistas = useMemo(() => (r.topVistos || []).reduce((s, p) => s + p.vistas, 0), [r.topVistos]);
  const totalPedidos = useMemo(() => (r.topPedidos || []).reduce((s, p) => s + p.pedidos, 0), [r.topPedidos]);
  const totalRevenue = useMemo(() => (r.topPedidos || []).reduce((s, p) => s + (p.revenue || 0), 0), [r.topPedidos]);

  // Idiomas
  const idiomasList = useMemo(() => {
    const obj = r.idiomas || {};
    const total = Object.values(obj).reduce((s, v) => s + v, 0);
    return Object.entries(obj).map(([lang, count]) => ({ lang, count, pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0 })).sort((a, b) => b.count - a.count);
  }, [r.idiomas]);

  // Alérgenos
  const alergenosList = useMemo(() => {
    const obj = r.alergenosFiltrados || {};
    return Object.entries(obj).map(([al, count]) => ({ al, count, pct: r.sesiones > 0 ? Math.round((count / r.sesiones) * 1000) / 10 : 0 })).sort((a, b) => b.count - a.count);
  }, [r.alergenosFiltrados, r.sesiones]);

  // Sesiones por hora
  const horasData = useMemo(() => {
    const sh = r.sesionesHora || {};
    const entries = Object.entries(sh).map(([h, c]) => ({ hora: Number(h), count: c })).sort((a, b) => a.hora - b.hora);
    const max = Math.max(...entries.map(e => e.count), 1);
    return { entries, max };
  }, [r.sesionesHora]);

  // Conversión: solo productos con vistas > 0 (del backend ya filtrado, doble seguridad)
  const conversionFiltrada = useMemo(() =>
    (r.conversionProductos || []).filter(p => p.vistas > 0),
  [r.conversionProductos]);

  // Insights — solo verificables
  const insights = useMemo(() => {
    const list = [];

    for (const p of conversionFiltrada) {
      if (p.vistas >= 5 && p.pedidos === 0)
        list.push({ icon: "🔍", text: `${p.nombre}: ${p.vistas} personas lo miraron pero ninguna lo añadió al carrito. Revisa la foto, el precio o la descripción.`, type: "warning" });
    }

    const mejor = conversionFiltrada.filter(p => p.vistas >= 5 && p.pedidos > 0).sort((a, b) => b.ratio - a.ratio)[0];
    if (mejor && mejor.ratio >= 70)
      list.push({ icon: "🔥", text: `${mejor.nombre}: el ${mejor.ratio}% de los que lo miran, lo piden. Es tu plato más convincente en la carta.`, type: "success" });

    for (const l of idiomasList) {
      if (l.lang !== "es" && l.pct >= 15)
        list.push({ icon: "🌍", text: `${l.pct}% de tus clientes ven la carta en ${l.lang.toUpperCase()}. Asegúrate de tener buenas traducciones.`, type: "info" });
    }

    for (const a of alergenosList) {
      if (a.pct >= 10)
        list.push({ icon: "⚠️", text: `${a.pct}% de tus clientes filtran ${a.al}. ¿Tienes suficientes opciones sin ${a.al}?`, type: "warning" });
    }

    if (totalRevenue > 0) {
      const top = (r.topPedidos || [])[0];
      if (top) {
        const pct = Math.round((top.revenue / totalRevenue) * 100);
        if (pct >= 20) list.push({ icon: "⭐", text: `${top.nombre} genera el ${pct}% de lo que se pide desde la carta (${top.revenue.toFixed(0)}€). Es tu estrella digital.`, type: "success" });
      }
    }

    return list.slice(0, 5);
  }, [conversionFiltrada, idiomasList, alergenosList, totalRevenue, r.topPedidos]);

  const periodoLabel = modo === "hoy" ? "vs ayer" : modo === "rango" ? "vs periodo ant." : "";

  return (
    <div className="carta-analytics">
      <div className="carta-analytics__toolbar">
        <div className="carta-analytics__filtros">
          <button className={`carta-analytics__rango ${modo === "hoy" ? "active" : ""}`} onClick={() => setModo("hoy")}>Hoy</button>
          <button className={`carta-analytics__rango ${modo === "rango" ? "active" : ""}`} onClick={() => setModo("rango")}>Rango</button>
          <button className={`carta-analytics__rango ${modo === "todo" ? "active" : ""}`} onClick={() => setModo("todo")}>Todo</button>
          {modo === "rango" && (
            <div className="carta-analytics__dates">
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} max={hasta} />
              <span>→</span>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} min={desde} max={hoyStr} />
            </div>
          )}
        </div>
        <button className="carta-analytics__help-btn" onClick={() => setShowHelp(true)}>?</button>
      </div>

      {showHelp && createPortal(
        <div className="carta-analytics__help-overlay" onClick={() => setShowHelp(false)}>
          <div className="carta-analytics__help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="carta-analytics__help-head"><h3>Qué significan estos datos</h3><button onClick={() => setShowHelp(false)}>✕</button></div>
            <div className="carta-analytics__help-body">
              <p><strong>Abrieron la carta</strong> — Cuántos dispositivos distintos escanearon el QR y entraron a la carta.</p>
              <p><strong>Miraron platos</strong> — Cuántas veces se abrió el detalle de un plato (para ver precio, foto, descripción).</p>
              <p><strong>Lo añadieron</strong> — Cuántas veces se pulsó "Agregar al carrito". Si alguien añade 5 unidades de golpe, cuenta como 1.</p>
              <p><strong>Interacciones</strong> — Total de acciones registradas: navegar, cambiar idioma, filtrar alérgenos, abrir carrito, etc.</p>
              <p><strong>Conversión</strong> — De los que miraron un plato, ¿cuántos lo añadieron? Verde (&gt;70%) = convence. Rojo (&lt;40%) = miran pero no piden.</p>
              <p><strong>Revenue</strong> — Dinero real de lo añadido al carrito (precio × cantidad).</p>
            </div>
          </div>
        </div>, document.body
      )}

      {loading ? (
        <div className="carta-analytics__loading">Cargando...</div>
      ) : !data || !r.sesiones ? (
        <div className="carta-analytics__empty">Sin datos para este periodo.</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="carta-analytics__kpis">
            <KpiCard value={r.sesiones} label="Abrieron la carta" delta={comp.sesiones?.delta} periodo={periodoLabel} />
            <KpiCard value={totalVistas} label="Miraron platos" delta={comp.vistas?.delta} periodo={periodoLabel} />
            <KpiCard value={totalPedidos} label="Lo añadieron" delta={comp.pedidos?.delta} periodo={periodoLabel} />
            <KpiCard value={r.eventosRaw || dias.reduce((s, d) => s + (d.eventosRaw || 0), 0)} label="Interacciones" />
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="carta-analytics__insights">
              <h3>Lo que ALEF ve</h3>
              {insights.map((ins, i) => (
                <div key={i} className={`insight-card insight-card--${ins.type}`}>
                  <span className="insight-icon">{ins.icon}</span>
                  <span className="insight-text">{ins.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Funnel + Idiomas */}
          <div className="carta-analytics__row">
            <div className="carta-analytics__card">
              <h3>Recorrido del cliente</h3>
              <div className="funnel-steps">
                <FunnelStep label="sesiones" value={r.sesiones} />
                <FunnelStep label="veces miraron un plato" value={totalVistas} />
                <FunnelStep label="veces abrieron el carrito" value={dias.reduce((s, d) => s + (d.funnel?.carritoAbierto || 0), 0)} />
                <FunnelStep label="pedidos enviados" value={r.pedidos} />
                <FunnelStep label="veces pidieron cuenta" value={dias.reduce((s, d) => s + (d.funnel?.cuentasPedidas || 0), 0)} />
                <FunnelStep label="valoraciones" value={dias.reduce((s, d) => s + (d.funnel?.valoraciones || 0), 0)} />
              </div>
            </div>
            <div className="carta-analytics__card">
              <h3>Idiomas</h3>
              {idiomasList.length === 0 ? <p className="carta-analytics__muted">Sin datos</p> :
                idiomasList.map((l) => (
                  <div key={l.lang} className="idioma-row">
                    <span className="idioma-flag">{flagEmoji[l.lang] || "🌐"}</span>
                    <span className="idioma-code">{l.lang.toUpperCase()}</span>
                    <div className="idioma-bar-bg"><div className="idioma-bar" style={{ width: `${Math.max(l.pct, 2)}%` }} /></div>
                    <span className="idioma-pct">{l.pct}%</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Horaria + Alérgenos */}
          <div className="carta-analytics__row">
            <div className="carta-analytics__card">
              <h3>Cuándo escanean la carta</h3>
              {horasData.entries.length === 0 ? <p className="carta-analytics__muted">Sin datos</p> : (
                <div className="horas-chart">
                  {horasData.entries.map((e) => (
                    <div key={e.hora} className="hora-col">
                      <div className="hora-bar-wrap">
                        <div className="hora-bar" style={{ height: `${(e.count / horasData.max) * 100}%` }} />
                      </div>
                      <span className="hora-count">{e.count}</span>
                      <span className="hora-label">{String(e.hora).padStart(2, "0")}h</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="carta-analytics__card">
              <h3>Filtros de alérgenos</h3>
              {alergenosList.length === 0 ? <p className="carta-analytics__muted">Nadie ha filtrado alérgenos</p> :
                alergenosList.map((a) => (
                  <div key={a.al} className="idioma-row">
                    <span className="idioma-flag">{allergenEmoji[a.al.toLowerCase()] || "⚠️"}</span>
                    <span className="idioma-code" style={{ minWidth: 80 }}>{a.al}</span>
                    <div className="idioma-bar-bg"><div className="idioma-bar" style={{ width: `${Math.max(a.pct, 2)}%`, background: "#eab308" }} /></div>
                    <span className="idioma-pct">{a.pct}%</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Qué miran vs qué piden — SOLO productos con vistas > 0 */}
          <div className="carta-analytics__card">
            <h3>Qué miran vs qué piden</h3>
            {conversionFiltrada.length === 0 ? <p className="carta-analytics__muted">Sin datos</p> : (
              <div className="carta-analytics__table-wrap">
                <table className="carta-analytics__table">
                  <thead><tr><th>Producto</th><th>Lo miraron</th><th>Lo añadieron</th><th>Conversión</th></tr></thead>
                  <tbody>
                    {conversionFiltrada.map((p, i) => {
                      const color = p.ratio >= 70 ? "#16a34a" : p.ratio >= 40 ? "#eab308" : "#ef4444";
                      return (<tr key={i}><td className="prod-name">{p.nombre}</td><td className="num">{p.vistas}</td><td className="num">{p.pedidos}</td><td className="num"><span className="ratio-badge" style={{ background: color }}>{p.ratio}%</span></td></tr>);
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Revenue + Categorías */}
          <div className="carta-analytics__row">
            {(r.topPedidos || []).length > 0 && (
              <div className="carta-analytics__card">
                <h3>Lo que vende la carta</h3>
                <div className="carta-analytics__table-wrap">
                  <table className="carta-analytics__table">
                    <thead><tr><th>Producto</th><th>Veces</th><th>Revenue</th></tr></thead>
                    <tbody>
                      {(r.topPedidos || []).map((p, i) => (
                        <tr key={i}><td className="prod-name">{p.nombre}</td><td className="num">{p.pedidos}</td><td className="num revenue">{p.revenue?.toFixed(2)} €</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {(r.categorias || []).length > 0 && (
              <div className="carta-analytics__card">
                <h3>Por categoría</h3>
                <div className="carta-analytics__table-wrap">
                  <table className="carta-analytics__table">
                    <thead><tr><th>Categoría</th><th>Vistas</th><th>Añadidos</th></tr></thead>
                    <tbody>
                      {(r.categorias || []).map((c, i) => (
                        <tr key={i}><td className="prod-name">{c.nombre}</td><td className="num">{c.vistas}</td><td className="num">{c.pedidos}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sugerencias */}
          <SugerenciasSection dias={dias} resumen={r} />
        </>
      )}
    </div>
  );
}

function SugerenciasSection({ dias, resumen }) {
  const sug = useMemo(() => {
    // Agregar sugerencias de todos los días
    let mostradas = 0, añadidas = 0, descartadas = 0;
    const touchpoints = { carrito: { mostradas: 0, añadidas: 0 }, detalleProducto: { mostradas: 0, añadidas: 0 }, postPedido: { mostradas: 0, añadidas: 0 } };
    const topMap = new Map();

    for (const d of dias) {
      const s = d.sugerencias;
      if (!s) continue;
      mostradas += s.mostradas || 0;
      añadidas += s.añadidas || 0;
      descartadas += s.descartadas || 0;
      if (s.porTouchpoint) {
        for (const [tp, v] of Object.entries(s.porTouchpoint)) {
          if (touchpoints[tp]) {
            touchpoints[tp].mostradas += v.mostradas || 0;
            touchpoints[tp].añadidas += v.añadidas || 0;
          }
        }
      }
      for (const t of (s.topSugerencias || [])) {
        const key = t.productId || t.nombre;
        const acc = topMap.get(key) || { nombre: t.nombre, mostradas: 0, añadidas: 0 };
        acc.mostradas += t.mostradas || 0;
        acc.añadidas += t.añadidas || 0;
        topMap.set(key, acc);
      }
    }

    const top = [...topMap.values()]
      .map(t => ({ ...t, rate: t.mostradas > 0 ? Math.round((t.añadidas / t.mostradas) * 1000) / 10 : 0 }))
      .sort((a, b) => b.añadidas - a.añadidas)
      .slice(0, 10);

    const conversionRate = mostradas > 0 ? Math.round((añadidas / mostradas) * 1000) / 10 : 0;

    return { mostradas, añadidas, descartadas, conversionRate, touchpoints, top };
  }, [dias]);

  if (sug.mostradas === 0 && sug.añadidas === 0) {
    return (
      <div className="carta-analytics__card">
        <h3>Sugerencias inteligentes</h3>
        <p className="carta-analytics__muted">Aún no hay datos de sugerencias. Aparecerán cuando los clientes interactúen con las recomendaciones en la carta.</p>
      </div>
    );
  }

  const tpList = [
    { key: "carrito", label: "Carrito", emoji: "🛒" },
    { key: "detalleProducto", label: "Detalle producto", emoji: "📋" },
    { key: "postPedido", label: "Post-pedido", emoji: "🍰" },
  ];

  return (
    <>
      <div className="carta-analytics__card">
        <h3>Sugerencias inteligentes</h3>
        <div className="carta-analytics__kpis" style={{ marginBottom: 16 }}>
          <div className="carta-analytics__kpi">
            <span className="kpi-value">{sug.mostradas}</span>
            <span className="kpi-label">Mostradas</span>
          </div>
          <div className="carta-analytics__kpi">
            <span className="kpi-value">{sug.añadidas}</span>
            <span className="kpi-label">Anadidas al carrito</span>
          </div>
          <div className="carta-analytics__kpi">
            <span className="kpi-value">{sug.descartadas}</span>
            <span className="kpi-label">Descartadas</span>
          </div>
          <div className="carta-analytics__kpi">
            <span className="kpi-value" style={{ color: sug.conversionRate >= 10 ? "#16a34a" : sug.conversionRate >= 5 ? "#eab308" : "#ef4444" }}>
              {sug.conversionRate}%
            </span>
            <span className="kpi-label">Conversion</span>
          </div>
        </div>

        {/* Por touchpoint */}
        <h4 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: 8 }}>Por punto de contacto</h4>
        <div className="carta-analytics__table-wrap">
          <table className="carta-analytics__table">
            <thead><tr><th>Touchpoint</th><th>Mostradas</th><th>Anadidas</th><th>Conversion</th></tr></thead>
            <tbody>
              {tpList.map(({ key, label, emoji }) => {
                const tp = sug.touchpoints[key];
                const rate = tp.mostradas > 0 ? Math.round((tp.añadidas / tp.mostradas) * 1000) / 10 : 0;
                const color = rate >= 10 ? "#16a34a" : rate >= 5 ? "#eab308" : "#ef4444";
                return (
                  <tr key={key}>
                    <td className="prod-name">{emoji} {label}</td>
                    <td className="num">{tp.mostradas}</td>
                    <td className="num">{tp.añadidas}</td>
                    <td className="num"><span className="ratio-badge" style={{ background: tp.mostradas > 0 ? color : "#9ca3af" }}>{rate}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sug.top.length > 0 && (
        <div className="carta-analytics__card">
          <h3>Top sugerencias que convierten</h3>
          <div className="carta-analytics__table-wrap">
            <table className="carta-analytics__table">
              <thead><tr><th>Producto sugerido</th><th>Mostrado</th><th>Anadido</th><th>Conversion</th></tr></thead>
              <tbody>
                {sug.top.map((t, i) => {
                  const color = t.rate >= 15 ? "#16a34a" : t.rate >= 5 ? "#eab308" : "#ef4444";
                  return (
                    <tr key={i}>
                      <td className="prod-name">{t.nombre}</td>
                      <td className="num">{t.mostradas}</td>
                      <td className="num">{t.añadidas}</td>
                      <td className="num"><span className="ratio-badge" style={{ background: t.mostradas > 0 ? color : "#9ca3af" }}>{t.rate}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function KpiCard({ value, label, delta, periodo }) {
  return (
    <div className="carta-analytics__kpi">
      <span className="kpi-value">{value}</span>
      <span className="kpi-label">{label}</span>
      {delta != null && (
        <span className={`kpi-delta ${delta > 0 ? "kpi-delta--up" : "kpi-delta--down"}`}>
          {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}% {periodo || ""}
        </span>
      )}
    </div>
  );
}

function FunnelStep({ label, value, pct }) {
  return (
    <div className="funnel-step">
      <span className="funnel-step__value">{value}</span>
      <span className="funnel-step__label">{label}</span>
      {pct != null && <span className="funnel-step__pct">{pct}%</span>}
      <div className="funnel-step__arrow">↓</div>
    </div>
  );
}
