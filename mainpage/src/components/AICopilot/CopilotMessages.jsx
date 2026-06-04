import React, { useRef, useEffect } from "react";
import logoAlef from "../../assets/imagenes/alef.webp";

function formatMarkdown(text) {
  if (!text) return "";

  // Parse markdown tables
  const lines = text.split("\n");
  const result = [];
  let i = 0;

  while (i < lines.length) {
    // Detect table: line with |, followed by separator |---|, followed by more | lines
    if (lines[i].includes("|") && lines[i + 1] && /^\|?[\s-:|]+\|/.test(lines[i + 1])) {
      const headerCells = lines[i].split("|").map((c) => c.trim()).filter(Boolean);
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(lines[i].split("|").map((c) => c.trim()).filter(Boolean));
        i++;
      }
      let table = '<div class="copilot-table-wrap"><table class="copilot-table"><thead><tr>';
      headerCells.forEach((h) => { table += `<th>${inlineFormat(h)}</th>`; });
      table += "</tr></thead><tbody>";
      rows.forEach((row) => {
        table += "<tr>";
        row.forEach((cell) => { table += `<td>${inlineFormat(cell)}</td>`; });
        table += "</tr>";
      });
      table += "</tbody></table></div>";
      result.push(table);
      continue;
    }

    result.push(formatLine(lines[i]));
    i++;
  }

  return result.join("<br/>");
}

function inlineFormat(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="copilot-code">$1</code>');
}

function formatLine(line) {
  let out = inlineFormat(line);
  if (/^### (.+)$/.test(out)) return out.replace(/^### (.+)$/, '<div class="copilot-h3">$1</div>');
  if (/^## (.+)$/.test(out)) return out.replace(/^## (.+)$/, '<div class="copilot-h2">$1</div>');
  if (/^[-•] (.+)$/.test(out)) return out.replace(/^[-•] (.+)$/, '<div class="copilot-li">· $1</div>');
  if (/^\d+\. (.+)$/.test(out)) return `<div class="copilot-li">${out}</div>`;
  return out;
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

function InsightCard({ insight, onClick }) {
  const severityClass = {
    critica: "copilot-insight--critica",
    alta: "copilot-insight--alta",
    media: "copilot-insight--media",
    positiva: "copilot-insight--positiva",
  }[insight.severidad] || "";

  return (
    <button className={`copilot-insight ${severityClass}`} onClick={() => onClick(insight.action || insight.titulo)}>
      <span className="copilot-insight__icon">{insight.icono}</span>
      <div className="copilot-insight__body">
        <div className="copilot-insight__title">{insight.titulo}</div>
        <div className="copilot-insight__msg">{insight.mensaje}</div>
      </div>
      <span className="copilot-insight__arrow">→</span>
    </button>
  );
}

function WelcomeMessage({ insights, insightsLoading, onInsightClick, onSuggestionClick }) {
  return (
    <div className="copilot-welcome">
      <img src={logoAlef} alt="ALEF" className="copilot-welcome__logo-img" />
      <div className="copilot-welcome__title">ALEF Copilot</div>

      {insightsLoading && (
        <div className="copilot-welcome__text">Analizando tu restaurante...</div>
      )}

      {!insightsLoading && insights.length > 0 && (
        <div className="copilot-insights">
          <div className="copilot-insights__label">Cosas que deberías saber:</div>
          {insights.map((ins, i) => (
            <InsightCard key={i} insight={ins} onClick={onInsightClick} />
          ))}
        </div>
      )}

      {!insightsLoading && insights.length === 0 && (
        <div className="copilot-welcome__text">
          Todo en orden. ¿En qué puedo ayudarte?
        </div>
      )}

      <div className="copilot-welcome__suggestions">
        <span className="copilot-welcome__chip" onClick={() => onSuggestionClick?.("¿Cómo van las ventas hoy?")}>¿Cómo van las ventas hoy?</span>
        <span className="copilot-welcome__chip" onClick={() => onSuggestionClick?.("¿Cuál es mi plato estrella?")}>¿Cuál es mi plato estrella?</span>
        <span className="copilot-welcome__chip" onClick={() => onSuggestionClick?.("¿Qué productos debería quitar de la carta?")}>¿Qué debería quitar de la carta?</span>
      </div>
    </div>
  );
}

export default function CopilotMessages({ messages, loading, toolStatus, insights, insightsLoading, onSuggestionClick, onRetry, onFeedback }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!messages.length && !loading) {
    return (
      <div className="copilot-messages copilot-messages--empty">
        <WelcomeMessage
          insights={insights}
          insightsLoading={insightsLoading}
          onInsightClick={onSuggestionClick}
          onSuggestionClick={onSuggestionClick}
        />
      </div>
    );
  }

  return (
    <div className="copilot-messages">
      {messages.map((msg, i) => (
        <div key={i} className={`copilot-msg copilot-msg--${msg.role}`}>
          {msg.isError ? (
            <div className="copilot-msg__bubble copilot-msg__bubble--error">
              <span className="copilot-error__icon">⚠️</span>
              <span>{msg.content}</span>
              {onRetry && (
                <button className="copilot-error__retry" onClick={onRetry}>
                  Reintentar
                </button>
              )}
            </div>
          ) : (
            <>
              <div className={`copilot-msg__bubble copilot-msg__bubble--${msg.role}`}
                dangerouslySetInnerHTML={
                  msg.role === "assistant"
                    ? { __html: formatMarkdown(msg.content) }
                    : undefined
                }
              >
                {msg.role === "user" ? msg.content : undefined}
              </div>
              {msg.role === "assistant" && msg.content && !loading && onFeedback && (
                <div className="copilot-feedback">
                  <button
                    className={`copilot-feedback__btn ${msg.feedback === 1 ? "is-active" : ""}`}
                    onClick={() => onFeedback(i, 1)}
                    title="Respuesta útil"
                  >👍</button>
                  <button
                    className={`copilot-feedback__btn ${msg.feedback === -1 ? "is-active" : ""}`}
                    onClick={() => onFeedback(i, -1)}
                    title="Respuesta incorrecta"
                  >👎</button>
                  {msg.model && <span className="copilot-feedback__model">{msg.model}</span>}
                </div>
              )}
            </>
          )}
        </div>
      ))}
      {loading && toolStatus && (
        <div className="copilot-msg copilot-msg--assistant">
          <div className="copilot-msg__bubble copilot-msg__bubble--assistant copilot-tool-status">{toolStatus}</div>
        </div>
      )}
      {loading && !toolStatus && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
