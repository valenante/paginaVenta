import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useFeaturesPlan } from "../../context/FeaturesPlanContext";
import useCopilot from "../../hooks/useCopilot";
import { useAutopilot } from "../../Hooks/useAutopilot";
import CopilotButton from "./CopilotButton";
import CopilotAutopilot from "./CopilotAutopilot";
import CopilotMini from "./CopilotMini";
import CopilotFullscreen from "./CopilotFullscreen";
import "./AICopilot.css";

export default function AICopilot() {
  const { user } = useAuth();
  const { hasFeature } = useFeaturesPlan();
  // closed → autopilot → mini → fullscreen
  const [view, setView] = useState("closed");

  const {
    messages, conversationId, loading,
    conversations, convsLoading,
    insights, insightsLoading, toolStatus,
    sendMessage, retryLast, submitFeedback, loadInsights, loadConversations, loadConversation,
    newConversation, deleteConversation,
  } = useCopilot();

  const { actions, badge, loading: apLoading, approve, reject, revert } = useAutopilot();

  const handleSuggestionClick = useCallback((text) => {
    sendMessage(text);
  }, [sendMessage]);

  const openAutopilot = useCallback(() => setView("autopilot"), []);
  const openMini = useCallback(() => setView("mini"), []);
  const openFull = useCallback(() => setView("fullscreen"), []);
  const close = useCallback(() => setView("closed"), []);

  // Load copilot insights when opening chat views
  const insightsLoaded = React.useRef(false);
  useEffect(() => {
    if ((view === "mini" || view === "fullscreen") && !insightsLoaded.current) {
      insightsLoaded.current = true;
      loadInsights();
    }
  }, [view, loadInsights]);

  // Gate AFTER all hooks
  // if (!user) return null;
  // if (!hasFeature("copilot_chat", true)) return null;

  if (view === "closed") {
    return (
      <CopilotButton
        onClick={openAutopilot}
        onLongPress={openFull}
        severity={badge.severity}
        insightCount={badge.count}
      />
    );
  }

  if (view === "autopilot") {
    return (
      <>
        <CopilotButton
          onClick={close}
          onLongPress={openFull}
          severity={badge.severity}
          insightCount={0}
        />
        <CopilotAutopilot
          actions={actions}
          loading={apLoading}
          onClose={close}
          onOpenChat={openMini}
          onApprove={approve}
          onReject={reject}
          onRevert={revert}
        />
      </>
    );
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
        onRetry={retryLast}
        onFeedback={submitFeedback}
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
      onRetry={retryLast}
      onFeedback={submitFeedback}
      onClose={close}
      onLoadConversations={loadConversations}
      onLoadConversation={loadConversation}
      onNewConversation={newConversation}
      onDeleteConversation={deleteConversation}
      onSuggestionClick={handleSuggestionClick}
    />
  );
}
