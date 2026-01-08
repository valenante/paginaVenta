import React, { useState } from "react";
import api from "../../utils/api";
import "./AjustarStockShopModal.css";

const AjustarStockShopModal = ({ producto, onClose, onSave }) => {
  const stockActual = producto?.inventario?.stock ?? 0;
  const unidad = producto?.inventario?.unidadMedida || "ud";

  const [cantidad, setCantidad] = useState(stockActual);
  const [loading, setLoading] = useState(false);

  const aumentar = () => setCantidad((c) => Number(c) + 1);
  const disminuir = () => setCantidad((c) => Math.max(0, Number(c) - 1));

  const enviarAjuste = async () => {
    try {
      setLoading(true);
      const n = Number(cantidad);
      if (!Number.isFinite(n) || n < 0) return alert("Stock inválido");

      await api.post("/shop/stock/ajustar", {
        productoId: producto._id,
        nuevoStock: Number(cantidad),
        motivo: "Ajuste manual desde TPV",
      });

      onSave?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error ajustando stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alef-modal-overlay" onClick={onClose}>
      <div
        className="alef-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="stock-modal-header">
          <h3>📦 Ajustar stock</h3>
          <p>{producto.nombre}</p>
        </div>

        {/* BODY */}
        <div className="stock-modal-body">
          <div className="ajuste-row">
            <button className="ajuste-btn" onClick={disminuir}>−</button>

            <input
              type="number"
              className="ajuste-input"
              value={cantidad}
              onChange={(e) => {
                const v = e.target.value;
                setCantidad(v === "" ? "" : Math.max(0, Number(v)));
              }}
              min={0}
            />

            <button className="ajuste-btn" onClick={aumentar}>+</button>
          </div>

          <div className="unidad-label">
            Stock actual: <b>{stockActual}</b> {unidad}
          </div>
        </div>

        {/* ACTIONS */}
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

export default AjustarStockShopModal;
