import React, { useState } from "react";
import { useUsuarios } from "./useUsuarios";
import { useAuth } from "../../context/AuthContext";
import UpsellEstadisticasUsuarios from "../Usuarios/UpsellEstadisticasUsuarios";
import { useTenant } from "../../context/TenantContext";
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
    actualizarPermisosUsuario,
  } = useUsuarios();

  const [alerta, setAlerta] = useState(null);

  // Estado modales
  const [usuarioEdit, setUsuarioEdit] = useState(null);
  const [usuarioStats, setUsuarioStats] = useState(null);
  const [usuarioPermisos, setUsuarioPermisos] = useState(null);
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
    <div className="usuarios-root usuarios-layout">

      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

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
      )} */}
    </div>
  );
}
