// src/pages/admin/AdminDashboard/components/TenantTable.jsx
import { useState } from "react";
import { FiTrash2, FiEye, FiEdit2, FiLogIn } from "react-icons/fi";
import TenantModal from "./TenantModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import EditEstadoModal from "./EditEstadoModal.jsx";
import EditPlanModal from "./EditPlanModal.jsx"; // 👈 nuevo modal
import api from "../../../../utils/api";
import Portal from "../../../../components/ui/Portal";

export default function TenantTable({ tenants, onRefresh }) {
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loadingImpersonar, setLoadingImpersonar] = useState(false);
  const [estadoTarget, setEstadoTarget] = useState(null);
  const [planTarget, setPlanTarget] = useState(null); // 👈 nuevo

  const handleDelete = async (tenantSlug) => {
    try {
      await api.delete(`/superadmin/tenants/${tenantSlug}`);
      onRefresh();
    } catch (err) {
      console.error("Error al eliminar tenant:", err);
      alert("No se pudo eliminar el restaurante.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleImpersonar = async (tenantSlug) => {
    if (loadingImpersonar) return;
    setLoadingImpersonar(true);

    try {
      const { data } = await api.get(`/superadmin/impersonar/${tenantSlug}`);

      if (data?.ok && data?.redirectUrl) {
        window.open(data.redirectUrl, "_blank", "noopener,noreferrer");
      } else {
        console.warn("⚠️ Respuesta inesperada del servidor:", data);
        alert(data?.error || "No se pudo generar la URL de impersonación.");
      }
    } catch (err) {
      console.error(
        "❌ Error al impersonar tenant:",
        err.response?.data || err.message
      );
      alert(
        err.response?.data?.error ||
        "No se pudo entrar como admin del restaurante."
      );
    } finally {
      setLoadingImpersonar(false);
    }
  };

  // 👉 Cambiar estado (trial / activo / impago / suspendido / cancelado)
  const handleEstadoChange = async (tenantId, nuevoEstado) => {
    await api.patch(`/superadmin/tenants/${tenantId}/estado`, {
      estado: nuevoEstado,
    });
    await onRefresh();
  };

  // 👉 Cambiar plan del tenant
  const handlePlanSave = async (tenantId, nuevoPlanSlug) => {
    // PATCH /superadmin/tenants/:id/plan  { plan: 'premium' }
    const { data } = await api.patch(`/superadmin/tenants/${tenantId}/plan`, {
      plan: nuevoPlanSlug,
    });
    await onRefresh();
    return data;
  };

  if (!tenants.length)
    return <p className="empty">No hay restaurantes registrados aún.</p>;

  return (
    <section className="tenant-table-section">
      <h3>Restaurantes Registrados</h3>

      <div className="table-wrapper">
        <table className="tenants-table">
          <thead>
            <tr>
              <th>Restaurante</th>
              <th>Email</th>
              <th>Plan</th>
              <th>VeriFactu</th>
              <th>Estado</th>
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
                <td>
                  <span className={`estado-tag estado-${t.estado}`}>
                    {t.estado}
                  </span>
                </td>
                <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td className="actions">
                  {/* 👁️ Ver detalles */}
                  <button title="Ver detalles" onClick={() => setSelected(t)}>
                    <FiEye />
                  </button>

                  {/* ✏️ Editar plan del restaurante */}
                  <button
                    title="Editar plan"
                    onClick={() => setPlanTarget(t)}
                  >
                    <FiEdit2 />
                  </button>

                  {/* 👤 Entrar como admin */}
                  <button
                    title="Entrar como admin"
                    onClick={() => handleImpersonar(t.slug)}
                    disabled={loadingImpersonar}
                  >
                    <FiLogIn />
                  </button>

                  {/* 🔒 Cambiar estado (trial/activo/impago/suspendido/cancelado) */}
                  <button
                    title="Cambiar estado"
                    onClick={() => setEstadoTarget(t)}
                  >
                    {t.estado === "suspendido" ? "🔓" : "🔒"}
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
      </div>


      {/* 🔍 Modal Detalles */}
      {selected && (
        <TenantModal tenant={selected} onClose={() => setSelected(null)} />
      )}

      {/* ⚠️ Modal Confirmación de Eliminación */}
      {deleteTarget && (
        <ConfirmDeleteModal
          tenant={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.slug)}
        />
      )}

      {/* 🎛 Modal para cambiar estado */}
      {estadoTarget && (
        <EditEstadoModal
          tenant={estadoTarget}
          onClose={() => setEstadoTarget(null)}
          onSave={handleEstadoChange}
        />
      )}

      {planTarget && (
        <Portal>
          <EditPlanModal
            tenant={planTarget}
            onClose={() => setPlanTarget(null)}
            onSave={handlePlanSave}
          />
        </Portal>
      )}
    </section>
  );
}
