import React, { useState } from "react";
import { useUsuarios } from "./useUsuarios";

import UsuarioCreateForm from "./UsuarioCreateForm.jsx";
import UsuariosTable from "./UsuariosTable.jsx";
import UsuarioEditModal from "./UsuarioEditModal.jsx";
import UsuarioStatsModal from "./UsuariosStatsModal.jsx";

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
  } = useUsuarios();

  const [alerta, setAlerta] = useState(null);

  // Estado modales
  const [usuarioEdit, setUsuarioEdit] = useState(null);
  const [usuarioStats, setUsuarioStats] = useState(null);

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

      {/* Tabla de Usuarios */}
      <UsuariosTable
        usuarios={usuarios}
        onEditar={setUsuarioEdit}
        onEliminar={onEliminar}
        onStats={setUsuarioStats}
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
    </div>
  );
}
