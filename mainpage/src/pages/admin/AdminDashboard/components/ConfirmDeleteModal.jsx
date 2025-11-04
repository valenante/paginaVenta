// src/pages/admin/AdminDashboard/components/ConfirmDeleteModal.jsx
import Modal from "react-modal";
Modal.setAppElement("#root");

export default function ConfirmDeleteModal({ tenant, onCancel, onConfirm }) {
  return (
    <Modal
      isOpen={!!tenant}
      onRequestClose={onCancel}
      className="confirm-modal"
      overlayClassName="modal-overlay"
    >
      <h3>¿Eliminar restaurante?</h3>
      <p>
        Estás a punto de eliminar <strong>{tenant?.nombre}</strong>.  
        Esta acción no se puede deshacer.
      </p>
      <div className="buttons">
        <button onClick={onCancel}>Cancelar</button>
        <button className="danger" onClick={onConfirm}>Eliminar</button>
      </div>
    </Modal>
  );
}
