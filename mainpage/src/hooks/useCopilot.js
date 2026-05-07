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

  const [toolStatus, setToolStatus] = useState(null); // "Consultando ventas..."

  const sendMessage = useCallback(async (text, imageData) => {
    if ((!text?.trim() && !imageData) || loading) return;

    const displayText = imageData ? `📎 ${imageData.name}${text ? ` — ${text}` : ""}` : text;
    const userMsg = { role: "user", content: displayText, ts: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setToolStatus(null);

    // Add empty assistant message that we'll fill via streaming
    const assistantIdx = { current: -1 };

    try {
      const baseUrl = api.defaults.baseURL || "";
      const headers = { "Content-Type": "application/json" };
      // Get CSRF token from cookie if exists
      const csrfCookie = document.cookie.split(";").find((c) => c.trim().startsWith("alef_csrf=") || c.trim().startsWith("__Secure-alef_csrf="));
      if (csrfCookie) headers["x-csrf-token"] = csrfCookie.split("=").slice(1).join("=").trim();
      // Get tenant
      const tenantId = sessionStorage.getItem("tenantId") || "";
      if (tenantId) headers["X-Tenant-ID"] = tenantId;

      const resp = await fetch(`${baseUrl}/copilot/chat/stream`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          message: (text || "").trim(),
          ...(conversationId ? { conversationId } : {}),
          ...(imageData ? { imageBase64: imageData.base64, imageMimeType: imageData.mimeType } : {}),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.event === "start") {
              if (data.conversationId) setConversationId(data.conversationId);
              setMessages((prev) => [...prev, { role: "assistant", content: "", ts: new Date().toISOString() }]);
              assistantIdx.current = -1; // will be last
            }

            if (data.event === "tool_call") {
              const names = { get_resumen_dia: "resumen del día", get_rentabilidad: "rentabilidad", get_productos: "productos", get_costes: "costes", get_finanzas: "finanzas", get_ventas_hora: "ventas por hora", get_plato_estrella: "platos estrella", get_comparativa: "comparativa" };
              setToolStatus(`🔍 Consultando ${names[data.name] || data.name}...`);
            }

            if (data.event === "tools_executing") {
              setToolStatus(`⚙️ Analizando datos...`);
            }

            if (data.event === "text_delta") {
              streamedText += data.text;
              setMessages((prev) => {
                const copy = [...prev];
                if (copy.length > 0) copy[copy.length - 1] = { ...copy[copy.length - 1], content: streamedText };
                return copy;
              });
              setToolStatus(null);
            }

            if (data.event === "done") {
              // Final
            }
          } catch { /* ignore parse errors */ }
        }
      }

      if (!streamedText) {
        // Fallback: no text streamed, show error
        setMessages((prev) => {
          const copy = [...prev];
          if (copy.length > 0 && !copy[copy.length - 1].content) {
            copy[copy.length - 1] = { ...copy[copy.length - 1], content: "No se recibió respuesta." };
          }
          return copy;
        });
      }
    } catch (err) {
      const msg = err.message || "Error de conexión";
      setMessages((prev) => [
        ...prev.filter((m) => m.content !== ""), // remove empty assistant placeholder if no stream
        { role: "assistant", content: `Error: ${msg}`, ts: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
      setToolStatus(null);
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
    toolStatus,
    sendMessage,
    loadInsights,
    loadConversations,
    loadConversation,
    newConversation,
    deleteConversation,
  };
}
