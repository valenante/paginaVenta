// src/components/Panel/InfoModal.jsx
// Modal reutilizable de ayuda (?) para explicar componentes analytics
import { useState } from "react";
import { createPortal } from "react-dom";
import { FiHelpCircle, FiX } from "react-icons/fi";
import "./InfoModal.css";

export function InfoButton({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="info-btn" onClick={() => setOpen(true)} title={`¿Qué es ${title}?`} type="button">
        <FiHelpCircle />
      </button>
      {open && createPortal(
        <div className="info-overlay" onClick={() => setOpen(false)}>
          <div className="info-modal" onClick={e => e.stopPropagation()}>
            <div className="info-modal__head">
              <h3>{title}</h3>
              <button className="info-modal__close" onClick={() => setOpen(false)}><FiX /></button>
            </div>
            <div className="info-modal__body">{children}</div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
