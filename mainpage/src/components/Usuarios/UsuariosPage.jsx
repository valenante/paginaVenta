import React, { useState } from "react";
import { useUsuarios } from "./useUsuarios";
import { useAuth } from "../../context/AuthContext";
import UpsellEstadisticasUsuarios from "../Usuarios/UpsellEstadisticasUsuarios";
import { useTenant } from "../../context/TenantContext";
import UsuarioCreateForm from "./UsuarioCreateForm.jsx";
import UsuariosTable from "./UsuariosTable.jsx";
import UsuarioEditModal from "./UsuarioEditModal.jsx";
import UsuarioStatsModal from "./UsuariosStatsModal.jsx";
import ModalConfirmacion from "../Modal/ModalConfirmacion";

import AlertaMensaje from "../AlertaMensaje/AlertaMensaje";

import "./UsuariosPage.css";

export default function UsuariosPage() {
  const {
    usuarios,
    permisosDisponibles,
    rolesConfig,
    crearUsuario,
    eliminarUsuario,
    editarUsuario,
    actualizarPermisosUsuario,
  } = useUsuarios();

  const [alerta, setAlerta] = useState(null);

  // Estado modales
  const [usuarioEdit, setUsuarioEdit] = useState(null);
  const [usuarioStats, setUsuarioStats] = useState(null);
  const [usuarioPermisos, setUsuarioPermisos] = useState(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const { user } = useAuth();

  const { tenant } = useTenant();
  const tipoNegocio = tenant?.tipoNegocio || "restaurante";

  const isPlanEsencial =
    tipoNegocio === "restaurante" &&
    (user?.plan === "esencial" || user?.plan === "tpv-esencial");

  const onCrear = async (payload) => {
    const r = await crearUsuario(payload);
    if (r.ok) setAlerta({ tipo: "exito", mensaje: "Usuario creado!" });
    else setAlerta({ tipo: "error", mensaje: r.error });
  };

  const onEliminar = (usuario) => {
    setUsuarioAEliminar(usuario);
  };

  const onEditar = async (id, payload) => {
    const r = await editarUsuario(id, payload);
    if (r.ok)
      setAlerta({ tipo: "exito", mensaje: "Usuario actualizado!" });
    else
      setAlerta({ tipo: "error", mensaje: r.error });
  };

  return (
    <div className="usuarios-root usuarios-layout">

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
            onEliminar={onEliminar}
            onStats={setUsuarioStats}
            onPermisos={setUsuarioPermisos}
            isPlanEsencial={isPlanEsencial}
          />
        </div>

      </div>


      {/* Modal editar */}
      {usuarioEdit && (
        <UsuarioEditModal
          usuario={usuarioEdit}
          permisosDisponibles={permisosDisponibles}
          rolesConfig={rolesConfig}
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
      {/*{usuarioPermisos && (
        <UsuarioPermisosModal
          usuario={usuarioPermisos}
          permisosDisponibles={permisosDisponibles}
          rolesConfig={rolesConfig}
          onSave={actualizarPermisosUsuario}
          onClose={() => setUsuarioPermisos(null)}
        />
      )} */}{usuarioAEliminar && (
        <ModalConfirmacion
          titulo="Eliminar usuario"
          mensaje={`¿Seguro que quieres eliminar al usuario "${usuarioAEliminar.name}"? Esta acción no se puede deshacer.`}
          onClose={() => setUsuarioAEliminar(null)}
          onConfirm={async () => {
            const ok = await eliminarUsuario(usuarioAEliminar._id);

            setAlerta({
              tipo: ok ? "exito" : "error",
              mensaje: ok ? "Usuario eliminado" : "Error al eliminar",
            });

            setUsuarioAEliminar(null);
          }}
        />
      )}

    </div>
  );
}
