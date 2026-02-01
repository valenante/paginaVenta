import React, { useEffect, useMemo, useState } from "react";
import "./EditarMesa.css";

export default function ModalEditarMesa({ mesa, onClose, onSave, onDelete }) {
  const [numero, setNumero] = useState(String(mesa.numero ?? ""));
  const [zona, setZona] = useState(mesa.zona ?? "interior");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const numeroLimpio = useMemo(() => numero.trim(), [numero]);

  useEffect(() => {
    // ESC para cerrar
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const validar = () => {
    if (!numeroLimpio) return "El número de mesa es obligatorio.";
    if (!/^\d+$/.test(numeroLimpio)) return "El número debe ser un valor numérico (por ejemplo: 12).";
    return "";
  };

  const handleSave = () => {
    const msg = validar();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    onSave?.({ numero: Number(numeroLimpio), zona });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete?.(mesa._id);
  };

  const zonaLabel = (z) => {
    if (z === "interior") return "Interior";
    if (z === "exterior") return "Terraza";
    if (z === "auxiliar") return "Auxiliar";
    return z;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-contenido"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-editar-mesa-title"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-text">
            <h2 id="modal-editar-mesa-title">Editar mesa {mesa.numero}</h2>
            <p className="modal-subtitle">
              Ajusta el número y la zona. Los cambios se reflejarán en el plano y en el TPV.
            </p>
          </div>

          <button className="modal-close" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="modal-form">
          <label className="modal-label">
            Número de mesa
            <span className="modal-help">
              Debe ser único y numérico. Ej: 1, 12, 25…
            </span>
          </label>
          <input
            value={numero}
            onChange={(e) => {
              setNumero(e.target.value);
              if (error) setError("");
              if (confirmDelete) setConfirmDelete(false);
            }}
            inputMode="numeric"
            placeholder="Ej: 12"
            className={`modal-input ${error ? "is-error" : ""}`}
          />

          <label className="modal-label">
            Zona
            <span className="modal-help">
              Define dónde aparecerá en el editor y cómo se mostrará en el TPV.
            </span>
          </label>
          <select
            value={zona}
            onChange={(e) => {
              setZona(e.target.value);
              if (confirmDelete) setConfirmDelete(false);
            }}
            className="modal-select"
          >
            <option value="interior">Interior</option>
            <option value="exterior">Terraza</option>
            <option value="auxiliar">Auxiliar</option>
          </select>

          {/* Hint contextual */}
          <div className="modal-hint">
            <strong>Zona actual:</strong> {zonaLabel(zona)} ·{" "}
            {zona === "auxiliar"
              ? "No aparecerá en el plano principal, solo en mesas auxiliares."
              : "Aparecerá dentro del plano principal de esta zona."}
          </div>

          {/* Error */}
          {error && <div className="modal-error">{error}</div>}
        </div>

        {/* Footer buttons */}
        <div className="modal-botones modal-botones-pro">
          <button className="btn-guardar" onClick={handleSave}>
            Guardar cambios
          </button>

          <button
            className={`btn-eliminar ${confirmDelete ? "is-confirm" : ""}`}
            onClick={handleDelete}
            title="Eliminar mesa"
          >
            {confirmDelete ? "Confirmar eliminar" : "Eliminar"}
          </button>

          <button className="btn-cerrar" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="modal-footer-note">
          Tip: pulsa <strong>ESC</strong> para cerrar rápido.
        </div>
      </div>
    </div>
  );
}
