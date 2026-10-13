import { useEffect, useMemo, useReducer, useState } from "react";
import { useConfig } from "../context/ConfigContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api";
import "../styles/RestauranteConfigPage.css";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ErrorToast from "../components/common/ErrorToast.jsx";
import IdentidadNegocioPanel from "../components/Config/IdentidadNegocioPanel.jsx";
import TemaShopPanel from "../components/Tema/TemaShopPanel.jsx";
import { normalizeApiError } from "../utils/normalizeApiError.js";
import { DEFAULT_TEMA_SHOP, normalizarTemaShop } from "../utils/temaShop";

/*
 * Configuración de TIENDA (lote PANEL-CONFIG-TIENDA).
 *
 * Endpoints que usa, todos válidos para tiendas:
 *   GET  /shop/configuracion                    lectura, vía ConfigContext
 *   POST /shop/configuracion/logo               logo
 *   POST /admin/config/versions                 draft del guardado (scope tienda)
 *   POST /admin/config/versions/:id/apply       aplicar el draft
 * NO usa /configuracion, /autopilot, /admin/features-plan ni /admin/verifactu (son de restaurante
 * o de otra pantalla). NO usa PUT /shop/configuracion: rechaza el objeto temaShop y no persiste
 * dirección ni teléfono (ver informe del lote).
 */

const SCOPE_TIENDA = "tienda_config_general";
// Mismos límites que actualizarConfiguracionShopSchema (configAdmin.schemas.js). Si cambian allí, cambian aquí.
const MAX_TELEFONO = 30;
const MAX_DIRECCION = 300;

const texto = (valor) => String(valor ?? "").trim();

/** Forma del formulario: la misma que esperan IdentidadNegocioPanel y TemaShopPanel. */
function formularioDesde(config) {
  return {
    branding: { ...(config?.branding || {}) },
    informacionRestaurante: {
      telefono: config?.informacionRestaurante?.telefono ?? "",
      direccion: config?.informacionRestaurante?.direccion ?? "",
    },
    temaShop: normalizarTemaShop(config?.temaShop),
  };
}

/**
 * Valores editables con RUTA COMPLETA (con punto). Un patch con rutas con punto sólo toca esa
 * hoja: no pisa hermanos (configVersions.service.js setByPath). Por eso no se envían objetos enteros.
 */
function valoresEditables(form) {
  const valores = {
    "branding.nombreRestaurante": texto(form?.branding?.nombreRestaurante),
    "informacionRestaurante.telefono": texto(form?.informacionRestaurante?.telefono),
    "informacionRestaurante.direccion": texto(form?.informacionRestaurante?.direccion),
  };
  for (const clave of Object.keys(DEFAULT_TEMA_SHOP)) {
    valores[`temaShop.${clave}`] = form?.temaShop?.[clave] ?? DEFAULT_TEMA_SHOP[clave];
  }
  return valores;
}

/** Sólo lo que ha cambiado respecto a lo guardado. Es el patch que se envía. */
function cambiosRespecto(guardado, actual) {
  const base = valoresEditables(guardado);
  const ahora = valoresEditables(actual);
  const cambios = {};
  for (const ruta of Object.keys(ahora)) {
    if (ahora[ruta] !== base[ruta]) cambios[ruta] = ahora[ruta];
  }
  return cambios;
}

function errorDeValidacion(form) {
  if (!texto(form?.branding?.nombreRestaurante)) return "El nombre de la tienda no puede estar vacío.";
  if (texto(form?.informacionRestaurante?.telefono).length > MAX_TELEFONO) {
    return `El teléfono no puede tener más de ${MAX_TELEFONO} caracteres.`;
  }
  if (texto(form?.informacionRestaurante?.direccion).length > MAX_DIRECCION) {
    return `La dirección no puede tener más de ${MAX_DIRECCION} caracteres.`;
  }
  return null;
}

/**
 * Estado del formulario: `form` (lo que ve y edita el usuario) y `guardado` (lo último que
 * confirmó el servidor). «Descartar» vuelve a `guardado`; «hay cambios» es `form ≠ guardado`.
 */
