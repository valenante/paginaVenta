import React, { useState, useEffect, useMemo } from "react";
import api from "../utils/api";
import "./CartaAnalyticsPage.css";

const RANGOS = [
  { key: "hoy", label: "Hoy" },
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
];

const fmtDate = (d) => d.toISOString().split("T")[0];

export default function CartaAnalyticsPage({ onBack }) {
  const [rango, setRango] = useState("hoy");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const ahora = new Date();
        let desde, hasta;
        if (rango === "hoy") {
          desde = hasta = fmtDate(ahora);
        } else if (rango === "7d") {
          hasta = fmtDate(ahora);
          const d = new Date(ahora); d.setDate(d.getDate() - 7);
          desde = fmtDate(d);
        } else {
          hasta = fmtDate(ahora);
          const d = new Date(ahora); d.setDate(d.getDate() - 30);
          desde = fmtDate(d);
        }
        const { data: res } = await api.get(`/analytics/carta?desde=${desde}&hasta=${hasta}`);
        setData(res);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [rango]);

  const r = data?.resumen || {};
  const dias = data?.dias || [];

  // Idiomas sorted
  const idiomasList = useMemo(() => {
    const obj = r.idiomas || {};
    const total = Object.values(obj).reduce((s, v) => s + v, 0);
    return Object.entries(obj)
      .map(([lang, count]) => ({ lang, count, pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [r.idiomas]);

  const totalEventos = dias.reduce((s, d) => s + (d.eventosRaw || 0), 0);

  const flagEmoji = { es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", de: "🇩🇪", it: "🇮🇹", pt: "🇵🇹" };

  return (
    <div className="carta-analytics">
      <header className="carta-analytics__header">
        <div>
          <h1>📊 Analytics de la Carta</h1>
          <p>Cómo interactúan los clientes con tu carta digital.</p>
        </div>
        {onBack && <button className="carta-analytics__back" onClick={onBack}>← Volver</button>}
      </header>

      {/* Rango */}
      <div className="carta-analytics__rangos">
        {RANGOS.map((r) => (
          <button
            key={r.key}
            className={`carta-analytics__rango ${rango === r.key ? "active" : ""}`}
            onClick={() => setRango(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="carta-analytics__loading">Cargando...</div>
      ) : !data || !r.sesiones ? (
        <div className="carta-analytics__empty">Sin datos para este periodo.</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="carta-analytics__kpis">
            <div className="carta-analytics__kpi">
              <span className="kpi-value">{r.sesiones}</span>
              <span className="kpi-label">📱 Escaneos QR</span>
            </div>
            <div className="carta-analytics__kpi">
              <span className="kpi-value">{r.topVistos?.reduce((s, p) => s + p.vistas, 0) || 0}</span>
              <span className="kpi-label">👁 Productos vistos</span>
            </div>
            <div className="carta-analytics__kpi">
              <span className="kpi-value">{r.topPedidos?.reduce((s, p) => s + p.pedidos, 0) || 0}</span>
              <span className="kpi-label">🛒 Añadidos al carrito</span>
            </div>
            <div className="carta-analytics__kpi">
              <span className="kpi-value">{dias.reduce((s, d) => s + (d.eventosRaw || d.funnel?.sesiones * 10 || 0), 0)}</span>
              <span className="kpi-label">📈 Interacciones</span>
            </div>
          </div>

          {/* Funnel + Idiomas */}
          <div className="carta-analytics__row">
            {/* Funnel */}
            <div className="carta-analytics__card carta-analytics__funnel">
              <h3>Funnel de conversión</h3>
              <div className="funnel-steps">
                <FunnelStep label="Sesiones" value={r.sesiones} pct={100} />
                <FunnelStep label="Productos vistos" value={r.topVistos?.reduce((s, p) => s + p.vistas, 0) || 0} />
                <FunnelStep label="Carrito abierto" value={dias.reduce((s, d) => s + (d.funnel?.carritoAbierto || 0), 0)} pct={r.conversionSesionAPedido > 0 ? null : null} />
                <FunnelStep label="Pedidos enviados" value={r.pedidos} pct={r.conversionSesionAPedido} />
                <FunnelStep label="Cuenta pedida" value={dias.reduce((s, d) => s + (d.funnel?.cuentasPedidas || 0), 0)} />
                <FunnelStep label="Valoraciones" value={dias.reduce((s, d) => s + (d.funnel?.valoraciones || 0), 0)} />
              </div>
            </div>

            {/* Idiomas */}
            <div className="carta-analytics__card carta-analytics__idiomas">
              <h3>Idiomas</h3>
              {idiomasList.length === 0 ? (
                <p className="carta-analytics__muted">Sin datos</p>
              ) : (
                idiomasList.map((l) => (
                  <div key={l.lang} className="idioma-row">
                    <span className="idioma-flag">{flagEmoji[l.lang] || "🌐"}</span>
                    <span className="idioma-code">{l.lang.toUpperCase()}</span>
                    <div className="idioma-bar-bg">
                      <div className="idioma-bar" style={{ width: `${Math.max(l.pct, 2)}%` }} />
                    </div>
                    <span className="idioma-pct">{l.pct}%</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tabla productos: vistas vs añadidos */}
          <div className="carta-analytics__card">
            <h3>Productos: vistas vs añadidos al carrito</h3>
            {(r.conversionProductos || []).length === 0 ? (
              <p className="carta-analytics__muted">Sin datos</p>
            ) : (
              <div className="carta-analytics__table-wrap">
                <table className="carta-analytics__table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Vistas</th>
                      <th>Añadidos</th>
                      <th>Conversión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(r.conversionProductos || []).map((p, i) => {
                      const ratioColor = p.ratio >= 100 ? "#3b82f6" : p.ratio >= 50 ? "#16a34a" : p.ratio >= 20 ? "#eab308" : "#ef4444";
                      return (
                        <tr key={i}>
                          <td className="prod-name">{p.nombre}</td>
                          <td className="num">{p.vistas}</td>
                          <td className="num">{p.pedidos}</td>
                          <td className="num">
                            <span className="ratio-badge" style={{ background: ratioColor }}>{p.ratio}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Revenue por producto */}
          {(r.topPedidos || []).length > 0 && (
            <div className="carta-analytics__card">
              <h3>Revenue desde la carta</h3>
              <div className="carta-analytics__table-wrap">
                <table className="carta-analytics__table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Uds</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(r.topPedidos || []).map((p, i) => (
                      <tr key={i}>
                        <td className="prod-name">{p.nombre}</td>
                        <td className="num">{p.pedidos}</td>
                        <td className="num revenue">{p.revenue?.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
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
