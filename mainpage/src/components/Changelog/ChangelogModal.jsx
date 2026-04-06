import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../../utils/api";
import "./ChangelogModal.css";

const STORAGE_KEY = "alef_changelog_seen";

const TIPO_LABELS = {
  nueva: { emoji: "🆕", label: "Nueva" },
  mejora: { emoji: "✨", label: "Mejora" },
  fix: { emoji: "🔧", label: "Corregido" },
  cambio: { emoji: "🔄", label: "Cambio" },
};

export default function ChangelogModal() {
  const [entry, setEntry] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get("/auth/changelog/latest");
        const changelog = data?.data || data;
        if (!changelog || cancelled) return;

        const seenVersion = localStorage.getItem(STORAGE_KEY);
        if (seenVersion === changelog.version) return;

        setEntry(changelog);
        setVisible(true);
      } catch {
        // silencioso
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    if (entry?.version) {
      localStorage.setItem(STORAGE_KEY, entry.version);
    }
  }, [entry]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, handleClose]);

  if (!visible || !entry) return null;

  const modalRoot = document.getElementById("modal-root") || document.body;

  return createPortal(
    <div className="changelog-overlay" onMouseDown={handleClose}>
      <div className="changelog-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="changelog-close" onClick={handleClose} aria-label="Cerrar">
          &times;
        </button>

        <div className="changelog-header">
          <span className="changelog-badge">Novedades en Alef</span>
          <h2 className="changelog-title">{entry.titulo}</h2>
          <div className="changelog-meta">
            <span className="changelog-version">v{entry.version}</span>
            {entry.fecha && (
              <span className="changelog-date">
                {new Date(entry.fecha).toLocaleDateString("es-ES", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        {entry.descripcion && (
          <p className="changelog-desc">{entry.descripcion}</p>
        )}

        {entry.items?.length > 0 && (
          <ul className="changelog-items">
            {entry.items.map((item, i) => {
              const tipo = TIPO_LABELS[item.tipo] || TIPO_LABELS.mejora;
              return (
                <li key={i} className="changelog-item">
                  <span className={`changelog-item-badge changelog-item-badge--${item.tipo}`}>
                    {tipo.emoji} {tipo.label}
                  </span>
                  <span className="changelog-item-text">{item.texto}</span>
                </li>
              );
            })}
          </ul>
        )}

        <button className="changelog-btn" onClick={handleClose}>
          Entendido
        </button>
      </div>
    </div>,
    modalRoot
  );
}
