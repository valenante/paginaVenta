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
import ModalConfirmacion from "../../../../components/Modal/ModalConfirmacion.jsx";
import AlertaMensaje from "../../../../components/AlertaMensaje/AlertaMensaje.jsx";

import api from "../../../../utils/api";
import Portal from "../../../../components/ui/Portal";

import "./TenantTable.css";

export default function TenantTable({ tenants, onRefresh }) {
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [loadingImpersonar, setLoadingImpersonar] = useState(false);
  const [impersonarTarget, setImpersonarTarget] = useState(null);
  const [reasonCategory, setReasonCategory] = useState("soporte");

  const [estadoTarget, setEstadoTarget] = useState(null);
  const [planTarget, setPlanTarget] = useState(null);

  const [alerta, setAlerta] = useState(null); // { tipo, mensaje }

  const showAlert = (tipo, mensaje) => setAlerta({ tipo, mensaje });

  const normalizeAxiosError = (err) => {
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "Error inesperado";
    return msg;
  };

  /* =========================
     Actions
  ========================= */
  const handleDelete = async (tenantSlug) => {
    try {
      await api.delete(`/admin/superadmin/tenants/${tenantSlug}`);
      await onRefresh();
      showAlert("info", "Tenant eliminado correctamente.");
    } catch (err) {
      showAlert("error", normalizeAxiosError(err));
    } finally {
      setDeleteTarget(null);
    }
  };

  // Abre modal de motivo
  const abrirImpersonacion = (tenant) => {
    setReasonCategory("soporte");
    setImpersonarTarget(tenant);
  };

  // Confirmación del modal (recibe reasonText desde ModalConfirmacion)
  const confirmarImpersonacion = async (reasonTextRaw) => {
    const tenant = impersonarTarget;
    if (!tenant) return;

    const tenantSlug = tenant.slug || tenant.tenantId;
    const reasonText = (reasonTextRaw || "").trim();

    if (!reasonCategory) {
      showAlert("warn", "Selecciona una categoría.");
      return;
    }
    if (reasonText.length < 20) {
      showAlert("warn", "El motivo debe tener mínimo 20 caracteres.");
      return;
    }

    if (loadingImpersonar) return;
    setLoadingImpersonar(true);

    // ✅ abrir ventana ANTES del await (evita bloqueador de popups)
    const w = window.open("about:blank", "_blank");

    try {
      const { data } = await api.post(`/admin/superadmin/impersonar/${tenantSlug}`, {
        reasonCategory,
        reasonText,
      });

      if (data?.redirectUrl) {
        // Usa la pestaña que ya abriste (mejor UX y sin popup blocker)
        w.location.href = data.redirectUrl;

        showAlert("info", "Impersonación creada. Abriendo tenant…");
        setImpersonarTarget(null);

        return; // ⬅️ ESTO ES CLAVE
      }

      // ⛔ Solo llega aquí si NO hubo redirectUrl
      if (w) w.close();
      showAlert("error", "No se recibió redirectUrl del servidor.");
    } catch (err) {
      if (w) w.close();
      showAlert("error", normalizeAxiosError(err));
    } finally {
      setLoadingImpersonar(false);
    }
  };

  const handleEstadoChange = async (tenantId, nuevoEstado) => {
    try {
      await api.patch(`/admin/superadmin/tenants/${tenantId}/estado`, {
        estado: nuevoEstado,
      });
      await onRefresh();
      showAlert("info", "Estado actualizado.");
    } catch (err) {
      showAlert("error", normalizeAxiosError(err));
    }
  };

  const handlePlanSave = async (tenantId, nuevoPlanSlug) => {
    try {
      await api.patch(`/admin/superadmin/tenants/${tenantId}/plan`, {
        plan: nuevoPlanSlug,
      });
      await onRefresh();
      showAlert("info", "Plan actualizado.");
    } catch (err) {
      showAlert("error", normalizeAxiosError(err));
    }
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
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

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
              const slug = t.slug || t.tenantId;

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
                    <button onClick={() => setSelected(t)} title="Ver detalles">
                      <FiEye />
                    </button>

                    <button onClick={() => setPlanTarget(t)} title="Editar plan">
                      <FiEdit2 />
                    </button>

                    <button
                      onClick={() => abrirImpersonacion(t)}
                      disabled={loadingImpersonar || !slug}
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
        <TenantModal tenant={selected} onClose={() => setSelected(null)} />
      )}

      {selected && selected.tipoNegocio === "shop" && (
        <TenantModalShop tenant={selected} onClose={() => setSelected(null)} />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          tenant={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.slug || deleteTarget.tenantId)}
        />
      )}

      {estadoTarget && (
        <Portal>
          <EditEstadoModal
            tenant={estadoTarget}
            onClose={() => setEstadoTarget(null)}
            onSave={handleEstadoChange}
          />
        </Portal>
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

      {/* ✅ Modal de impersonación (reutilizando ModalConfirmacion) */}
      {impersonarTarget && (
        <Portal>
          <ModalConfirmacion
            titulo="Impersonar tenant"
            mensaje={`Vas a entrar como admin de "${impersonarTarget.nombre}". Indica el motivo (mín. 20 caracteres).`}
            placeholder="Motivo (mínimo 20 caracteres)"
            onClose={() => setImpersonarTarget(null)}
            onConfirm={confirmarImpersonacion}
          >
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ fontWeight: 600 }}>
                Categoría
                <select
                  className="modal-input--modalconfirmacion"
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  style={{ marginTop: 6 }}
                >
                  <option value="soporte">Soporte</option>
                  <option value="incidencia">Incidencia</option>
                  <option value="facturacion">Facturación</option>
                  <option value="configuracion">Configuración</option>
                  <option value="otro">Otro</option>
                </select>
              </label>

              {loadingImpersonar && (
                <p style={{ margin: 0, opacity: 0.8 }}>
                  Creando sesión de impersonación…
                </p>
              )}
            </div>
          </ModalConfirmacion>
        </Portal>
      )}
    </section>
  );
}
