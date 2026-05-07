import React from "react";
import logoAlef from "../../assets/imagenes/alef.png";
import CopilotMessages from "./CopilotMessages";
import CopilotInput from "./CopilotInput";

export default function CopilotMini({ messages, loading, toolStatus, insights, insightsLoading, onSend, onRetry, onClose, onFullscreen, onSuggestionClick }) {
  return (
    <div className="copilot-mini">
      <div className="copilot-mini__header">
        <div className="copilot-mini__title">
          <img src={logoAlef} alt="ALEF" className="copilot-header__logo" />
          ALEF Copilot
        </div>
        <div className="copilot-mini__actions">
          <button className="copilot-mini__action" onClick={onFullscreen} title="Pantalla completa" aria-label="Pantalla completa">⛶</button>
          <button className="copilot-mini__action" onClick={onClose} title="Minimizar" aria-label="Minimizar">✕</button>
        </div>
      </div>
      <CopilotMessages messages={messages} loading={loading} toolStatus={toolStatus} insights={insights} insightsLoading={insightsLoading} onSuggestionClick={onSuggestionClick} onRetry={onRetry} />
      <CopilotInput onSend={onSend} loading={loading} />
    </div>
  );
}
