import { useState, useCallback, useRef, useEffect } from "react";
import api from "../utils/api";

const STORAGE_KEY = "alef_copilot_convId";

export default function useCopilot() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) || null
  );
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const abortRef = useRef(null);

  // Persist conversationId
  useEffect(() => {
    if (conversationId) sessionStorage.setItem(STORAGE_KEY, conversationId);
    else sessionStorage.removeItem(STORAGE_KEY);
  }, [conversationId]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text, ts: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await api.post("/copilot/chat", {
        message: text.trim(),
        ...(conversationId ? { conversationId } : {}),
      });

      if (data.ok !== false) {
        const payload = data.data || data;
        const assistantMsg = {
          role: "assistant",
          content: payload.response,
          ts: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (payload.conversationId) setConversationId(payload.conversationId);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.message || "Error desconocido"}`, ts: new Date().toISOString() },
        ]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error de conexión";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${msg}`, ts: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, loading]);

  const loadConversations = useCallback(async () => {
    setConvsLoading(true);
    try {
      const { data } = await api.get("/copilot/conversations");
      const payload = data.data || data;
      setConversations(payload.items || []);
    } catch {
      setConversations([]);
    } finally {
      setConvsLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/copilot/conversations/${id}`);
      const payload = data.data || data;
      setConversationId(payload.conversationId);
      setMessages(
        (payload.messages || []).map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
          ts: m.ts,
        }))
      );
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const { data } = await api.get("/copilot/insights");
      const payload = data.data || data;
      setInsights(payload.insights || []);
    } catch {
      setInsights([]);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const deleteConversation = useCallback(async (id) => {
    try {
      await api.delete(`/copilot/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.conversationId !== id));
      if (conversationId === id) newConversation();
    } catch {
      // silently fail
    }
  }, [conversationId, newConversation]);

  return {
    messages,
    conversationId,
    loading,
    conversations,
    convsLoading,
    insights,
    insightsLoading,
    sendMessage,
    loadInsights,
    loadConversations,
    loadConversation,
    newConversation,
    deleteConversation,
  };
}
