// src/pages/AprendizajeIAPage.jsx
// Dashboard de aprendizaje del asistente IA en la carta QR.

import React, { useState, useEffect } from "react";
import api from "../utils/api";
import "./AprendizajeIAPage.css";

export default function AprendizajeIAPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/sugerencias/learning-stats");
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="ia-learn"><div className="ia-learn__loading">Cargando datos de aprendizaje...</div></div>;
  if (error) return <div className="ia-learn"><div className="ia-learn__error">{error}</div></div>;
  if (!data) return null;

  const { totales, topProductos, bottomProductos, distribucion, tendencias, timeline } = data;

  const maxTimeline = Math.max(...(timeline || []).map(t => t.sesiones || 0), 1);

  return (
    <div className="ia-learn">
      <div className="ia-learn__header">
        <h2>Aprendizaje IA</h2>
        <p>El asistente de la carta aprende de cada interacción. Aquí ves cómo evoluciona.</p>
      </div>

      {/* KPIs */}
      <div className="ia-learn__kpis">
        <KPI label="Sesiones (30d)" value={totales.sesiones} icon="💬" />
        <KPI label="Mensajes" value={totales.mensajes} icon="📝" />
        <KPI label="Msg/Sesión" value={totales.mensajesPorSesion} icon="📊" />
        <KPI label="Propuestas" value={totales.propuestasGeneradas} icon="📋" />
        <KPI label="Aceptación" value={`${totales.tasaAceptacion}%`} icon="✅" color={totales.tasaAceptacion >= 50 ? "#22c55e" : "#f59e0b"} />
        <KPI label="Items añadidos" value={totales.itemsAnadidos} icon="🛒" />
      </div>

      {/* Timeline */}
      {timeline?.length > 0 && (
        <div className="ia-learn__section">
          <h3>Actividad diaria (últimos 14 días)</h3>
          <div className="ia-learn__chart">
            {timeline.map((t, i) => (
              <div key={i} className="ia-learn__bar-col">
                <div className="ia-learn__bar" style={{ height: `${Math.max((t.sesiones / maxTimeline) * 100, 4)}%` }}>
                  <span className="ia-learn__bar-val">{t.sesiones}</span>
                </div>
                <span className="ia-learn__bar-label">
                  {new Date(t.fecha).toLocaleDateString("es", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distribución de scores + Tendencias */}
      <div className="ia-learn__row">
        <div className="ia-learn__section ia-learn__section--half">
          <h3>Distribución de scores</h3>
          <div className="ia-learn__distrib">
            <DistribBar label="Excelente (75-100)" count={distribucion.excelente} total={Object.values(distribucion).reduce((a, b) => a + b, 0)} color="#22c55e" />
            <DistribBar label="Bueno (50-74)" count={distribucion.bueno} total={Object.values(distribucion).reduce((a, b) => a + b, 0)} color="#3b82f6" />
            <DistribBar label="Regular (25-49)" count={distribucion.regular} total={Object.values(distribucion).reduce((a, b) => a + b, 0)} color="#f59e0b" />
            <DistribBar label="Bajo (0-24)" count={distribucion.bajo} total={Object.values(distribucion).reduce((a, b) => a + b, 0)} color="#ef4444" />
            <DistribBar label="Sin datos (<5 muestras)" count={distribucion.sinDatos} total={Object.values(distribucion).reduce((a, b) => a + b, 0)} color="#6b7280" />
          </div>
        </div>

        <div className="ia-learn__section ia-learn__section--half">
          <h3>Tendencias</h3>
          <div className="ia-learn__tendencias">
            <div className="ia-learn__tend-item">
              <span className="ia-learn__tend-arrow ia-learn__tend-arrow--up">↑</span>
              <span>{tendencias.subiendo} productos subiendo</span>
            </div>
            <div className="ia-learn__tend-item">
              <span className="ia-learn__tend-arrow ia-learn__tend-arrow--stable">→</span>
              <span>{tendencias.estable} productos estables</span>
            </div>
            <div className="ia-learn__tend-item">
              <span className="ia-learn__tend-arrow ia-learn__tend-arrow--down">↓</span>
              <span>{tendencias.bajando} productos bajando</span>
            </div>
          </div>

          <div className="ia-learn__propuestas-stats" style={{ marginTop: "16px" }}>
            <h4>Propuestas de pedido</h4>
            <div className="ia-learn__prop-row">
              <span>Aceptadas</span><strong>{totales.propuestasAceptadas}</strong>
            </div>
            <div className="ia-learn__prop-row">
              <span>Rechazadas</span><strong>{totales.propuestasRechazadas}</strong>
            </div>
            <div className="ia-learn__prop-row">
              <span>Modificadas</span><strong>{totales.propuestasModificadas}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Top productos */}
      <div className="ia-learn__section">
        <h3>Top productos (mayor score IA)</h3>
        <div className="ia-learn__table">
          <div className="ia-learn__table-head">
            <span>Producto</span>
            <span>Categoría</span>
            <span>Score</span>
            <span>Aceptación</span>
            <span>Recomendado</span>
            <span>Tendencia</span>
          </div>
          {(topProductos || []).slice(0, 15).map((p, i) => (
            <div key={i} className="ia-learn__table-row">
              <span className="ia-learn__prod-name">{p.nombre}</span>
              <span className="ia-learn__prod-cat">{p.categoria}</span>
              <span className="ia-learn__score">
                <span className="ia-learn__score-bar" style={{ width: `${p.score}%`, background: scoreColor(p.score) }} />
                <span className="ia-learn__score-val">{Math.round(p.score)}</span>
              </span>
              <span>{Math.round(p.tasaAceptacion || 0)}%</span>
              <span>{p.vecesRecomendado || 0}x</span>
              <span className={`ia-learn__trend ia-learn__trend--${p.tendencia || "estable"}`}>
                {p.tendencia === "subiendo" ? "↑" : p.tendencia === "bajando" ? "↓" : "→"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom productos */}
      {bottomProductos?.length > 0 && (
        <div className="ia-learn__section">
          <h3>Productos que necesitan atención (score bajo)</h3>
          <div className="ia-learn__table">
            <div className="ia-learn__table-head">
              <span>Producto</span>
              <span>Categoría</span>
              <span>Score</span>
              <span>Aceptación</span>
              <span>Tendencia</span>
            </div>
            {bottomProductos.map((p, i) => (
              <div key={i} className="ia-learn__table-row ia-learn__table-row--warn">
                <span className="ia-learn__prod-name">{p.nombre}</span>
                <span className="ia-learn__prod-cat">{p.categoria}</span>
                <span className="ia-learn__score">
                  <span className="ia-learn__score-bar" style={{ width: `${p.score}%`, background: scoreColor(p.score) }} />
                  <span className="ia-learn__score-val">{Math.round(p.score)}</span>
                </span>
                <span>{Math.round(p.tasaAceptacion || 0)}%</span>
                <span className={`ia-learn__trend ia-learn__trend--${p.tendencia || "estable"}`}>
                  {p.tendencia === "subiendo" ? "↑" : p.tendencia === "bajando" ? "↓" : "→"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totales.sesiones === 0 && (
        <div className="ia-learn__empty">
          <p>El asistente aún no tiene datos de aprendizaje. Los datos se acumulan cuando los clientes usan el asistente IA en la carta QR.</p>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, icon, color }) {
  return (
    <div className="ia-learn__kpi">
      <span className="ia-learn__kpi-icon">{icon}</span>
      <span className="ia-learn__kpi-value" style={color ? { color } : undefined}>{value}</span>
      <span className="ia-learn__kpi-label">{label}</span>
    </div>
  );
}

function DistribBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="ia-learn__distrib-row">
      <span className="ia-learn__distrib-label">{label}</span>
      <div className="ia-learn__distrib-bar-bg">
        <div className="ia-learn__distrib-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="ia-learn__distrib-count">{count}</span>
    </div>
  );
}

function scoreColor(score) {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#3b82f6";
  if (score >= 25) return "#f59e0b";
  return "#ef4444";
}
