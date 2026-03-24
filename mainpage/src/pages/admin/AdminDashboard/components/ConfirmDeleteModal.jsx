// src/pages/admin/AdminDashboard/components/ConfirmDeleteModal.jsx
import { useState } from "react";
import Modal from "react-modal";
Modal.setAppElement("#root");
import "./ConfirmDeleteModal.css";

export default function ConfirmDeleteModal({ tenant, onCancel, onConfirm }) {
  const [typed, setTyped] = useState("");
  const expected = tenant?.nombre || "";
  const matches = typed.trim() === expected.trim();

  return (
    <Modal
      isOpen={!!tenant}
      onRequestClose={onCancel}
      className="confirm-modal"
      overlayClassName="modal-overlay"
    >
      <h3>¿Eliminar tenant?</h3>
      <p>
        Estás a punto de eliminar <strong>{tenant?.nombre}</strong>.
        Esta acción marca el tenant como eliminado (soft-delete).
      </p>
      <p style={{ fontSize: 14, marginTop: 8 }}>
        Escribe <strong>{expected}</strong> para confirmar:
      </p>
      <input
        type="text"
        className="confirm-modal__input"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={expected}
        autoFocus
      />
      <div className="buttons">
        <button onClick={onCancel}>Cancelar</button>
        <button className="danger" onClick={onConfirm} disabled={!matches}>
          Eliminar
        </button>
      </div>
    </Modal>
  );
}
