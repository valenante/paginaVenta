// src/components/Usuarios/UsuariosPage.jsx
import React, { useCallback, useState } from "react";
import { useUsuarios } from "./useUsuarios";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { useFeaturesPlan } from "../../context/FeaturesPlanContext";

import UpsellEstadisticasUsuarios from "../Usuarios/UpsellEstadisticasUsuarios";
import EquipoDashboard from "./EquipoDashboard";
import UsuarioCreateForm from "./UsuarioCreateForm.jsx";
import UsuariosTable from "./UsuariosTable.jsx";
import UsuarioEditModal from "./UsuarioEditModal.jsx";
import UsuarioStatsModal from "./UsuariosStatsModal.jsx";
import ModalConfirmacion from "../Modal/ModalConfirmacion";

import UsuarioPermisosModal from "./UsuarioPermisosModal.jsx";
import AlertaMensaje from "../AlertaMensaje/AlertaMensaje";
import ErrorToast from "../common/ErrorToast.jsx";

import UsuariosEliminados from "./UsuariosEliminados";
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
    actualizarPermisosUsuario,
  } = useUsuarios();

  // OK / avisos
  const [alerta, setAlerta] = useState(null);

  // KO (contrato)
  const [errorToast, setErrorToast] = useState(null);

  // Modales
  const [showCreate, setShowCreate] = useState(false);
  const [usuarioEdit, setUsuarioEdit] = useState(null);
  const [usuarioStats, setUsuarioStats] = useState(null);
  const [usuarioPermisos, setUsuarioPermisos] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  const { user } = useAuth();
  const { tenant } = useTenant();

  const tipoNegocio = tenant?.tipoNegocio || "restaurante";

  const { hasFeature } = useFeaturesPlan();
  const isPlanEsencial = !hasFeature("motor_adaptativo_cocina");

  const showOk = (mensaje) => setAlerta({ tipo: "exito", mensaje });

  const showErr = (errNormalized, fallback = "No se pudo completar la operación.") => {
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
    <main className="cfg-page section section--wide">
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

      {/* === Header === */}
      <header className="cfg-header">
        <div>
          <h1>Usuarios del restaurante</h1>
          <p className="text-suave">
            Desde aquí gestionas el equipo que usa el TPV: crea usuarios, edítalos, elimina accesos y revisa estadísticas.
          </p>
        </div>

        <button
          className="usuarios-btn-nuevo"
          onClick={() => setShowCreate(true)}
        >
          + Nuevo usuario
        </button>
      </header>

      {/* === Info / Cómo funciona === */}
      <section className="usuarios-info">
        <div className="usuarios-info-header">
          <h2 className="usuarios-info-title">Cómo funciona</h2>
          <p className="usuarios-info-subtitle">
            Gestiona el acceso de tu equipo al sistema.
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
              Recomendación: usa nombres claros (ej. "Camarero 1", "Cocina", "Barra").
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
              Antes de eliminar, confirma que no sea una cuenta necesaria (ej. "Caja").
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

      {/* === Tabla (ancho completo) === */}
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
        <div className="usuarios-loading">Cargando…</div>
      )}

      {isPlanEsencial && (
        <div className="usuarios-upsell-wrap">
          <UpsellEstadisticasUsuarios />
        </div>
      )}

      {/* Usuarios eliminados */}
      <UsuariosEliminados onRestored={cargarUsuarios} />

      {/* Dashboard equipo */}
      {!isPlanEsencial && <EquipoDashboard />}

      {/* Modal crear */}
      {showCreate && (
        <UsuarioCreateForm
          onCrear={onCrear}
          onClose={() => setShowCreate(false)}
        />
      )}

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
    </main>
  );
}
