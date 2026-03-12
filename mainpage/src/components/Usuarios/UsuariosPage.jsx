// src/components/Usuarios/UsuariosPage.jsx ✅ PERFECTO (UX Errors PRO)
// - OK/avisos: AlertaMensaje
// - Errores backend: ErrorToast (normalizeApiError vía hook useUsuarios)
// Requiere: useUsuarios() actualizado para devolver { ok, error } (error normalizado)

import React, { useCallback, useState } from "react";
import { useUsuarios } from "./useUsuarios";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";

import UpsellEstadisticasUsuarios from "../Usuarios/UpsellEstadisticasUsuarios";
import UsuarioCreateForm from "./UsuarioCreateForm.jsx";
import UsuariosTable from "./UsuariosTable.jsx";
import UsuarioEditModal from "./UsuarioEditModal.jsx";
import UsuarioStatsModal from "./UsuariosStatsModal.jsx";
import ModalConfirmacion from "../Modal/ModalConfirmacion";

import UsuarioPermisosModal from "./UsuarioPermisosModal.jsx";
import AlertaMensaje from "../AlertaMensaje/AlertaMensaje";
import ErrorToast from "../common/ErrorToast.jsx";

import "./UsuariosPage.css";

export default function UsuariosPage() {
  const {
    usuarios,
    permisosDisponibles,
    rolesConfig,
    loading,
    cargarUsuarios,
    crearUsuario,
    eliminarUsuario,
    editarUsuario,
    actualizarPermisosUsuario, // (si lo activas luego)
  } = useUsuarios();

  // OK / avisos
  const [alerta, setAlerta] = useState(null);

  // KO (contrato)
  const [errorToast, setErrorToast] = useState(null);

  // Modales
  const [usuarioEdit, setUsuarioEdit] = useState(null);
  const [usuarioStats, setUsuarioStats] = useState(null);
  const [usuarioPermisos, setUsuarioPermisos] = useState(null); // (por si lo reactivas)
  const [deletingId, setDeletingId] = useState(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  const { user } = useAuth();
  const { tenant } = useTenant();

  const tipoNegocio = tenant?.tipoNegocio || "restaurante";

  const isPlanEsencial =
    tipoNegocio === "restaurante" &&
    (user?.plan === "esencial" || user?.plan === "tpv-esencial");

  const showOk = (mensaje) => setAlerta({ tipo: "exito", mensaje });
  const showWarn = (mensaje) => setAlerta({ tipo: "warn", mensaje });

  const showErr = (errNormalized, fallback = "No se pudo completar la operación.") => {
    // errNormalized ya viene de normalizeApiError en el hook
    if (!errNormalized) {
      setErrorToast({
        status: null,
        code: "UNKNOWN",
        message: fallback,
        requestId: "—",
        action: "CONTACT_SUPPORT",
        retryAfter: null,
        fields: null,
        kind: "unknown",
        canRetry: false,
      });
      return;
    }
    setErrorToast({
      ...errNormalized,
      message: errNormalized.message || fallback,
    });
  };

  const onRetry = useCallback(() => {
    cargarUsuarios?.();
  }, [cargarUsuarios]);

  const onCrear = async (payload) => {
    setErrorToast(null);
    const r = await crearUsuario(payload);

    if (r.ok) showOk("Usuario creado.");
    else showErr(r.error, "No se pudo crear el usuario.");

    return r;
  };

  const onEliminarClick = (usuario) => {
    setUsuarioAEliminar(usuario);
  };

  const onEditar = async (id, payload) => {
    setErrorToast(null);
    const r = await editarUsuario(id, payload);

    if (r.ok) showOk("Usuario actualizado.");
    else showErr(r.error, "No se pudo actualizar el usuario.");
  };

  return (
    <div className="usuarios-root usuarios-layout">
      {/* ERROR TOAST (KO) */}
      {errorToast && (
        <ErrorToast
          error={errorToast}
          onRetry={errorToast.canRetry ? onRetry : undefined}
          onClose={() => setErrorToast(null)}
        />
      )}

      {/* ALERTA OK / avisos */}
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

      {/* === Info / Cómo funciona === */}
      <section className="usuarios-info">
        <div className="usuarios-info-header">
          <h1 className="usuarios-info-title">Usuarios del restaurante</h1>
          <p className="usuarios-info-subtitle">
            Desde aquí gestionas el equipo que usa el TPV: crea usuarios, edítalos, elimina accesos y revisa estadísticas.
          </p>
        </div>

        <div className="usuarios-info-cards">
          <article className="usuarios-info-card">
            <h3>➕ Crear usuarios</h3>
            <p>
              Da de alta a camareros, cocina, barra o administración. El usuario podrá iniciar sesión
              y acceder según el rol y permisos asignados.
            </p>
            <p className="usuarios-info-note">
              Recomendación: usa nombres claros (ej. “Camarero 1”, “Cocina”, “Barra”).
            </p>
          </article>

          <article className="usuarios-info-card">
            <h3>✏️ Editar usuarios</h3>
            <p>
              Modifica nombre, rol o permisos cuando cambie la operativa del equipo. Los cambios se aplican
              al instante en el TPV.
            </p>
            <p className="usuarios-info-note">
              Ideal para rotaciones o nuevas responsabilidades.
            </p>
          </article>

          <article className="usuarios-info-card">
            <h3>🗑️ Eliminar usuarios</h3>
            <p>
              Elimina accesos cuando alguien deja de trabajar o ya no necesita entrar al sistema.
              Esta acción es irreversible.
            </p>
            <p className="usuarios-info-note">
              Antes de eliminar, confirma que no sea una cuenta necesaria (ej. “Caja”).
            </p>
          </article>

          <article className="usuarios-info-card">
            <h3>📊 Ver estadísticas</h3>
            <p>
              Revisa estadísticas individuales para entender el rendimiento y la actividad:
              quién gestiona más acciones, uso del TPV y métricas disponibles por usuario.
            </p>
            <p className="usuarios-info-note">
              Puedes abrir estadísticas desde la tabla de usuarios.
            </p>
          </article>
        </div>
      </section>

      <div className="usuarios-grid">
        <div className="usuarios-col usuarios-col-create">
          <UsuarioCreateForm onCrear={onCrear} />

          {isPlanEsencial && (
            <div style={{ marginTop: "1.2rem" }}>
              <UpsellEstadisticasUsuarios />
            </div>
          )}
        </div>

        <div className="usuarios-col usuarios-col-table">
          <UsuariosTable
            usuarios={usuarios}
            onEditar={setUsuarioEdit}
            onEliminar={onEliminarClick}
            onStats={setUsuarioStats}
            onPermisos={setUsuarioPermisos}
            isPlanEsencial={isPlanEsencial}
            deletingId={deletingId}
          />

          {loading && (
            <div style={{ marginTop: 10, opacity: 0.8 }}>
              Cargando…
            </div>
          )}
        </div>
      </div>

      {/* Modal editar */}
      {usuarioEdit && (
        <UsuarioEditModal
          usuario={usuarioEdit}
          onSave={onEditar}
          onClose={() => setUsuarioEdit(null)}
        />
      )}

      {/* Modal stats */}
      {usuarioStats && (
        <UsuarioStatsModal
          usuario={usuarioStats}
          onClose={() => setUsuarioStats(null)}
        />
      )}

      {usuarioPermisos && (
        <UsuarioPermisosModal
          usuario={usuarioPermisos}
          permisosDisponibles={permisosDisponibles}
          rolesConfig={rolesConfig}
          onSave={actualizarPermisosUsuario}
          onClose={() => setUsuarioPermisos(null)}
        />
      )}

      {/* Confirmación eliminar */}
      {usuarioAEliminar && (
        <ModalConfirmacion
          titulo="Desactivar usuario"
          mensaje={`¿Seguro que quieres desactivar a "${usuarioAEliminar.name}"? Perderá acceso al TPV inmediatamente. Podrás reactivarlo más adelante.`}
          onClose={() => setUsuarioAEliminar(null)}
          onConfirm={async () => {
            setErrorToast(null);
            setDeletingId(usuarioAEliminar._id);

            const r = await eliminarUsuario(usuarioAEliminar._id);

            if (r.ok) showOk("Usuario desactivado.");
            else showErr(r.error, "Error al desactivar el usuario.");

            setDeletingId(null);
            setUsuarioAEliminar(null);
          }}
        />
      )}
    </div>
  );
}