// src/components/Panel/AnalyticsFase3.jsx
// Analytics Fase 3: correlación, alertas, proyección ajustada
import { useEffect, useState } from "react";
import api from "../../utils/api";
import "./AnalyticsFase3.css";

const money = (n) => Number(n || 0).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/* ═══════════════════════════════════════
   1. CORRELACIÓN DE PRODUCTOS
   ��══════════════════════════════════════ */
export function CorrelacionCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    api.get("/dashboard/correlacion")
      .then(({ data: d }) => { if (m) setData(d?.data || d); })
      .catch(() => {})
      .finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, []);

  if (loading) return <div className="af3-card af3-card--loading">Cargando correlaciones...</div>;
  if (!data?.correlaciones?.length) return null;

  return (
    <div className="af3-card">
      <div className="af3-card__head">
        <h3>Productos que se piden juntos</h3>
        <span className="af3-card__sub">{data.totalPedidos} pedidos analizados · últimas 4 semanas</span>
      </div>
      <div className="af3-corr-list">
        {data.correlaciones.slice(0, 8).map((c, i) => (
          <div key={i} className="af3-corr-row">
            <div className="af3-corr-pair">
              <span className="af3-corr-name">{c.productoA}</span>
              <span className="af3-corr-plus">+</span>
              <span className="af3-corr-name">{c.productoB}</span>
            </div>
            <div className="af3-corr-stats">
              <span className="af3-corr-count">{c.vecesJuntos}×</span>
              <span className="af3-corr-pct">{c.confianzaAB}%</span>
            </div>
          </div>
        ))}
      </div>
      <p className="af3-card__tip">Usa esta info para sugerir upselling: "¿Le pongo un X con el Y?"</p>
    </div>
  );
}

/* ═════════���════════════════════════���════
   2. ALERTAS INTELIGENTES
   ═════��═══════════════��═════════════════ */
export function AlertasCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    api.get("/dashboard/alertas")
      .then(({ data: d }) => { if (m) setData(d?.data || d); })
      .catch(() => {})
      .finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, []);

  if (loading) return <div className="af3-card af3-card--loading">Analizando...</div>;
  if (!data?.alertas?.length) {
    return (
      <div className="af3-card af3-card--ok">
        <div className="af3-card__head"><h3>Alertas inteligentes</h3></div>
        <p className="af3-ok-msg">Todo bien — sin alertas activas</p>
      </div>
    );
  }

  const sevIcon = { alta: "🔴", media: "🟡", baja: "🔵" };

  return (
    <div className="af3-card">
      <div className="af3-card__head">
        <h3>Alertas inteligentes</h3>
        <span className="af3-badge">{data.totalAlertas}</span>
      </div>
      <div className="af3-alertas-list">
        {data.alertas.map((a, i) => (
          <div key={i} className={`af3-alerta af3-alerta--${a.severidad}`}>
            <span className="af3-alerta__icon">{sevIcon[a.severidad] || "⚪"}</span>
            <div className="af3-alerta__body">
              <span className="af3-alerta__msg">{a.mensaje}</span>
              <span className="af3-alerta__tipo">{a.tipo.replace(/_/g, " ")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════��════════════════��════════════
   3. PROYECCIÓN AJUSTADA
   ══════��══════════════════════��═════════ */
export function ProyeccionCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    api.get("/dashboard/proyeccion-ajustada")
      .then(({ data: d }) => { if (m) setData(d?.data || d); })
      .catch(() => {})
      .finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, []);

  if (loading) return <div className="af3-card af3-card--loading">Calculando proyección...</div>;
  if (!data) return null;

  const { ventasRealizadas, diasTranscurridos, diasRestantes, diasTotales, proyeccionAjustada, proyeccionLineal, diferencia, mediaPorDiaSemana } = data;
  const pctMes = diasTotales > 0 ? Math.round((diasTranscurridos / diasTotales) * 100) : 0;

  return (
    <div className="af3-card">
      <div className="af3-card__head">
        <h3>Proyección del mes</h3>
        <span className="af3-card__sub">{diasTranscurridos}/{diasTotales} días ({pctMes}%)</span>
      </div>

      <div className="af3-proy-kpis">
        <div className="af3-proy-kpi">
          <span className="af3-proy-label">Realizado</span>
          <span className="af3-proy-value">{money(ventasRealizadas)}€</span>
        </div>
        <div className="af3-proy-kpi af3-proy-kpi--main">
          <span className="af3-proy-label">Proyección ajustada</span>
          <span className="af3-proy-value">{money(proyeccionAjustada)}€</span>
        </div>
        <div className="af3-proy-kpi">
          <span className="af3-proy-label">Proyección lineal</span>
          <span className="af3-proy-value af3-proy-value--dim">{money(proyeccionLineal)}€</span>
        </div>
      </div>

      {diferencia !== 0 && (
        <p className="af3-proy-diff">
          La ajustada es <strong>{money(Math.abs(diferencia))}€ {diferencia > 0 ? "más" : "menos"}</strong> que la lineal
          porque los días restantes del mes {diferencia > 0 ? "incluyen fines de semana fuertes" : "son días más flojos"}.
        </p>
      )}

      {/* Barra de progreso */}
      <div className="af3-proy-bar-wrap">
        <div className="af3-proy-bar" style={{ width: `${pctMes}%` }} />
        <span className="af3-proy-bar-label">{pctMes}% del mes</span>
      </div>

      {/* Media por día de semana */}
      <div className="af3-proy-dias">
        <span className="af3-proy-dias-title">Media por día (últimas 4 sem.)</span>
        <div className="af3-proy-dias-grid">
          {mediaPorDiaSemana.map(d => (
            <div key={d.dia} className="af3-proy-dia">
              <span className="af3-proy-dia-name">{d.dia}</span>
              <span className="af3-proy-dia-val">{money(d.media)}€</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
