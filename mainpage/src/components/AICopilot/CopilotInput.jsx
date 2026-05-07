import React, { useState, useRef, useCallback } from "react";

export default function CopilotInput({ onSend, loading, fullscreen }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null); // { base64, mimeType, name }
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  const handleSend = useCallback(() => {
    if (loading) return;
    if (!text.trim() && !image) return;
    onSend(text.trim(), image);
    setText("");
    setImage(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [text, image, loading, onSend]);

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

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ALLOWED = ["image/", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv", "application/csv"];
    const isAllowed = ALLOWED.some((t) => file.type.startsWith(t) || file.type === t);
    if (!isAllowed) { alert("Formato no soportado. Usa imagen, Excel (.xlsx) o CSV."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("Imagen demasiado grande (máx 10MB)"); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      setImage({ base64, mimeType: file.type, name: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  return (
    <div className="copilot-input">
      {image && (
        <div className="copilot-input__preview">
          <span className="copilot-input__preview-name">📎 {image.name}</span>
          <button className="copilot-input__preview-remove" onClick={() => setImage(null)}>✕</button>
        </div>
      )}
      <div className="copilot-input__row">
        <button
          type="button"
          className="copilot-input__attach"
          onClick={() => fileRef.current?.click()}
          title="Adjuntar archivo (imagen, Excel, CSV...)"
          disabled={loading}
        >
          📎
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleFile}
        />
        <textarea
          ref={textareaRef}
          className="copilot-input__textarea"
          value={text}
          onChange={(e) => { setText(e.target.value.slice(0, 2000)); handleInput(); }}
          onKeyDown={handleKeyDown}
          placeholder={image ? "Describe qué quieres hacer con la imagen..." : "Pregunta sobre tu restaurante..."}
          rows={1}
          disabled={loading}
        />
        <button
          className="copilot-input__send"
          onClick={handleSend}
          disabled={(!text.trim() && !image) || loading}
          aria-label="Enviar"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
