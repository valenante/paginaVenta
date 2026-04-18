import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useConfig } from "../context/ConfigContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useFeaturesPlan } from "../context/FeaturesPlanContext";
import api from "../utils/api";
import "../styles/RestauranteConfigPage.css";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import EstacionesPanel from "../components/Config/EstacionesPanel.jsx";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import { useTenant } from "../context/TenantContext";
import PlanFeaturesPanel from "../components/Config/PlanFeaturesPanel.jsx";
import SeccionesPanel from "../components/Config/SeccionesPanel.jsx";
import IdentidadNegocioPanel from "../components/Config/IdentidadNegocioPanel.jsx";
import ErrorToast from "../components/common/ErrorToast.jsx";
import { normalizeApiError } from "../utils/normalizeApiError.js";
import { DEFAULT_TEMA_TPV, normalizarTemaTpv } from "../utils/tema";
import { DEFAULT_TEMA_SHOP, normalizarTemaShop } from "../utils/temaShop";
import TemaTpvPanel from "../components/Tema/TemaTpvPanel.jsx";
import TemaShopPanel from "../components/Tema/TemaShopPanel.jsx";

export default function RestauranteConfigPage() {
  const { config, setConfig, refreshConfig } = useConfig();
  const { user } = useAuth();
  const location = useLocation();
  const { tenant } = useTenant();

  const tipoNegocio = tenant?.tipoNegocio || "restaurante";
  const esRestaurante = tipoNegocio === "restaurante";
  const esTienda = tipoNegocio === "shop";

  const canEditConfig =
    user?.role === "superadmin" ||
    user?.role === "admin_restaurante" ||
    user?.role === "admin_shop";

  const { hasFeature } = useFeaturesPlan();
  const isPlanEsencial = !hasFeature("motor_adaptativo_cocina");

  const [form, setForm] = useState({
    branding: {},
    informacionRestaurante: { direccion: "", telefono: "" },
    colores: {},
    estilo: {},
    temaTpv: { ...DEFAULT_TEMA_TPV },
    temaShop: { ...DEFAULT_TEMA_SHOP },

    slaMesas: {
      activo: true,
      fallbackMinutosMax: 10,
      margenGraciaSegundos: 60,
      porcentajeAvisoRiesgo: 80,
      cooldownAvisoMinutos: 5,
      proximosMax: 3,
      factorOcupacionK: 0.35,
    },

    capacidadEstaciones: {
      intervaloRevisionSegundos: 10,
      pesosSeccion: { 0: 1.0, 1: 0.6, 2: 0.3 },
      pesoDefault: 0.15,
    },
  });

  const [saving, setSaving] = useState(false);
  const [alerta, setAlerta] = useState(null);

  const [verifactuEnabled, setVerifactuEnabled] = useState(false);
  const [verifactuLoaded, setVerifactuLoaded] = useState(false);

  // Modal confirmación (con motivo)
  const [confirm, setConfirm] = useState(null);
  // confirm: { mode: "save"|"rollback", reason: string }

  const initialRef = useRef(null);

  // Cargar config en el formulario (y snapshot base para detectar cambios)
  useEffect(() => {
    if (!config) return;

    const nextForm = {
      branding: config.branding || {},
      informacionRestaurante: config.informacionRestaurante || {},
      colores: config.colores || {},
      estilo: config.estilo || {},
      temaTpv: normalizarTemaTpv(config.temaTpv),
      temaShop: normalizarTemaShop(config.temaShop),
      slaMesas: config.slaMesas || form.slaMesas,
      capacidadEstaciones: config.capacidadEstaciones || form.capacidadEstaciones,
    };

    setForm((prev) => ({ ...prev, ...nextForm }));

    // Snapshot: solo los campos editables (mismos que el patch de guardado)
    initialRef.current = JSON.stringify({
      branding: nextForm.branding,
      informacionRestaurante: nextForm.informacionRestaurante,
      colores: nextForm.colores,
      estilo: nextForm.estilo,
      temaTpv: nextForm.temaTpv,
      temaShop: nextForm.temaShop,
      slaMesas: nextForm.slaMesas,
      capacidadEstaciones: nextForm.capacidadEstaciones,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const hasChanges = useMemo(() => {
    if (!initialRef.current) return true; // si no hay snapshot, permitir guardar
    try {
      // Compare only the keys we care about (same as nextForm/patch)
      const compare = (obj) => JSON.stringify({
        branding: obj.branding,
        informacionRestaurante: obj.informacionRestaurante,
        colores: obj.colores,
        estilo: obj.estilo,
        temaTpv: obj.temaTpv,
        temaShop: obj.temaShop,
        slaMesas: obj.slaMesas,
        capacidadEstaciones: obj.capacidadEstaciones,
      });
      return compare(form) !== initialRef.current;
    } catch {
      return true;
    }
  }, [form]);

  // Estado de VeriFactu (solo badge)
  useEffect(() => {
    const checkVerifactu = async () => {
      try {
        const { data } = await api.get("/admin/verifactu/verifactu");
        setVerifactuEnabled(!!data.enabled);
      } catch (err) {
        console.error("[RestauranteConfig] Error obteniendo estado VeriFactu:", err?.message);
      } finally {
        setVerifactuLoaded(true);
      }
    };
    checkVerifactu();
  }, []);

  // ===== Guardrails SAVE (draft -> apply) =====
  const handleSave = async (reason = "Aplicar configuración general") => {
    try {
      setSaving(true);

      const patch = {
        branding: form.branding,
        informacionRestaurante: form.informacionRestaurante,
        colores: form.colores,
        estilo: form.estilo,
        temaTpv: form.temaTpv,
        temaShop: form.temaShop,
        slaMesas: form.slaMesas,
        capacidadEstaciones: form.capacidadEstaciones,
      };

      const { data: draft } = await api.post("/admin/config/versions", {
        patch,
        scope: "restaurante_config_general",
        reason: reason || "Cambio configuración general",
      });

      const versionId = draft?.version?.id || draft?.versionId || draft?.id;
      if (!versionId) {
        throw new Error("No se recibió versionId del draft");
      }

      await api.post(`/admin/config/versions/${versionId}/apply`, {
        reason: reason || "Aplicar configuración general",
      });

      await refreshConfig();

      setAlerta({ tipo: "success", mensaje: "Configuración aplicada correctamente ✅" });
    } catch (err) {
      const error = normalizeApiError(err);
      setAlerta({
        tipo: "error",
        code: error.code,
        message: error.message,
        requestId: error.requestId,
        action: error.action,
        retryAfter: error.retryAfter,
        canRetry: error.canRetry,
        kind: error.kind,
      });
    } finally {
      setSaving(false);
    }
  };

  // ===== Guardrails ROLLBACK =====
  const handleRollback = async (reason = "Rollback desde panel de configuración") => {
    try {
      setSaving(true);

      await api.post("/admin/config/rollback", { reason });
      await refreshConfig();

      setAlerta({ tipo: "success", mensaje: "Rollback aplicado ✅" });
    } catch (err) {
      const error = normalizeApiError(err);
      setAlerta({
        tipo: "error",
        code: error.code,
        message: error.message,
        requestId: error.requestId,
        action: error.action,
        retryAfter: error.retryAfter,
        canRetry: error.canRetry,
        kind: error.kind,
      });
    } finally {
      setSaving(false);
    }
  };

  // ===== Upload logo (esto puede quedarse como está; no pasa por guardrails) =====
  const handleFileUpload = async (file) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const uploadEndpoint = esTienda ? "/shop/configuracion/logo" : "/configuracion/logo";

      const { data } = await api.post(uploadEndpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForm((prev) => ({
        ...prev,
        branding: { ...prev.branding, logoUrl: data.logoUrl },
      }));

      // si tu backend devuelve config, refresca el contexto
      if (data?.config) setConfig(data.config);

      setAlerta({ tipo: "success", mensaje: "Logo actualizado correctamente ✅" });
    } catch (err) {
      const error = normalizeApiError(err);
      setAlerta({
        tipo: "error",
        code: error.code,
        message: error.message,
        requestId: error.requestId,
        action: error.action,
        retryAfter: error.retryAfter,
        canRetry: error.canRetry,
        kind: error.kind,
      });
    }
  };

  // ===== Modal openers =====
  const openSaveConfirm = () => setConfirm({ mode: "save", reason: "" });
  const openRollbackConfirm = () => setConfirm({ mode: "rollback", reason: "" });

  const verifactuBadge =
    verifactuLoaded &&
    (verifactuEnabled ? (
      <span className="badge badge-exito">VeriFactu activo</span>
    ) : (
      <span className="badge badge-aviso">VeriFactu pendiente</span>
    ));

  // ===== Helpers UI =====
  const saveDisabledReason = !canEditConfig
    ? "No tienes permisos para editar configuración"
    : !hasChanges
      ? "No hay cambios para guardar"
      : "";

  return (
    <main className="rest-config-page cfg-page cfg-page--fixed-bar section section--wide">
      {alerta?.tipo === "error" && (
        <ErrorToast
          error={alerta}
          onRetry={alerta?.canRetry ? () => openSaveConfirm() : null}
          onClose={() => setAlerta(null)}
        />
      )}

      {alerta?.tipo === "success" && (
        <AlertaMensaje
          tipo="success"
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

      {/* Modal de confirmación con motivo */}
      {confirm && (
        <ModalConfirmacion
          // Ajusta estos props a tu ModalConfirmacion real si difieren
          titulo={confirm.mode === "save" ? "Aplicar cambios" : "Confirmar rollback"}
          mensaje="Escribe un motivo (se guardará en el historial)."
          modo="prompt"
          placeholder="Motivo (obligatorio para cambios críticos)"
          valor={confirm.reason}
          onChange={(v) => setConfirm((p) => ({ ...p, reason: v }))}
          confirmarTexto={confirm.mode === "save" ? "APLICAR" : "REVERTIR"}
          cancelarTexto="CANCELAR"
          onConfirm={() => {
            const r =
              (confirm.reason || "").trim() ||
              (confirm.mode === "save" ? "Aplicar configuración general" : "Rollback desde panel");

            const mode = confirm.mode;
            console.log("[CONFIG] Modal confirmed, mode:", mode, "reason:", r);
            setConfirm(null);

            if (mode === "save") handleSave(r);
            else handleRollback(r);
          }}
          onCancel={() => setConfirm(null)}
          onClose={() => setConfirm(null)}
        />
      )}

      {/* Header global */}
      <header className="rest-config-header cfg-header">
        <div>
          <h1>⚙️ Configuración {esTienda ? "de la shop" : "del restaurante"}</h1>
          <p className="text-suave">
            Define la identidad visual y las funcionalidades de tu entorno Alef.
          </p>
        </div>
        <div className="rest-config-header-status">{verifactuBadge}</div>
      </header>

      <div className="rest-config-layout cfg-layout">
        {/* COLUMNA PRINCIPAL */}
        <div className="rest-config-main cfg-main">
          <IdentidadNegocioPanel
            form={form}
            setForm={setForm}
            esTienda={esTienda}
            onUploadLogo={handleFileUpload}
          />

          {/* === APARIENCIA === */}
          {esRestaurante && (
            <TemaTpvPanel
              temaTpv={form.temaTpv}
              setTemaTpv={(updater) =>
                setForm((prev) => ({
                  ...prev,
                  temaTpv: typeof updater === "function" ? updater(prev.temaTpv) : updater,
                }))
              }
            />
          )}

          {esTienda && (
            <TemaShopPanel
              temaShop={form.temaShop}
              setTemaShop={(updater) =>
                setForm((prev) => ({
                  ...prev,
                  temaShop: typeof updater === "function" ? updater(prev.temaShop) : updater,
                }))
              }
            />
          )}

          <PlanFeaturesPanel onAlert={setAlerta} />

          {esRestaurante && (
            <SeccionesPanel isPlanEsencial={isPlanEsencial} onAlert={setAlerta} />
          )}

          {esRestaurante && (
            <EstacionesPanel isPlanEsencial={isPlanEsencial} onAlert={setAlerta} />
          )}

        </div>
      </div>

      {/* BARRA DE ACCIONES INFERIOR */}
      <div className="rest-config-actions cfg-actions-bar">
        <button
          type="button"
          className="btn btn-primario"
          onClick={openSaveConfirm}
          disabled={saving || !canEditConfig}
          title={saveDisabledReason}
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>

        <button
          type="button"
          className="btn btn-secundario"
          onClick={openRollbackConfirm}
          disabled={saving || !canEditConfig}
          title={!canEditConfig ? "No tienes permisos para editar configuración" : ""}
        >
          Revertir último cambio
        </button>
      </div>
    </main>
  );
}