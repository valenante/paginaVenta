import React from "react";
import RecetaEditor from "./RecetasEditor";
import "./ModalReceta.css";

export default function ModalReceta({ producto, onClose }) {
  return (
    <div className="receta-modal-overlay" onClick={onClose}>
      <div
        className="receta-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="receta-modal-header">
          <h3>🍳 Receta — {producto.nombre}</h3>

          <button className="receta-close-btn" onClick={onClose}>
            ✖
          </button>
        </header>

        <div className="receta-modal-body">
          <RecetaEditor producto={producto} />
        </div>
      </div>
    </div>
  );
}
