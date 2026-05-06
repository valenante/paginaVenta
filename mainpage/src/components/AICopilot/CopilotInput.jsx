import React, { useState, useRef, useCallback } from "react";

export default function CopilotInput({ onSend, loading, fullscreen }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [text, loading, onSend]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, fullscreen ? 160 : 100) + "px";
  }, [fullscreen]);

  return (
    <div className="copilot-input">
      <textarea
        ref={textareaRef}
        className="copilot-input__textarea"
        value={text}
        onChange={(e) => { setText(e.target.value.slice(0, 2000)); handleInput(); }}
        onKeyDown={handleKeyDown}
        placeholder="Pregunta sobre tu restaurante..."
        rows={1}
        disabled={loading}
      />
      <button
        className="copilot-input__send"
        onClick={handleSend}
        disabled={!text.trim() || loading}
        aria-label="Enviar"
      >
        ➤
      </button>
    </div>
  );
}