function reducirFormulario(estado, accion) {
  switch (accion.tipo) {
    case "sincronizar": {
      // Llega config nueva del servidor. Si el usuario tiene cambios sin guardar, se conservan;
      // lo que cambia es la base contra la que se miden.
      const sinCambios = !estado || Object.keys(cambiosRespecto(estado.guardado, estado.form)).length === 0;
      const nueva = JSON.parse(JSON.stringify(accion.form));
      return {
        form: sinCambios ? JSON.parse(JSON.stringify(accion.form)) : estado.form,
        guardado: nueva,
      };
    }
    case "editar":
      return estado ? { ...estado, form: accion.actualizar(estado.form) } : estado;
    case "descartar":
      return estado ? { ...estado, form: JSON.parse(JSON.stringify(estado.guardado)) } : estado;
    case "logo": {
      // El logo se guarda al subirlo (no pasa por draft): cuenta como guardado en las dos copias.
      if (!estado) return estado;
      return {
        form: { ...estado.form, branding: { ...estado.form.branding, logoUrl: accion.logoUrl } },
        guardado: { ...estado.guardado, branding: { ...estado.guardado.branding, logoUrl: accion.logoUrl } },
      };
    }
    default:
      return estado;
  }
}

const AVISO_RECARGA =
  "El cambio se aplicó, pero no se pudo recargar la configuración. Recarga la página antes de seguir editando.";

