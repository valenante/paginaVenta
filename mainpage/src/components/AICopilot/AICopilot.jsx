import React, { useState, useCallback } from "react";
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
  const [view, setView] = useState("closed"); // closed | mini | fullscreen

  const {
    messages, conversationId, loading,
    conversations, convsLoading,
    sendMessage, loadConversations, loadConversation,
    newConversation, deleteConversation,
  } = useCopilot();

  // Gate: only for logged-in admins with feature
  if (!user) return null;
  if (!hasFeature("copilot_chat", false)) return null;

  const handleSuggestionClick = useCallback((text) => {
    sendMessage(text);
  }, [sendMessage]);

  if (view === "closed") {
    return (
      <CopilotButton
        onClick={() => setView("mini")}
        onLongPress={() => setView("fullscreen")}
      />
    );
  }

  if (view === "mini") {
    return (
      <>
        <CopilotMini
          messages={messages}
          loading={loading}
          onSend={sendMessage}
          onClose={() => setView("closed")}
          onFullscreen={() => setView("fullscreen")}
          onSuggestionClick={handleSuggestionClick}
        />
      </>
    );
  }

  // fullscreen
  return (
    <CopilotFullscreen
      messages={messages}
      loading={loading}
      conversations={conversations}
      convsLoading={convsLoading}
      conversationId={conversationId}
      onSend={sendMessage}
      onClose={() => setView("closed")}
      onLoadConversations={loadConversations}
      onLoadConversation={loadConversation}
      onNewConversation={newConversation}
      onDeleteConversation={deleteConversation}
      onSuggestionClick={handleSuggestionClick}
    />
  );
}
