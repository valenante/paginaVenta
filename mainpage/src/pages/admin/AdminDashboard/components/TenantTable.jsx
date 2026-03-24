// src/pages/admin/AdminDashboard/components/TenantTable.jsx
import { useMemo, useRef, useState, useEffect } from "react";
import {
  FiTrash2, FiEye, FiEdit2, FiLogIn, FiCoffee, FiShoppingBag,
  FiMoreVertical, FiChevronLeft, FiChevronRight,
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

/* ── Helpers ─────────────────────────────────────────── */

function readEnvMode() {
  return String(sessionStorage.getItem("alef_env") || "prod").toLowerCase() === "sandbox" ? "sandbox" : "prod";
}
function readSandboxTenantId() {
  return String(sessionStorage.getItem("sandbox_tenantId") || "").trim();
}

function EnvPill({ mode, tenant }) {
  const sb = mode === "sandbox";
  return (
    <span className={`env-pill ${sb ? "env-pill--sandbox" : "env-pill--prod"}`}>
      {sb ? "SANDBOX" : "PROD"}
      {sb && tenant ? <span className="env-pill__tenant">({tenant})</span> : null}
    </span>
  );
}

/* ── Actions Dropdown (mobile — uses Portal) ─────────── */

function ActionsDropdown({ children }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Position menu relative to trigger via Portal
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuW = 180;
    let left = rect.right - menuW;
    if (left < 8) left = 8;
    setPos({ top: rect.bottom + 4 + window.scrollY, left });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="actions-dropdown__trigger"
        onClick={() => setOpen((p) => !p)}
        aria-label="Acciones"
      >
        <FiMoreVertical />
      </button>
      {open && (
        <Portal>
          <div
            ref={menuRef}
            className="actions-dropdown__menu"
            style={{ position: "absolute", top: pos.top, left: pos.left }}
            onClick={() => setOpen(false)}
          >
            {children}
          </div>
        </Portal>
      )}
    </>
  );
}

/* ── Main Component ──────────────────────────────────── */

