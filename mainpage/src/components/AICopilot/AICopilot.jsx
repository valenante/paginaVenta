import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useFeaturesPlan } from "../../context/FeaturesPlanContext";
import useCopilot from "../../hooks/useCopilot";
import CopilotButton from "./CopilotButton";
import CopilotMini from "./CopilotMini";
import CopilotFullscreen from "./CopilotFullscreen";
import "./AICopilot.css";

export default function AICopilot() {
  const { user } = useAuth();
  const { hasFeature } = useFeaturesPlan();
  const [view, setView] = useState("closed");

  const {
    messages, conversationId, loading,
    conversations, convsLoading,
    insights, insightsLoading, toolStatus,
    sendMessage, loadInsights, loadConversations, loadConversation,
    newConversation, deleteConversation,
  } = useCopilot();

  const handleSuggestionClick = useCallback((text) => {
    sendMessage(text);
  }, [sendMessage]);

  const open = useCallback(() => setView("mini"), []);
  const openFull = useCallback(() => setView("fullscreen"), []);
  const close = useCallback(() => setView("closed"), []);

  // Load insights when opening chat for the first time
  const insightsLoaded = React.useRef(false);
  useEffect(() => {
    if (view !== "closed" && !insightsLoaded.current) {
      insightsLoaded.current = true;
      loadInsights();
    }
  }, [view, loadInsights]);

  // Gate AFTER all hooks
  // En dev: mostrar siempre. En prod: descomentar los gates.
  // if (!user) return null;
  // if (!hasFeature("copilot_chat", true)) return null;

  if (view === "closed") {
    return <CopilotButton onClick={open} onLongPress={openFull} />;
  }

  if (view === "mini") {
    return (
      <CopilotMini
        messages={messages}
        loading={loading}
        toolStatus={toolStatus}
        insights={insights}
        insightsLoading={insightsLoading}
        onSend={sendMessage}
        onClose={close}
        onFullscreen={openFull}
        onSuggestionClick={handleSuggestionClick}
      />
    );
  }

  return (
    <CopilotFullscreen
      messages={messages}
      loading={loading}
      insights={insights}
      insightsLoading={insightsLoading}
      conversations={conversations}
      convsLoading={convsLoading}
      conversationId={conversationId}
      onSend={sendMessage}
      onClose={close}
      onLoadConversations={loadConversations}
      onLoadConversation={loadConversation}
      onNewConversation={newConversation}
      onDeleteConversation={deleteConversation}
      onSuggestionClick={handleSuggestionClick}
    />
  );
}
