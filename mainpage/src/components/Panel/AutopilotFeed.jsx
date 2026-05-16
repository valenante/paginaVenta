import React from "react";
import { useAutopilot } from "../../hooks/useAutopilot";
import { useNavigate } from "react-router-dom";
import "./AutopilotFeed.css";

const SEV_CLASSES = {
  critica: "ap-card--critica",
  alta: "ap-card--alta",
  media: "ap-card--media",
  info: "ap-card--info",
  positiva: "ap-card--positiva",
};

function InsightCard({ insight, onCopilot }) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (!insight.accion) return;
    if (insight.accion.tipo === "link" && insight.accion.payload?.ruta) {
      navigate(insight.accion.payload.ruta);
    } else if (insight.accion.tipo === "copilot" && onCopilot) {
      onCopilot(insight.accion.payload?.query || "");
    }
  };

  return (
    <div className={`ap-card ${SEV_CLASSES[insight.severidad] || ""}`}>
      <div className="ap-card__icon">{insight.icono}</div>
      <div className="ap-card__body">
        <div className="ap-card__titulo">{insight.titulo}</div>
        <div className="ap-card__mensaje">{insight.mensaje}</div>
      </div>
      {insight.accion && (
        <button className="ap-card__action" onClick={handleAction}>
          {insight.accion.label}
        </button>
      )}
    </div>
  );
}

export default function AutopilotFeed({ onCopilotQuery }) {
  const { data, loading } = useAutopilot();

  if (loading) return null; // No mostrar skeleton, aparece cuando está listo
  if (!data?.insights?.length && !data?.greeting) return null;

  const ahora = data.insights.filter((i) => i.tipo === "ahora");
  const acciones = data.insights.filter((i) => i.tipo === "accion");
  const semana = data.insights.filter((i) => i.tipo === "semana");
  const positivo = data.insights.filter((i) => i.tipo === "positivo");

  return (
    <section className="ap-feed">
      <div className="ap-feed__header">
        <div className="ap-feed__greeting">{data.greeting}</div>
        <span className="ap-feed__badge">Autopilot</span>
      </div>

      <div className="ap-feed__grid">
        {ahora.length > 0 && (
          <div className="ap-group">
            <div className="ap-group__label">Ahora</div>
            {ahora.map((i) => <InsightCard key={i.id} insight={i} onCopilot={onCopilotQuery} />)}
          </div>
        )}

        {acciones.length > 0 && (
          <div className="ap-group">
            <div className="ap-group__label">Acciones recomendadas</div>
            {acciones.map((i) => <InsightCard key={i.id} insight={i} onCopilot={onCopilotQuery} />)}
          </div>
        )}

        {semana.length > 0 && (
          <div className="ap-group">
            <div className="ap-group__label">Esta semana</div>
            {semana.map((i) => <InsightCard key={i.id} insight={i} onCopilot={onCopilotQuery} />)}
          </div>
        )}

        {positivo.length > 0 && (
          <div className="ap-group">
            {positivo.map((i) => <InsightCard key={i.id} insight={i} onCopilot={onCopilotQuery} />)}
          </div>
        )}
      </div>
    </section>
  );
}