export default function TenantTable({ tenants, onRefresh, loading, page, setPage, totalPages, total }) {
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loadingImpersonar, setLoadingImpersonar] = useState(false);
  const [impersonarTarget, setImpersonarTarget] = useState(null);
  const [reasonCategory, setReasonCategory] = useState("soporte");
  const [estadoTarget, setEstadoTarget] = useState(null);
  const [planTarget, setPlanTarget] = useState(null);
  const [alerta, setAlerta] = useState(null);

  const showAlert = (tipo, mensaje) => setAlerta({ tipo, mensaje });
  const normalizeErr = (err) =>
    err?.response?.data?.error || err?.response?.data?.message || err?.message || "Error inesperado";

  /* env mode */
  const panelEnvMode = useMemo(() => readEnvMode(), []);
  const sandboxTenantId = useMemo(() => readSandboxTenantId(), []);

  const getEnvForTenant = (slug) => {
    const env = readEnvMode();
    const sb = readSandboxTenantId();
    return env === "sandbox" && sb && sb === String(slug || "").trim() ? "sandbox" : "prod";
  };

  const envLabel = useMemo(() => {
    if (panelEnvMode === "sandbox") return { mode: "sandbox", tenant: sandboxTenantId || "—" };
    return { mode: "prod", tenant: "" };
  }, [panelEnvMode, sandboxTenantId]);

  const impersonacionPreview = useMemo(() => {
    if (!impersonarTarget) return null;
    const slug = (impersonarTarget.slug || impersonarTarget.tenantId || "").trim();
    const env = getEnvForTenant(slug);
    const rawEnv = readEnvMode();
    const sb = readSandboxTenantId();
    const mismatchWarn = rawEnv === "sandbox" && sb && slug && sb !== slug
      ? `Estás en sandbox, pero el sandbox activo es "${sb}". Para "${slug}" entrarás en PROD.`
      : null;
    return { env, slug, mismatchWarn };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impersonarTarget]);

  /* ── Actions ───────────────────────────── */

  const handleDelete = async (tenantSlug) => {
    try {
      await api.delete(`/admin/superadmin/tenants/${tenantSlug}`);
      await onRefresh();
      showAlert("info", "Tenant marcado para eliminacion.");
    } catch (err) {
      showAlert("error", normalizeErr(err));
    } finally {
      setDeleteTarget(null);
    }
  };

  const abrirImpersonacion = (tenant) => {
    setReasonCategory("soporte");
    setImpersonarTarget(tenant);
  };

  const confirmarImpersonacion = async (reasonTextRaw) => {
    const tenant = impersonarTarget;
    if (!tenant) return;
    const tenantSlug = String(tenant.slug || tenant.tenantId || "").trim();
    const reasonText = (reasonTextRaw || "").trim();

    if (!tenantSlug) return showAlert("error", "Tenant inválido.");
    if (!reasonCategory) return showAlert("warn", "Selecciona una categoría.");
    if (reasonText.length < 20) return showAlert("warn", "El motivo debe tener mínimo 20 caracteres.");
    if (loadingImpersonar) return;
    setLoadingImpersonar(true);

    const envMode = getEnvForTenant(tenantSlug);
    const w = window.open("about:blank", "_blank");
    if (!w) {
      setLoadingImpersonar(false);
      return showAlert("warn", "El navegador bloqueó la nueva pestaña. Permite pop-ups.");
    }

    try {
      const { data } = await api.post(`/admin/superadmin/impersonar/${tenantSlug}`, {
        reasonCategory, reasonText, envMode,
      });
      if (data?.redirectUrl) {
        w.location.href = data.redirectUrl;
        showAlert("info", `Impersonación ${envMode === "sandbox" ? "SANDBOX" : "PROD"} creada para ${tenantSlug}.`);
        setImpersonarTarget(null);
        return;
      }
      w.close();
      showAlert("error", "No se recibió redirectUrl del servidor.");
    } catch (err) {
      w.close();
      showAlert("error", normalizeErr(err));
    } finally {
      setLoadingImpersonar(false);
    }
  };

  const handleEstadoChange = async (tenantId, nuevoEstado) => {
    try {
      await api.patch(`/admin/superadmin/tenants/${tenantId}/estado`, { estado: nuevoEstado });
      await onRefresh();
      showAlert("info", "Estado actualizado.");
    } catch (err) { showAlert("error", normalizeErr(err)); }
  };

  const handlePlanSave = async (tenantId, nuevoPlanSlug) => {
    try {
      await api.patch(`/admin/superadmin/tenants/${tenantId}/plan`, { plan: nuevoPlanSlug });
      await onRefresh();
      showAlert("info", "Plan actualizado.");
    } catch (err) { showAlert("error", normalizeErr(err)); }
  };

  /* ── Action buttons (shared between desktop and mobile) ─── */

  const renderActions = (t, slug, isMobile = false) => {
    const cls = isMobile ? "actions-dropdown__item" : "tenant-actions__btn";
    const dangerCls = isMobile ? "actions-dropdown__item actions-dropdown__item--danger" : "tenant-actions__btn tenant-actions__btn--danger";

    const buttons = (
      <>
        <button type="button" className={cls} onClick={() => setSelected(t)} title="Ver detalles">
          <FiEye /> {isMobile && <span>Ver</span>}
        </button>
        <button type="button" className={cls} onClick={() => setPlanTarget(t)} title="Editar plan">
          <FiEdit2 /> {isMobile && <span>Plan</span>}
        </button>
        <button type="button" className={cls} onClick={() => abrirImpersonacion(t)}
          disabled={loadingImpersonar || !slug} title={`Entrar (${getEnvForTenant(slug).toUpperCase()})`}>
          <FiLogIn /> {isMobile && <span>Entrar</span>}
        </button>
        <button type="button" className={cls} onClick={() => setEstadoTarget(t)} title="Cambiar estado">
          {t.estado === "suspendido" ? <>&#128275;</> : <>&#128274;</>} {isMobile && <span>Estado</span>}
        </button>
        <button type="button" className={dangerCls} onClick={() => setDeleteTarget(t)} title="Eliminar">
          <FiTrash2 /> {isMobile && <span>Eliminar</span>}
        </button>
      </>
    );

    return isMobile ? <ActionsDropdown>{buttons}</ActionsDropdown> : <div className="tenant-actions">{buttons}</div>;
  };

  /* ── Empty state ─────────────────────── */

  if (!loading && !tenants.length) {
    return <p className="tenant-table-empty">No hay tenants registrados.</p>;
  }

  /* ── Render ──────────────────────────── */

  return (
    <section className="tenant-table">
      {alerta && <AlertaMensaje tipo={alerta.tipo} mensaje={alerta.mensaje} onClose={() => setAlerta(null)} />}

      {/* Header */}
      <header className="tenant-table__header">
        <div className="tenant-table__header-left">
          <h3 className="tenant-table__title">Tenants</h3>
          <span className="tenant-table__count">{total ?? tenants.length}</span>
        </div>
        <EnvPill mode={envLabel.mode} tenant={envLabel.tenant} />
      </header>

      {/* Loading overlay */}
      {loading && <div className="tenant-table__loading">Cargando...</div>}

      {/* Desktop table */}
      <div className="tenant-table__desktop">
        <table className="tenant-table__table">
          <thead className="tenant-table__thead">
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Creación</th>
              <th className="tenant-table__thActions">Acciones</th>
            </tr>
          </thead>
          <tbody className="tenant-table__tbody">
            {tenants.map((t) => {
              const tipo = t.tipoNegocio || "restaurante";
              const slug = t.slug || t.tenantId;
              return (
                <tr className="tenant-table__row" key={t._id}>
                  <td>
                    <span className="tenant-table__nameText">{t.nombre}</span>
                    <span className="tenant-table__slug">{slug}</span>
                  </td>
                  <td>
                    <span className={`tenant-type tenant-type--${tipo}`}>
                      {tipo === "shop" ? <FiShoppingBag /> : <FiCoffee />}
                      <span>{tipo}</span>
                    </span>
                  </td>
                  <td><span className="tenant-plan-badge">{t.plan}</span></td>
                  <td><span className={`estado-tag estado-${t.estado}`}>{t.estado}</span></td>
                  <td className="tenant-table__date">{new Date(t.createdAt).toLocaleDateString("es-ES")}</td>
                  <td className="tenant-table__cell--actions">{renderActions(t, slug, false)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="tenant-table__mobile">
        {tenants.map((t) => {
          const tipo = t.tipoNegocio || "restaurante";
          const slug = t.slug || t.tenantId;
          return (
            <div className="tenant-card" key={t._id}>
              <div className="tenant-card__top">
                <div className="tenant-card__info">
                  <span className="tenant-card__name">{t.nombre}</span>
                  <span className="tenant-card__slug">{slug}</span>
                </div>
                {renderActions(t, slug, true)}
              </div>
              <div className="tenant-card__tags">
                <span className={`tenant-type tenant-type--${tipo}`}>
                  {tipo === "shop" ? <FiShoppingBag size={12} /> : <FiCoffee size={12} />}
                  <span>{tipo}</span>
                </span>
                <span className="tenant-plan-badge">{t.plan}</span>
                <span className={`estado-tag estado-${t.estado}`}>{t.estado}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="tenant-table__pagination">
          <button disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
            <FiChevronLeft />
          </button>
          <span className="tenant-table__pageInfo">
            {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}>
            <FiChevronRight />
          </button>
        </div>
      )}

      {/* Modales */}
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
          <EditEstadoModal tenant={estadoTarget} onClose={() => setEstadoTarget(null)} onSave={handleEstadoChange} />
        </Portal>
      )}
      {planTarget && (
        <Portal>
          <EditPlanModal tenant={planTarget} onClose={() => setPlanTarget(null)} onSave={handlePlanSave} />
        </Portal>
      )}
      {impersonarTarget && (
        <Portal>
          <ModalConfirmacion
            titulo="Impersonar tenant"
            mensaje={(() => {
              const preview = impersonacionPreview;
              const name = impersonarTarget.nombre;
              const slug = (impersonarTarget.slug || impersonarTarget.tenantId || "").trim();
              const env = preview?.env || "prod";
              return `Vas a entrar como admin de "${name}" (${slug}). Modo: ${env === "sandbox" ? "SANDBOX" : "PROD"}. Motivo (mín. 20 caracteres):`;
            })()}
            placeholder="Motivo (mínimo 20 caracteres)"
            onClose={() => setImpersonarTarget(null)}
            onConfirm={confirmarImpersonacion}
          >
            <div className="tenant-impersonate">
              {!!impersonacionPreview?.mismatchWarn && (
                <div className="tenant-impersonate__warn">{impersonacionPreview.mismatchWarn}</div>
              )}
              <label className="tenant-impersonate__label">
                Categoría
                <select className="modal-input--modalconfirmacion" value={reasonCategory} onChange={(e) => setReasonCategory(e.target.value)}>
                  <option value="soporte">Soporte</option>
                  <option value="incidencia">Incidencia</option>
                  <option value="facturacion">Facturación</option>
                  <option value="configuracion">Configuración</option>
                  <option value="otro">Otro</option>
                </select>
              </label>
              {loadingImpersonar && <p className="tenant-impersonate__loading">Creando sesión…</p>}
            </div>
          </ModalConfirmacion>
        </Portal>
      )}
    </section>
  );
}
