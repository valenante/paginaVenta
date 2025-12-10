import React, { useState } from "react";
import { useUsuarios } from "./useUsuarios";
import { useAuth } from "../../context/AuthContext";
import UpsellEstadisticasUsuarios from "../Usuarios/UpsellEstadisticasUsuarios";

import UsuarioCreateForm from "./UsuarioCreateForm.jsx";
import UsuariosTable from "./UsuariosTable.jsx";
import UsuarioEditModal from "./UsuarioEditModal.jsx";
import UsuarioStatsModal from "./UsuariosStatsModal.jsx";
import UsuarioPermisosModal from "./UsuarioPermisosModal.jsx";

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
  const { user } = useAuth();

  const isPlanEsencial =
    user?.plan === "esencial" || user?.plan === "tpv-esencial";

  const onCrear = async (payload) => {
    const r = await crearUsuario(payload);
    if (r.ok) setAlerta({ tipo: "exito", mensaje: "Usuario creado!" });
    else setAlerta({ tipo: "error", mensaje: r.error });
  };

  const onEliminar = async (id) => {
    const ok = await eliminarUsuario(id);
    setAlerta({
      tipo: ok ? "exito" : "error",
      mensaje: ok ? "Usuario eliminado" : "Error al eliminar",
    });
  };

  const onEditar = async (id, payload) => {
    const r = await editarUsuario(id, payload);
    if (r.ok)
      setAlerta({ tipo: "exito", mensaje: "Usuario actualizado!" });
    else
      setAlerta({ tipo: "error", mensaje: r.error });
  };

  return (
    <div className="usuarios-root">

      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

      {/* Crear Usuario */}
      <UsuarioCreateForm onCrear={onCrear} />

      {/* 🔒 Upsell SOLO si es plan esencial */}
      {isPlanEsencial && (
        <div style={{ margin: "1.5rem 0" }}>
          <UpsellEstadisticasUsuarios />
        </div>
      )}

      {/* Tabla de Usuarios */}
      <UsuariosTable
        usuarios={usuarios}
        onEditar={setUsuarioEdit}
        onEliminar={onEliminar}
        onStats={setUsuarioStats}
        onPermisos={setUsuarioPermisos}
        isPlanEsencial={isPlanEsencial}
      />

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

      {usuarioPermisos && (
        <UsuarioPermisosModal
          usuario={usuarioPermisos}
          permisosDisponibles={permisosDisponibles}
          rolesConfig={rolesConfig}
          onSave={actualizarPermisosUsuario}
          onClose={() => setUsuarioPermisos(null)}
        />
      )}
    </div>
  );
}
