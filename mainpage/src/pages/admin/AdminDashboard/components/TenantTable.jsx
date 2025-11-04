// src/pages/admin/AdminDashboard/components/TenantTable.jsx
import { useState } from "react";
import { FiTrash2, FiEye, FiEdit2, FiLogIn } from "react-icons/fi";
import TenantModal from "./TenantModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import api from "../../../../utils/api";

export default function TenantTable({ tenants, onRefresh }) {
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loadingImpersonar, setLoadingImpersonar] = useState(false);

  const handleDelete = async (tenantId) => {
    try {
      await api.delete(`/superadmin/tenants/${tenantId}`);
      onRefresh();
    } catch (err) {
      console.error("Error al eliminar tenant:", err);
      alert("No se pudo eliminar el restaurante.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleImpersonar = async (tenantId) => {
    if (loadingImpersonar) return;
    setLoadingImpersonar(true);

    try {
      console.log(`🟣 Intentando impersonar tenant: ${tenantId}`);
      const { data } = await api.get(`/superadmin/impersonar/${tenantId}`);

      if (data?.ok && data?.redirectUrl) {
        console.log("✅ URL de impersonación generada:", data.redirectUrl);
        window.open(data.redirectUrl, "_blank", "noopener,noreferrer");
      } else {
        console.warn("⚠️ Respuesta inesperada del servidor:", data);
        alert(data?.error || "No se pudo generar la URL de impersonación.");
      }
    } catch (err) {
      console.error("❌ Error al impersonar tenant:", err.response?.data || err.message);
      alert(err.response?.data?.error || "No se pudo entrar como admin del restaurante.");
    } finally {
      setLoadingImpersonar(false);
    }
  };


  if (!tenants.length)
    return <p className="empty">No hay restaurantes registrados aún.</p>;

  return (
    <section className="tenant-table-section">
      <h3>Restaurantes Registrados</h3>

      <table className="tenants-table">
        <thead>
          <tr>
            <th>Restaurante</th>
            <th>Email</th>
            <th>Plan</th>
            <th>VeriFactu</th>
            <th>Creación</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {tenants.map((t) => (
            <tr key={t._id}>
              <td>{t.nombre}</td>
              <td>{t.email}</td>
              <td>{t.plan}</td>
              <td>{t.verifactuEnabled ? "✅" : "❌"}</td>
              <td>{new Date(t.createdAt).toLocaleDateString()}</td>
              <td className="actions">
                {/* 👁️ Ver detalles */}
                <button title="Ver detalles" onClick={() => setSelected(t)}>
                  <FiEye />
                </button>

                {/* ✏️ Editar plan o datos */}
                <button title="Editar plan">
                  <FiEdit2 />
                </button>

                {/* 👤 Entrar como admin */}
                <button
                  title="Entrar como admin"
                  onClick={() => handleImpersonar(t.tenantId)}
                  disabled={loadingImpersonar}
                >
                  <FiLogIn />
                </button>

                {/* 🗑️ Eliminar */}
                <button
                  className="delete"
                  title="Eliminar"
                  onClick={() => setDeleteTarget(t)}
                >
                  <FiTrash2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔍 Modal Detalles */}
      {selected && (
        <TenantModal tenant={selected} onClose={() => setSelected(null)} />
      )}

      {/* ⚠️ Modal Confirmación de Eliminación */}
      {deleteTarget && (
        <ConfirmDeleteModal
          tenant={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.tenantId)}
        />
      )}
    </section>
  );
}
