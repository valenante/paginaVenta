import { useState } from "react";
import {
  FiTrash2,
  FiEye,
  FiEdit2,
  FiLogIn,
  FiCoffee,
  FiShoppingBag,
} from "react-icons/fi";

import TenantModal from "./TenantModal";
import TenantModalShop from "./shop/TenantModalShop";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import EditEstadoModal from "./EditEstadoModal.jsx";
import EditPlanModal from "./EditPlanModal.jsx";
import api from "../../../../utils/api";
import Portal from "../../../../components/ui/Portal";

import "./TenantTable.css"; // 👈 CSS PROPIO

export default function TenantTable({ tenants, onRefresh }) {
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loadingImpersonar, setLoadingImpersonar] = useState(false);
  const [estadoTarget, setEstadoTarget] = useState(null);
  const [planTarget, setPlanTarget] = useState(null);

  /* =========================
     Actions
  ========================= */
  const handleDelete = async (tenantSlug) => {
    try {
      await api.delete(`/admin/superadmin/tenants/${tenantSlug}`);
      onRefresh();
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleImpersonar = async (tenantSlug) => {
    if (loadingImpersonar) return;
    setLoadingImpersonar(true);

    try {
      const { data } = await api.get(`/admin/superadmin/impersonar/${tenantSlug}`);
      if (data?.redirectUrl) {
        window.open(data.redirectUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setLoadingImpersonar(false);
    }
  };

  const handleEstadoChange = async (tenantId, nuevoEstado) => {
    await api.patch(`/admin/superadmin/tenants/${tenantId}/estado`, {
      estado: nuevoEstado,
    });
    await onRefresh();
  };

  const handlePlanSave = async (tenantId, nuevoPlanSlug) => {
    await api.patch(`/admin/superadmin/tenants/${tenantId}/plan`, {
      plan: nuevoPlanSlug,
    });
    await onRefresh();
  };

  /* =========================
     Empty state
  ========================= */
  if (!tenants.length) {
    return (
      <p className="tenant-table-empty">
        No hay restaurantes ni tiendas registradas.
      </p>
    );
  }

  /* =========================
     Render
  ========================= */
  return (
    <section className="tenant-table-section">
      <h3>Tenants registrados</h3>

      <div className="table-wrapper">
        <table className="tenants-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Email</th>
              <th>Plan</th>
              <th>VeriFactu</th>
              <th>Estado</th>
              <th>Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {tenants.map((t) => {
              const tipo = t.tipoNegocio || "restaurante";

              return (
                <tr key={t._id}>
                  <td>{t.nombre}</td>

                  <td className={`tipo tipo-${tipo}`}>
                    {tipo === "shop" ? <FiShoppingBag /> : <FiCoffee />}
                    {tipo}
                  </td>

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
                    <button
                      onClick={() => setSelected(t)}
                      title="Ver detalles"
                    >
                      <FiEye />
                    </button>

                    <button
                      onClick={() => setPlanTarget(t)}
                      title="Editar plan"
                    >
                      <FiEdit2 />
                    </button>

                    <button
                      onClick={() => handleImpersonar(t.slug)}
                      disabled={loadingImpersonar}
                      title="Entrar como admin"
                    >
                      <FiLogIn />
                    </button>

                    <button
                      onClick={() => setEstadoTarget(t)}
                      title="Cambiar estado"
                    >
                      {t.estado === "suspendido" ? "🔓" : "🔒"}
                    </button>

                    <button
                      className="delete"
                      onClick={() => setDeleteTarget(t)}
                      title="Eliminar"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* =========================
          Modales
      ========================= */}

      {selected && selected.tipoNegocio !== "shop" && (
        <TenantModal
          tenant={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {selected && selected.tipoNegocio === "shop" && (
        <TenantModalShop
          tenant={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          tenant={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.slug)}
        />
      )}

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
