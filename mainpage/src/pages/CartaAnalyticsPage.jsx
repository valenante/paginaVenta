import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import api from "../utils/api";
import "./CartaAnalyticsPage.css";

const fmtDate = (d) => d.toISOString().split("T")[0];
const flagEmoji = { es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", de: "🇩🇪", it: "🇮🇹", pt: "🇵🇹" };
const allergenEmoji = { gluten: "🌾", lactosa: "🥛", "frutos secos": "🥜", huevo: "🥚", pescado: "🐟", marisco: "🦐", soja: "🫘", apio: "🌿", mostaza: "🟡", sesamo: "⚪", sulfitos: "🍷", moluscos: "🐚", altramuz: "🌱" };

export default function CartaAnalyticsPage({ onBack }) {
  const hoyStr = fmtDate(new Date());
  const [modo, setModo] = useState("hoy"); // "hoy" | "rango" | "todo"
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
  const totalEventos = dias.reduce((s, d) => s + (d.eventosRaw || 0), 0);

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

  // Insights automáticos — solo datos verificables
  const insights = useMemo(() => {
    const list = [];

    // Productos con interés pero sin compra (vistas reales, 0 adds)
    for (const p of r.conversionProductos || []) {
      if (p.vistas >= 5 && p.pedidos === 0) {
        list.push({ icon: "🔍", text: `${p.nombre}: ${p.vistas} personas lo miraron pero ninguna lo añadió al carrito. Revisa la foto, el precio o la descripción.`, type: "warning" });
      }
    }

    // Producto con más conversión (solo si vistas > pedidos, ratio real)
    const mejorConversion = (r.conversionProductos || []).filter(p => p.vistas >= 5 && p.pedidos > 0 && p.pedidos <= p.vistas).sort((a, b) => b.ratio - a.ratio)[0];
    if (mejorConversion && mejorConversion.ratio >= 70) {
      list.push({ icon: "🔥", text: `${mejorConversion.nombre}: el ${mejorConversion.ratio}% de los que lo miran, lo piden. Es tu plato más convincente en la carta.`, type: "success" });
    }

    // Idiomas
    for (const l of idiomasList) {
      if (l.lang !== "es" && l.pct >= 15) {
        list.push({ icon: "🌍", text: `${l.pct}% de tus clientes ven la carta en ${l.lang.toUpperCase()}. Asegúrate de tener buenas traducciones.`, type: "info" });
      }
    }

    // Alérgenos
    for (const a of alergenosList) {
      if (a.pct >= 10) {
        list.push({ icon: "⚠️", text: `${a.pct}% de tus clientes filtran ${a.al}. ¿Tienes suficientes opciones sin ${a.al}?`, type: "warning" });
      }
    }

    // Estrella de revenue
    if (totalRevenue > 0) {
      const top = (r.topPedidos || [])[0];
      if (top) {
        const pct = Math.round((top.revenue / totalRevenue) * 100);
        if (pct >= 20) list.push({ icon: "⭐", text: `${top.nombre} genera el ${pct}% de lo que se pide desde la carta (${top.revenue.toFixed(0)}€). Es tu estrella digital.`, type: "success" });
      }
    }

    return list.slice(0, 5);
  }, [r.conversionProductos, idiomasList, alergenosList, totalRevenue, r.topPedidos]);

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
              <p><strong>Abrieron la carta</strong> — Cuántas veces alguien escaneó el QR y entró a la carta.</p>
              <p><strong>Miraron platos</strong> — Cuántas veces abrieron el detalle de un plato (precio, foto, descripción).</p>
              <p><strong>Metieron al carrito</strong> — Cuántos platos añadieron al carrito. No significa que los hayan pedido.</p>
              <p><strong>Interacciones</strong> — Todo lo que hicieron: navegar, cambiar idioma, filtrar alérgenos, abrir carrito...</p>
              <p><strong>Recorrido</strong> — El camino del cliente: escaneó → miró platos → abrió carrito → pidió. Te dice dónde se pierden.</p>
              <p><strong>Conversión</strong> — Qué % de clientes que miraron un plato lo metieron al carrito. Verde = bien, rojo = interés sin compra.</p>
              <p><strong>Idiomas</strong> — En qué idioma ven la carta. Te dice cuántos turistas tienes.</p>
              <p><strong>Alérgenos</strong> — Qué filtran tus clientes. Si muchos buscan "sin gluten", igual necesitas más opciones.</p>
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
          {/* KPIs con comparativa */}
          <div className="carta-analytics__kpis">
            <KpiCard value={r.sesiones} label="📱 Abrieron la carta" delta={comp.sesiones?.delta} periodo={periodoLabel} />
            <KpiCard value={totalVistas} label="👁 Miraron platos" delta={comp.vistas?.delta} periodo={periodoLabel} />
            <KpiCard value={totalPedidos} label="🛒 Metieron al carrito" delta={comp.pedidos?.delta} periodo={periodoLabel} />
            <KpiCard value={totalEventos || "—"} label="📈 Interacciones" />
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="carta-analytics__insights">
              <h3>💡 Lo que ALEF ve</h3>
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
                <FunnelStep label="Escanearon QR" value={r.sesiones} pct={100} />
                <FunnelStep label="Miraron platos" value={totalVistas} />
                <FunnelStep label="Abrieron carrito" value={dias.reduce((s, d) => s + (d.funnel?.carritoAbierto || 0), 0)} />
                <FunnelStep label="Enviaron pedido" value={r.pedidos} pct={r.conversionSesionAPedido} />
                <FunnelStep label="Pidieron cuenta" value={dias.reduce((s, d) => s + (d.funnel?.cuentasPedidas || 0), 0)} />
                <FunnelStep label="Valoraron" value={dias.reduce((s, d) => s + (d.funnel?.valoraciones || 0), 0)} />
              </div>
            </div>
            <div className="carta-analytics__card">
              <h3>Idiomas</h3>
              {idiomasList.map((l) => (
                <div key={l.lang} className="idioma-row">
                  <span className="idioma-flag">{flagEmoji[l.lang] || "🌐"}</span>
                  <span className="idioma-code">{l.lang.toUpperCase()}</span>
                  <div className="idioma-bar-bg"><div className="idioma-bar" style={{ width: `${Math.max(l.pct, 2)}%` }} /></div>
                  <span className="idioma-pct">{l.pct}%</span>
                </div>
              ))}
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
              {alergenosList.length === 0 ? <p className="carta-analytics__muted">Nadie ha filtrado alérgenos</p> : (
                alergenosList.map((a) => (
                  <div key={a.al} className="idioma-row">
                    <span className="idioma-flag">{allergenEmoji[a.al.toLowerCase()] || "⚠️"}</span>
                    <span className="idioma-code" style={{ minWidth: 80 }}>{a.al}</span>
                    <div className="idioma-bar-bg"><div className="idioma-bar" style={{ width: `${Math.max(a.pct, 2)}%`, background: "#eab308" }} /></div>
                    <span className="idioma-pct">{a.pct}%</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Qué miran vs qué piden */}
          <div className="carta-analytics__card">
            <h3>Qué miran vs qué piden</h3>
            {(r.conversionProductos || []).length === 0 ? <p className="carta-analytics__muted">Sin datos</p> : (
              <div className="carta-analytics__table-wrap">
                <table className="carta-analytics__table">
                  <thead><tr><th>Producto</th><th>Lo miraron</th><th>Lo pidieron</th><th>Conversión</th></tr></thead>
                  <tbody>
                    {(r.conversionProductos || []).map((p, i) => {
                      // Ratio real: solo si hay vistas, capear a 100% (no puede ser mayor)
                      const realRatio = p.vistas > 0 ? Math.min(Math.round((p.pedidos / p.vistas) * 100), 100) : null;
                      const color = realRatio === null ? "#6b7280" : realRatio >= 70 ? "#16a34a" : realRatio >= 40 ? "#eab308" : "#ef4444";
                      return (<tr key={i}><td className="prod-name">{p.nombre}</td><td className="num">{p.vistas}</td><td className="num">{p.pedidos}</td><td className="num">{realRatio !== null ? <span className="ratio-badge" style={{ background: color }}>{realRatio}%</span> : <span style={{ opacity: 0.4 }}>—</span>}</td></tr>);
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
                    <thead><tr><th>Producto</th><th>Uds</th><th>Revenue</th></tr></thead>
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
                    <thead><tr><th>Categoría</th><th>Vistas</th><th>Pedidos</th></tr></thead>
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
        </>
      )}
    </div>
  );
}

function KpiCard({ value, label, delta, periodo }) {
  const isUp = delta > 0;
  const isDown = delta < 0;
  return (
    <div className="carta-analytics__kpi">
      <span className="kpi-value">{value}</span>
      <span className="kpi-label">{label}</span>
      {delta != null && delta !== 0 && (
        <span className={`kpi-delta ${isUp ? "kpi-delta--up" : "kpi-delta--down"}`}>
          {isUp ? "↑" : "↓"} {Math.abs(delta)}% {periodo || ""}
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
