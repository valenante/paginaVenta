import React, { useState } from "react";
import api from "../../utils/api";
import "./AjustarStockModal.css";

const AjustarStockModal = ({ ingrediente, onClose, onSave }) => {
  const [cantidad, setCantidad] = useState(ingrediente.stockActual);
  const [loading, setLoading] = useState(false);

  const enviarAjuste = async () => {
    try {
      setLoading(true);
      await api.post("/stock/ajustar", {
        ingredienteId: ingrediente._id,
        nuevoStock: Number(cantidad),
      });

      onSave();
      onClose();
    } catch (err) {
      alert("Error ajustando stock");
    } finally {
      setLoading(false);
    }
  };

  const aumentar = () => setCantidad((c) => Number(c) + 1);
  const disminuir = () => setCantidad((c) => Math.max(0, Number(c) - 1));

  return (
    <div className="alef-modal-overlay" onClick={onClose}>
      <div className="alef-modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="stock-modal-header">
          <h3>📦 Ajustar stock</h3>
          <p>{ingrediente.nombre}</p>
        </div>

        <div className="stock-modal-body">
          <div className="ajuste-row">
            <button className="ajuste-btn" onClick={disminuir}>−</button>

            <input
              type="number"
              className="ajuste-input"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />

            <button className="ajuste-btn" onClick={aumentar}>+</button>
          </div>

          <div className="unidad-label">
            Unidad: {ingrediente.unidad}
          </div>
        </div>

        <div className="stock-modal-actions">
          <button className="btn-cancelar" onClick={onClose}>
            Cancelar
          </button>

          <button
            className="btn-confirmar"
            onClick={enviarAjuste}
            disabled={loading}
          >
            {loading ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AjustarStockModal;
