// src/pages/admin/AdminDashboard/components/TenantModal.jsx
import Modal from "react-modal";
Modal.setAppElement("#root");

export default function TenantModal({ tenant, onClose }) {
  return (
    <Modal
      isOpen={!!tenant}
      onRequestClose={onClose}
      className="tenant-modal"
      overlayClassName="modal-overlay"
    >
      <h2>Detalles del Restaurante</h2>
      <div className="tenant-info">
        <p><strong>Nombre:</strong> {tenant.nombre}</p>
        <p><strong>Email:</strong> {tenant.email}</p>
        <p><strong>Plan:</strong> {tenant.plan}</p>
        <p><strong>VeriFactu:</strong> {tenant.verifactuEnabled ? "Activo ✅" : "Inactivo ❌"}</p>
        <p><strong>Creado:</strong> {new Date(tenant.createdAt).toLocaleString()}</p>
      </div>
      <button className="close-btn" onClick={onClose}>Cerrar</button>
    </Modal>
  );
}
