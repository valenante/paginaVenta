// src/pages/AprendizajeIAPage.jsx
// Dashboard de aprendizaje del asistente IA en la carta QR.
//
// Contrato (lote FEATURES-VENTA-30SEP, `GET /admin/sugerencias/learning-stats`, wt-sugerencias):
//   · `tasaAceptacion` de cada producto puede venir `null` = menos de 5 recomendaciones (IA-2):
//     se enseña «Sin datos», nunca «null%» ni un 50 % inventado.
//   · `tendencia` es real (±3 puntos respecto al recálculo anterior, IA-1).
//   · `timeline` son SIEMPRE 14 días del restaurante, con ceros en los días sin actividad (IA-6).
// Sin estilos inline: anchos/altos por clases en pasos de 5 (`AprendizajeIAPage.css`).

import React, { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { useLocale } from "../hooks/useLocale";
import {
  FiMessageSquare, FiFileText, FiBarChart2, FiClipboard, FiCheckCircle, FiShoppingCart,
} from "react-icons/fi";
import "./AprendizajeIAPage.css";

const SIN_DATOS_TASA = "Sin datos (menos de 5 veces)";

/** Porcentaje 0-100 redondeado a pasos de 5 → sufijo de clase CSS. */
const paso5 = (pct) => {
  const n = Number(pct);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100, Math.round(n / 5) * 5);
};

function nivelScore(score) {
  if (score >= 75) return "excelente";
  if (score >= 50) return "bueno";
  if (score >= 25) return "regular";
  return "bajo";
}

function textoTasa(tasa) {
  return tasa == null ? SIN_DATOS_TASA : `${Math.round(tasa)}%`;
}