export default function TiendaConfigPage() {
  const { config, setConfig, refreshConfig, loading } = useConfig();
  const { user, hasPermission } = useAuth();

  const canEditConfig =
    user?.role === "superadmin" ||
    user?.role === "admin_shop" ||
    hasPermission("config.edit");

  const [estado, dispatch] = useReducer(reducirFormulario, config, (cfg) =>
    cfg ? { form: formularioDesde(cfg), guardado: formularioDesde(cfg) } : null
  );

  const [saving, setSaving] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [confirm, setConfirm] = useState(null); // { modo: "guardar" }

  // Cada config nueva del servidor (carga, guardado, logo) sincroniza el formulario.
  useEffect(() => {
    if (config) dispatch({ tipo: "sincronizar", form: formularioDesde(config) });
  }, [config]);

  const form = estado?.form ?? null;
  const cambios = useMemo(
    () => (estado ? cambiosRespecto(estado.guardado, estado.form) : {}),
    [estado]
  );
  const hayCambios = Object.keys(cambios).length > 0;
  const configLista = Boolean(config && estado);
  const puedeGuardar = canEditConfig && configLista && hayCambios && !saving;
  const motivoBloqueo = !canEditConfig
    ? "No tienes permisos para editar la configuración"
    : !configLista
      ? "La configuración aún no se ha cargado"
      : !hayCambios
        ? "No hay cambios para guardar"
        : "";

  const mostrarError = (err) => {
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
  };

  const mostrarAvisoRecarga = () =>
    setAlerta({
      tipo: "error",
      code: "REFRESH_FAILED",
      message: AVISO_RECARGA,
      requestId: null,
      action: "REFRESH",
      kind: "client",
    });

  // P-453 · PENDIENTE DE DECISIÓN: el guardado de tienda va por draft + apply de /admin/config/versions.
  // No se cambia hasta decidirlo.
  const guardar = async (motivo) => {
    if (!form || !hayCambios) return;
    const razon = motivo || "Aplicar configuración de tienda";

    const avisoValidacion = errorDeValidacion(form);
    if (avisoValidacion) {
      setAlerta({
        tipo: "error",
        code: "VALIDATION",
        message: avisoValidacion,
        requestId: null,
        action: "FIX_INPUT",
        kind: "validation",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: draft } = await api.post("/admin/config/versions", {
        patch: cambios,
        scope: SCOPE_TIENDA,
        reason: razon,
      });
      const versionId = draft?.version?.id || draft?.versionId || draft?.id;
      if (!versionId) throw new Error("No se recibió versionId del draft");
      await api.post(`/admin/config/versions/${versionId}/apply`, { reason: razon });
    } catch (err) {
      mostrarError(err);
      setSaving(false);
      return;
    }

    try {
      await refreshConfig();
      setAlerta({ tipo: "success", mensaje: "Configuración de la tienda guardada ✅" });
    } catch {
      mostrarAvisoRecarga();
    } finally {
      setSaving(false);
    }
  };

  const subirLogo = async (file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const { data } = await api.post("/shop/configuracion/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch({ tipo: "logo", logoUrl: data.logoUrl });
      if (data?.config) setConfig(data.config);
      setAlerta({ tipo: "success", mensaje: "Logo actualizado correctamente ✅" });
    } catch (err) {
      mostrarError(err);
    }
  };

  const reintentarCarga = async () => {
    try {
      await refreshConfig();
    } catch (err) {
      mostrarError(err);
    }
  };

  const confirmarModal = (motivo) => {
    setConfirm(null);
    guardar(motivo);
  };

  const actualizarFormulario = (actualizar) => dispatch({ tipo: "editar", actualizar });

  const cuerpo = configLista ? (
    <div className="rest-config-layout cfg-layout">
      <div className="rest-config-main cfg-main">
        <IdentidadNegocioPanel
          form={form}
          setForm={actualizarFormulario}
          esTienda
          onUploadLogo={subirLogo}
        />

        <TemaShopPanel
          temaShop={form.temaShop}
          setTemaShop={(actualizar) =>
            actualizarFormulario((prev) => ({
              ...prev,
              temaShop: typeof actualizar === "function" ? actualizar(prev.temaShop) : actualizar,
            }))
          }
        />
      </div>
    </div>
  ) : (
    <section className="config-card card">
      <header className="config-card-header">
        <div>
          <h2>Estado de la configuración</h2>
          {loading ? (
            <p className="config-card-subtitle">Cargando configuración de la tienda…</p>
          ) : (
            <>
              <p className="config-card-subtitle">
                No se pudo cargar la configuración de la tienda. Revisa la conexión e inténtalo de nuevo.
              </p>
              <button type="button" className="btn btn-secundario" onClick={reintentarCarga}>
                Reintentar
              </button>
            </>
          )}
        </div>
      </header>
    </section>
  );

  return (
    <main className="rest-config-page cfg-page cfg-page--fixed-bar section section--wide">
      {alerta?.tipo === "error" && (
        <ErrorToast
          error={alerta}
          onRetry={alerta?.canRetry ? () => setConfirm({ modo: "guardar" }) : null}
          onClose={() => setAlerta(null)}
        />
      )}

      {alerta?.tipo === "success" && (
        <AlertaMensaje tipo="success" mensaje={alerta.mensaje} onClose={() => setAlerta(null)} />
      )}

      {confirm && (
        <ModalConfirmacion
          titulo="Aplicar cambios"
          mensaje="Escribe un motivo si quieres. Queda en el historial de cambios."
          placeholder="Motivo del cambio (opcional)"
          textoConfirmar="APLICAR"
          onConfirm={confirmarModal}
          onClose={() => setConfirm(null)}
        />
      )}

      <header className="rest-config-header cfg-header">
        <div>
          <h1>Configuración de la tienda</h1>
          <p className="text-suave">
            Define el nombre, los datos de contacto y la apariencia de tu tienda online.
          </p>
        </div>
        <div className="rest-config-header-status">
          {configLista && hayCambios && <span className="badge badge-aviso">Cambios sin guardar</span>}
        </div>
      </header>

      {cuerpo}

      <div className="rest-config-actions cfg-actions-bar">
        <button
          type="button"
          className="btn btn-primario"
          onClick={() => setConfirm({ modo: "guardar" })}
          disabled={!puedeGuardar}
          title={puedeGuardar ? "" : motivoBloqueo}
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>

        {configLista && hayCambios && (
          <button type="button" className="btn btn-secundario" onClick={() => dispatch({ tipo: "descartar" })} disabled={saving}>
            Descartar cambios
          </button>
        )}
      </div>
    </main>
  );
}
