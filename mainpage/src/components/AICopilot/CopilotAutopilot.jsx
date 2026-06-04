import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoAlef from "../../assets/imagenes/alef.webp";

function timeAgo(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

const SEV_CLASS = {
  critica: "copilot-ap-card--critica",
  alta: "copilot-ap-card--alta",
  media: "copilot-ap-card--media",
  info: "copilot-ap-card--info",
  positiva: "copilot-ap-card--positiva",
};

function PendingCard({ action, onApprove, onReject }) {
  const [acting, setActing] = useState(null);

  const handle = async (fn, label) => {
    setActing(label);
    try { await fn(action._id); }
    catch { setActing(null); }
  };

  return (
    <div className={`copilot-ap-card ${SEV_CLASS[action.severidad] || ""}`}>
      <span className="copilot-ap-card__icon">{action.icono}</span>
      <div className="copilot-ap-card__body">
        <div className="copilot-ap-card__titulo">{action.titulo}</div>
        {action.descripcion && <div className="copilot-ap-card__msg">{action.descripcion}</div>}
      </div>
      <div className="copilot-ap-card__buttons">
        <button
          className="copilot-ap-card__btn copilot-ap-card__btn--approve"
          onClick={() => handle(onApprove, "approve")}
          disabled={!!acting}
        >
          {acting === "approve" ? "..." : "Aprobar"}
        </button>
        <button
          className="copilot-ap-card__btn copilot-ap-card__btn--reject"
          onClick={() => handle(onReject, "reject")}
          disabled={!!acting}
        >
          {acting === "reject" ? "..." : "No"}
        </button>
      </div>
    </div>
  );
}

function DoneCard({ action, onRevert }) {
  const [reverting, setReverting] = useState(false);

  const handleRevert = async () => {
    setReverting(true);
    try { await onRevert(action._id); }
    catch { setReverting(false); }
  };

  return (
    <div className={`copilot-ap-card copilot-ap-card--done ${SEV_CLASS[action.severidad] || ""}`}>
      <span className="copilot-ap-card__icon">{action.icono}</span>
      <div className="copilot-ap-card__body">
        <div className="copilot-ap-card__titulo">{action.titulo}</div>
        <div className="copilot-ap-card__time">{timeAgo(action.createdAt)}</div>
      </div>
      {action.reversible && action.estado === "ejecutada" && (
        <button
          className="copilot-ap-card__btn copilot-ap-card__btn--undo"
          onClick={handleRevert}
          disabled={reverting}
          title="Deshacer"
        >
          {reverting ? "..." : "Deshacer"}
        </button>
      )}
      {action.estado === "aprobada" && (
        <span className="copilot-ap-card__badge-ok">OK</span>
      )}
      {action.estado === "revertida" && (
        <span className="copilot-ap-card__badge-rev">Revertido</span>
      )}
    </div>
  );
}

export default function CopilotAutopilot({ actions, loading, onClose, onOpenChat, onApprove, onReject, onRevert }) {
  const pendientes = actions?.pendientes || [];
  const ejecutadas = actions?.ejecutadas || [];

  return (
    <div className="copilot-ap">
      {/* Header */}
      <div className="copilot-ap__header">
        <div className="copilot-ap__title-row">
          <img src={logoAlef} alt="" className="copilot-ap__logo" />
          <span className="copilot-ap__title">ALEF Autopilot</span>
        </div>
        <button className="copilot-ap__close" onClick={onClose} aria-label="Cerrar">✕</button>
      </div>

      {/* Content */}
      <div className="copilot-ap__body">
        {loading && !pendientes.length && !ejecutadas.length && (
          <div className="copilot-ap__loading">
            <div className="copilot-ap__loading-dots"><span /><span /><span /></div>
            <span>Cargando...</span>
          </div>
        )}

        {!loading && !pendientes.length && !ejecutadas.length && (
          <div className="copilot-ap__empty">
            <span className="copilot-ap__empty-icon">✓</span>
            <span>Todo en orden. Sin acciones pendientes.</span>
          </div>
        )}

        {/* Pendientes */}
        {pendientes.length > 0 && (
          <div className="copilot-ap__section">
            <div className="copilot-ap__section-label copilot-ap__section-label--pending">
              Necesita tu OK ({pendientes.length})
            </div>
            {pendientes.map((a) => (
              <PendingCard key={a._id} action={a} onApprove={onApprove} onReject={onReject} />
            ))}
          </div>
        )}

        {/* Ejecutadas */}
        {ejecutadas.length > 0 && (
          <div className="copilot-ap__section">
            <div className="copilot-ap__section-label copilot-ap__section-label--done">
              Hecho por ALEF
            </div>
            {ejecutadas.map((a) => (
              <DoneCard key={a._id} action={a} onRevert={onRevert} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="copilot-ap__footer">
        <button className="copilot-ap__chat-btn" onClick={onOpenChat}>
          <span>Preguntame lo que quieras</span>
          <span className="copilot-ap__chat-arrow">→</span>
        </button>
      </div>
    </div>
  );
}
