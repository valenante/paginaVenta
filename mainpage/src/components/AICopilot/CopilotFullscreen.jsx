import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import logoAlef from "../../assets/imagenes/alef.png";
import CopilotMessages from "./CopilotMessages";
import CopilotInput from "./CopilotInput";

function ConversationItem({ conv, isActive, onSelect, onDelete }) {
  const date = conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "";
  return (
    <div className={`copilot-fs__conv ${isActive ? "is-active" : ""}`} onClick={() => onSelect(conv.conversationId)}>
      <div className="copilot-fs__conv-title">{conv.title || "Sin título"}</div>
      <div className="copilot-fs__conv-date">{date}</div>
      <button
        className="copilot-fs__conv-delete"
        onClick={(e) => { e.stopPropagation(); onDelete(conv.conversationId); }}
        aria-label="Eliminar conversación"
      >✕</button>
    </div>
  );
}

export default function CopilotFullscreen({
  messages, loading, insights, insightsLoading, conversations, convsLoading, conversationId,
  onSend, onClose, onLoadConversations, onLoadConversation, onNewConversation, onDeleteConversation, onSuggestionClick,
}) {
  useEffect(() => {
    onLoadConversations();
  }, [onLoadConversations]);

  // Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const content = (
    <div className="copilot-fs__overlay">
      <div className="copilot-fs">
        {/* Sidebar */}
        <div className="copilot-fs__sidebar">
          <div className="copilot-fs__sidebar-header">
            <span className="copilot-fs__sidebar-title">Conversaciones</span>
            <button className="copilot-fs__new-btn" onClick={onNewConversation}>+ Nueva</button>
          </div>
          <div className="copilot-fs__sidebar-list">
            {convsLoading && <div className="copilot-fs__sidebar-loading">Cargando...</div>}
            {!convsLoading && conversations.length === 0 && (
              <div className="copilot-fs__sidebar-empty">Sin conversaciones previas</div>
            )}
            {conversations.map((c) => (
              <ConversationItem
                key={c.conversationId}
                conv={c}
                isActive={c.conversationId === conversationId}
                onSelect={onLoadConversation}
                onDelete={onDeleteConversation}
              />
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="copilot-fs__main">
          <div className="copilot-fs__header">
            <div className="copilot-fs__title">
              <img src={logoAlef} alt="ALEF" className="copilot-header__logo" />
              ALEF Copilot
            </div>
            <button className="copilot-fs__close" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>
          <CopilotMessages messages={messages} loading={loading} insights={insights} insightsLoading={insightsLoading} onSuggestionClick={onSuggestionClick} />
          <CopilotInput onSend={onSend} loading={loading} fullscreen />
        </div>
      </div>
    </div>
  );

  const portal = document.getElementById("modal-root") || document.body;
  return createPortal(content, portal);
}
