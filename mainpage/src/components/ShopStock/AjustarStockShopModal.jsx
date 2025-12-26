import React, { useState } from "react";
import "./ShopStockModals.css";

export default function AjustarStockShopModal({ item, onClose, onSave }) {
  const [valor, setValor] = useState("");

  return (
    <div className="overlay">
      <div className="modal shopstock-modal">
        <h3>Ajustar stock</h3>
        <p className="muted">
          {item?.nombre || "Ítem"} — stock actual: <b>{item?.stockActual ?? 0}</b>
        </p>

        <input
          placeholder="Nuevo stock (ej: 12)"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <div className="shopstock-modal__actions">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn-secondary"
            onClick={() => {
              // TODO backend: api.put(`/shop/stock/item/${item._id}`, { stockActual: Number(valor) })
              onClose();
              onSave?.();
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
