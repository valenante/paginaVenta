// src/pages/superadmin/tenants/components/TenantTable.jsx
import { useMemo, useState } from "react";
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

function readEnvMode() {
  const v = String(sessionStorage.getItem("alef_env") || "prod").toLowerCase();
  return v === "sandbox" ? "sandbox" : "prod";
}

function readSandboxTenantId() {
  return String(sessionStorage.getItem("sandbox_tenantId") || "").trim();
}

function EnvPill({ mode, tenant }) {
  const isSandbox = mode === "sandbox";
  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.2,
    border: "1px solid rgba(255,255,255,0.12)",
    background: isSandbox ? "rgba(255, 193, 7, 0.12)" : "rgba(46, 204, 113, 0.10)",
    color: isSandbox ? "rgba(255, 193, 7, 0.95)" : "rgba(46, 204, 113, 0.95)",
    whiteSpace: "nowrap",
  };

  return (
    <span style={style} title={isSandbox ? "Modo sandbox activo" : "Modo producción activo"}>
      {isSandbox ? "🟡 SANDBOX" : "🟢 PROD"}
      {isSandbox && tenant ? <span style={{ opacity: 0.9 }}>({tenant})</span> : null}
    </span>
  );
}

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

  // =========================
  // ENV MODE (panel)
  // =========================
  const panelEnvMode = useMemo(() => readEnvMode(), []); // snapshot inicial
  const sandboxTenantId = useMemo(() => readSandboxTenantId(), []); // snapshot inicial

  const getEffectiveEnvModeForTenant = (tenantSlugRaw) => {
    const tenantSlug = String(tenantSlugRaw || "").trim();
    const env = readEnvMode(); // lee “live”
    const sbTenant = readSandboxTenantId(); // lee “live”

    // ✅ Regla: impersona sandbox SOLO si hay sandbox real “activo” y coincide con el tenant
    // (si no coincide, impersona PROD aunque el panel esté en sandbox)
    if (env === "sandbox" && sbTenant && sbTenant === tenantSlug) return "sandbox";
    return "prod";
  };

  const envLabel = useMemo(() => {
    const env = panelEnvMode;
    if (env === "sandbox") return { mode: "sandbox", tenant: sandboxTenantId || "—" };
    return { mode: "prod", tenant: "" };
  }, [panelEnvMode, sandboxTenantId]);

  const impersonacionPreview = useMemo(() => {
    if (!impersonarTarget) return null;
    const slug = (impersonarTarget.slug || impersonarTarget.tenantId || "").trim();
    const env = getEffectiveEnvModeForTenant(slug);

    const rawEnv = readEnvMode();
    const sb = readSandboxTenantId();
    const mismatchWarn =
      rawEnv === "sandbox" && sb && slug && sb !== slug
        ? `⚠️ Estás en modo sandbox, pero el sandbox activo es "${sb}". Para "${slug}" entrarás en PROD.`
        : null;

    return { env, slug, mismatchWarn };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impersonarTarget]);

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

    const tenantSlug = String(tenant.slug || tenant.tenantId || "").trim();
    const reasonText = (reasonTextRaw || "").trim();

    if (!tenantSlug) {
      showAlert("error", "Tenant inválido (falta slug/tenantId).");
      return;
    }
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

    const envMode = getEffectiveEnvModeForTenant(tenantSlug);

    // ✅ abrir ventana ANTES del await (evita bloqueador de popups)
    const w = window.open("about:blank", "_blank");
    if (!w) {
      setLoadingImpersonar(false);
      showAlert(
        "warn",
        "El navegador bloqueó la nueva pestaña. Permite pop-ups para continuar con la impersonación."
      );
      return;
    }

    try {
      const { data } = await api.post(`/admin/superadmin/impersonar/${tenantSlug}`, {
        reasonCategory,
        reasonText,
        envMode, // ✅ CLAVE
      });

      if (data?.redirectUrl) {
        w.location.href = data.redirectUrl;

        showAlert(
          "info",
          envMode === "sandbox"
            ? `🟡 Impersonación creada en SANDBOX (${tenantSlug}). Abriendo tenant…`
            : `🟢 Impersonación creada en PROD (${tenantSlug}). Abriendo tenant…`
        );

        setImpersonarTarget(null);
        return;
      }

      // ⛔ Solo llega aquí si NO hubo redirectUrl
      w.close();
      showAlert("error", "No se recibió redirectUrl del servidor.");
    } catch (err) {
      w.close();
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

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <h3 style={{ margin: 0 }}>Tenants registrados</h3>
        <EnvPill mode={envLabel.mode} tenant={envLabel.tenant} />
      </div>

      <div className="table-wrapper" style={{ marginTop: 10 }}>
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

              // pill por fila (solo marca sandbox si coincide exactamente con el sandbox activo)
              const rowEnv = getEffectiveEnvModeForTenant(slug);
              const showRowSandbox =
                rowEnv === "sandbox" && readEnvMode() === "sandbox" && readSandboxTenantId() === String(slug || "").trim();

              return (
                <tr key={t._id}>
                  <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span>{t.nombre}</span>
                    {showRowSandbox ? <EnvPill mode="sandbox" tenant="" /> : null}
                  </td>

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
                      title={`Entrar como admin (${getEffectiveEnvModeForTenant(slug).toUpperCase()})`}
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
            mensaje={
              (() => {
                const preview = impersonacionPreview;
                const name = impersonarTarget.nombre;
                const slug = (impersonarTarget.slug || impersonarTarget.tenantId || "").trim();
                const env = preview?.env || "prod";
                const envText = env === "sandbox" ? "🟡 SANDBOX" : "🟢 PROD";

                return `Vas a entrar como admin de "${name}" (${slug}). Modo: ${envText}. Indica el motivo (mín. 20 caracteres).`;
              })()
            }
            placeholder="Motivo (mínimo 20 caracteres)"
            onClose={() => setImpersonarTarget(null)}
            onConfirm={confirmarImpersonacion}
          >
            <div style={{ display: "grid", gap: 10 }}>
              {!!impersonacionPreview?.mismatchWarn && (
                <div style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(255,193,7,0.12)" }}>
                  <strong>Atención:</strong> {impersonacionPreview.mismatchWarn}
                </div>
              )}

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