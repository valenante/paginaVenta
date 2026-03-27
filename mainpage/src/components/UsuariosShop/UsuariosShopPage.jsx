import React, { useState } from "react";
import { useUsuarios } from "./useUsuarios.jsx";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";

import UsuarioCreateForm from "./UsuarioCreateForm.jsx";
import UsuarioTableShop from "./UsuarioTableShop.jsx";

import UsuarioEditModal from "./UsuarioEditModalShop.jsx";
import UsuarioPermisosModal from "./UsuarioPermisosModalShop.jsx";
import UsuarioStatsModal from "./UsuariosStatsModal.jsx";

import AlertaMensaje from "../AlertaMensaje/AlertaMensaje";

import "./UsuariosPage.css";

export default function UsuariosShopPage() {
  const {
    usuarios,
    permisosDisponibles,
    rolesConfig,
    crearUsuario,
    eliminarUsuario,
    editarUsuario,
    actualizarPermisosUsuario,
  } = useUsuarios();

  /* =====================
     ESTADO GLOBAL
  ===================== */
  const [alerta, setAlerta] = useState(null);

  const [usuarioEdit, setUsuarioEdit] = useState(null);
  const [usuarioPermisos, setUsuarioPermisos] = useState(null);
  const [usuarioStats, setUsuarioStats] = useState(null);

  const { user } = useAuth();
  const { tenant } = useTenant();

  // 🛒 SHOP: de momento sin planes limitados
  const isPlanLimitado = false;

  /* =====================
     ACCIONES
  ===================== */

  const onCrear = async (payload) => {
    const r = await crearUsuario(payload);

    setAlerta({
      tipo: r.ok ? "exito" : "error",
      mensaje: r.ok
        ? "Usuario creado correctamente"
        : r.error || "Error al crear usuario",
    });
  };

  const onEliminar = async (id) => {
    const ok = await eliminarUsuario(id);

    setAlerta({
      tipo: ok ? "exito" : "error",
      mensaje: ok
        ? "Usuario eliminado"
        : "Error al eliminar usuario",
    });
  };

  const onEditar = async (id, payload) => {
    const r = await editarUsuario(id, payload);

    setAlerta({
      tipo: r.ok ? "exito" : "error",
      mensaje: r.ok
        ? "Usuario actualizado"
        : r.error || "Error al actualizar usuario",
    });
  };

  /* =====================
     RENDER
  ===================== */

  return (
    <main className="cfg-page section section--wide">
      {/* ALERTAS */}
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

      <header className="cfg-header">
        <div>
          <h1>Usuarios de la tienda</h1>
          <p className="text-suave">
            Gestiona el equipo que usa la tienda: crea usuarios, edítalos y controla accesos.
          </p>
        </div>
      </header>

      <div className="usuarios-grid">
        {/* ================= COLUMNA CREAR ================= */}
        <div className="usuarios-col usuarios-col-create">
          <UsuarioCreateForm onCrear={onCrear} />
        </div>

        {/* ================= COLUMNA TABLA ================= */}
        <div className="usuarios-col usuarios-col-table">
          <UsuarioTableShop
            usuarios={usuarios}
            onEditar={setUsuarioEdit}
            onEliminar={onEliminar}
            onPermisos={setUsuarioPermisos}
            onStats={setUsuarioStats}
            isPlanEsencial={isPlanLimitado}
          />
        </div>
      </div>

      {/* ================= MODALES ================= */}

      {/* EDITAR */}
      {usuarioEdit && (
        <UsuarioEditModal
          usuario={usuarioEdit}
          onSave={onEditar}
          onClose={() => setUsuarioEdit(null)}
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

      {/* ESTADÍSTICAS */}
      {usuarioStats && (
        <UsuarioStatsModal
          usuario={usuarioStats}
          onClose={() => setUsuarioStats(null)}
        />
      )}
    </main>
  );
}