export default function AprendizajeIAPage() {
  const { locale } = useLocale();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/sugerencias/learning-stats");
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const cabecera = (
    <div className="ia-learn__header">
      <h2>Aprendizaje IA</h2>
      <p>El asistente de la carta aprende de cada interacción. Aquí ves cómo evoluciona.</p>
    </div>
  );

  if (loading) return <div className="ia-learn"><div className="ia-learn__loading">Cargando datos de aprendizaje...</div></div>;
  if (error) {
    return (
      <div className="ia-learn">
        {cabecera}
        <div className="ia-learn__error" role="alert">
          <span>{error}</span>
          <button className="ia-learn__retry" onClick={cargar}>Reintentar</button>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const { totales = {}, topProductos = [], bottomProductos = [], distribucion = {}, tendencias = {}, timeline = [] } = data;

  // Estado vacío DE VERDAD: sin actividad y sin productos puntuados no se pintan tablas vacías.
  if (!totales.sesiones && !topProductos.length) {
    return (
      <div className="ia-learn">
        {cabecera}
        <div className="ia-learn__empty" data-testid="ia-learn-vacio">
          <p>El asistente aún no tiene datos de aprendizaje.</p>
          <p>Los datos se acumulan cuando los clientes usan el asistente IA en la carta QR.</p>
        </div>
      </div>
    );
  }

  const maxTimeline = Math.max(...timeline.map(t => t.sesiones || 0), 1);
  const totalDistrib = Object.values(distribucion).reduce((a, b) => a + (b || 0), 0);
  const hayPropuestas = (totales.propuestasGeneradas || 0) > 0;

  return (
    <div className="ia-learn">
      {cabecera}

      {/* KPIs */}
      <div className="ia-learn__kpis">
        <KPI label="Sesiones (30d)" value={totales.sesiones} icon={FiMessageSquare} />
        <KPI label="Mensajes" value={totales.mensajes} icon={FiFileText} />
        <KPI label="Msg/Sesión" value={totales.mensajesPorSesion} icon={FiBarChart2} />
        <KPI label="Propuestas" value={totales.propuestasGeneradas} icon={FiClipboard} />
        <KPI
          label="Aceptación"
          value={hayPropuestas ? `${totales.tasaAceptacion}%` : "Sin propuestas"}
          icon={FiCheckCircle}
          estado={hayPropuestas ? (totales.tasaAceptacion >= 50 ? "ok" : "warn") : undefined}
        />
        <KPI label="Items añadidos" value={totales.itemsAnadidos} icon={FiShoppingCart} />
      </div>

      {/* Timeline: 14 días, ceros incluidos */}
      {timeline.length > 0 && (
        <div className="ia-learn__section">
          <h3>Actividad diaria (últimos 14 días)</h3>
          <div className="ia-learn__chart" data-testid="ia-learn-timeline">
            {timeline.map((t, i) => (
              <div key={i} className="ia-learn__bar-col">
                <div className={`ia-learn__bar ia-learn__alto-${Math.max(paso5(((t.sesiones || 0) / maxTimeline) * 100), 5)}${t.sesiones ? "" : " ia-learn__bar--cero"}`}>
                  <span className="ia-learn__bar-val">{t.sesiones || 0}</span>
                </div>
                <span className="ia-learn__bar-label">
                  {new Date(t.fecha).toLocaleDateString(locale, { day: "numeric", month: "short" })}
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
          <p className="ia-learn__explica" data-testid="ia-learn-explica-score">
            El score (0-100) mide lo bien que funciona recomendar cada plato: pesa sobre todo cuántas veces lo aceptan cuando el asistente lo propone, y también cuánto se recomienda y su margen.
            Con menos de 5 recomendaciones el plato aún no tiene datos propios.
          </p>
          <div className="ia-learn__distrib">
            <DistribBar label="Excelente (75-100)" count={distribucion.excelente} total={totalDistrib} nivel="excelente" />
            <DistribBar label="Bueno (50-74)" count={distribucion.bueno} total={totalDistrib} nivel="bueno" />
            <DistribBar label="Regular (25-49)" count={distribucion.regular} total={totalDistrib} nivel="regular" />
            <DistribBar label="Bajo (0-24)" count={distribucion.bajo} total={totalDistrib} nivel="bajo" />
            <DistribBar label="Sin datos (<5 muestras)" count={distribucion.sinDatos} total={totalDistrib} nivel="sindatos" />
          </div>
        </div>

        <div className="ia-learn__section ia-learn__section--half">
          <h3>Tendencias</h3>
          <p className="ia-learn__explica">Comparado con el cálculo anterior: sube o baja si el score cambia 3 puntos o más.</p>
          <div className="ia-learn__tendencias">
            <div className="ia-learn__tend-item">
              <span className="ia-learn__tend-arrow ia-learn__tend-arrow--up">↑</span>
              <span>{tendencias.subiendo || 0} productos subiendo</span>
            </div>
            <div className="ia-learn__tend-item">
              <span className="ia-learn__tend-arrow ia-learn__tend-arrow--stable">→</span>
              <span>{tendencias.estable || 0} productos estables</span>
            </div>
            <div className="ia-learn__tend-item">
              <span className="ia-learn__tend-arrow ia-learn__tend-arrow--down">↓</span>
              <span>{tendencias.bajando || 0} productos bajando</span>
            </div>
          </div>

          <div className="ia-learn__propuestas-stats">
            <h4>Propuestas de pedido</h4>
            <div className="ia-learn__prop-row">
              <span>Aceptadas</span><strong>{totales.propuestasAceptadas || 0}</strong>
            </div>
            <div className="ia-learn__prop-row">
              <span>Rechazadas</span><strong>{totales.propuestasRechazadas || 0}</strong>
            </div>
            <div className="ia-learn__prop-row">
              <span>Modificadas</span><strong>{totales.propuestasModificadas || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Top productos */}
      {topProductos.length > 0 && (
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
            {topProductos.slice(0, 15).map((p, i) => (
              <div key={i} className="ia-learn__table-row">
                <span className="ia-learn__prod-name">{p.nombre}</span>
                <span className="ia-learn__prod-cat">{p.categoria}</span>
                <ScoreCelda score={p.score} />
                <span className={p.tasaAceptacion == null ? "ia-learn__sin-datos" : ""}>{textoTasa(p.tasaAceptacion)}</span>
                <span>{p.vecesRecomendado || 0}x</span>
                <Tendencia t={p.tendencia} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom productos */}
      {bottomProductos.length > 0 && (
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
                <ScoreCelda score={p.score} />
                <span className={p.tasaAceptacion == null ? "ia-learn__sin-datos" : ""}>{textoTasa(p.tasaAceptacion)}</span>
                <Tendencia t={p.tendencia} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCelda({ score }) {
  const s = Number(score) || 0;
  return (
    <span className="ia-learn__score">
      <span className={`ia-learn__score-bar ia-learn__ancho-${paso5(s)} ia-learn__nivel--${nivelScore(s)}`} />
      <span className="ia-learn__score-val">{Math.round(s)}</span>
    </span>
  );
}

function Tendencia({ t }) {
  const v = t || "estable";
  return (
    <span className={`ia-learn__trend ia-learn__trend--${v}`} aria-label={`Tendencia: ${v}`}>
      {v === "subiendo" ? "↑" : v === "bajando" ? "↓" : "→"}
    </span>
  );
}

function KPI({ label, value, icon: Icon, estado }) {
  return (
    <div className="ia-learn__kpi">
      <span className="ia-learn__kpi-icon">{Icon && <Icon aria-hidden />}</span>
      <span className={`ia-learn__kpi-value${estado ? ` ia-learn__kpi-value--${estado}` : ""}`}>{value ?? 0}</span>
      <span className="ia-learn__kpi-label">{label}</span>
    </div>
  );
}

function DistribBar({ label, count = 0, total, nivel }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="ia-learn__distrib-row">
      <span className="ia-learn__distrib-label">{label}</span>
      <div className="ia-learn__distrib-bar-bg">
        <div className={`ia-learn__distrib-bar-fill ia-learn__ancho-${paso5(pct)} ia-learn__nivel--${nivel}`} />
      </div>
      <span className="ia-learn__distrib-count">{count}</span>
    </div>
  );
}
