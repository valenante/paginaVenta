import React, { useRef, useEffect } from "react";

function formatMarkdown(text) {
  if (!text) return "";
  return text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="copilot-code">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<div class="copilot-h3">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="copilot-h2">$1</div>')
    // List items
    .replace(/^[-•] (.+)$/gm, '<div class="copilot-li">· $1</div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="copilot-li">$&</div>')
    // Line breaks
    .replace(/\n/g, "<br/>");
}

function TypingIndicator() {
  return (
    <div className="copilot-msg copilot-msg--assistant">
      <div className="copilot-msg__bubble copilot-msg__bubble--assistant">
        <div className="copilot-typing">
          <span className="copilot-typing__dot" />
          <span className="copilot-typing__dot" />
          <span className="copilot-typing__dot" />
        </div>
      </div>
    </div>
  );
}

function WelcomeMessage() {
  return (
    <div className="copilot-welcome">
      <div className="copilot-welcome__icon">✨</div>
      <div className="copilot-welcome__title">ALEF Copilot</div>
      <div className="copilot-welcome__text">
        Soy tu asistente de negocio. Puedo analizar tus ventas, márgenes, stock, y mucho más. ¿En qué puedo ayudarte?
      </div>
      <div className="copilot-welcome__suggestions">
        <span className="copilot-welcome__chip">¿Cómo van las ventas hoy?</span>
        <span className="copilot-welcome__chip">¿Cuál es mi plato más rentable?</span>
        <span className="copilot-welcome__chip">¿Qué productos se piden juntos?</span>
      </div>
    </div>
  );
}

export default function CopilotMessages({ messages, loading, onSuggestionClick }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!messages.length && !loading) {
    return (
      <div className="copilot-messages copilot-messages--empty">
        <WelcomeMessage />
        {onSuggestionClick && (
          <div className="copilot-welcome__suggestions" onClick={(e) => {
            const chip = e.target.closest(".copilot-welcome__chip");
            if (chip) onSuggestionClick(chip.textContent);
          }} />
        )}
      </div>
    );
  }

  return (
    <div className="copilot-messages">
      {messages.map((msg, i) => (
        <div key={i} className={`copilot-msg copilot-msg--${msg.role}`}>
          <div className={`copilot-msg__bubble copilot-msg__bubble--${msg.role}`}
            dangerouslySetInnerHTML={
              msg.role === "assistant"
                ? { __html: formatMarkdown(msg.content) }
                : undefined
            }
          >
            {msg.role === "user" ? msg.content : undefined}
          </div>
        </div>
      ))}
      {loading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
