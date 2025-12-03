import { useEffect, useState } from "react";
import api from "../../utils/api";
import * as logger from "../../utils/logger";

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [permisosDisponibles, setPermisosDisponibles] = useState([]);
  const [rolesConfig, setRolesConfig] = useState({});
  const [loading, setLoading] = useState(false);

  const cargarUsuarios = async () => {
    try {
      const { data } = await api.get("/auth/usuarios");
      console.log(data);
      setUsuarios(data);
    } catch (e) {
      logger.error("Error al cargar usuarios:", e);
    }
  };

  const cargarPermisos = async () => {
    try {
      const { data } = await api.get("/admin/permisos");
      setPermisosDisponibles(data.permisosDisponibles || []);
      setRolesConfig(data.roles || {});
    } catch (e) {
      logger.error("Error al cargar permisos:", e);
    }
  };

  useEffect(() => {
    cargarUsuarios();
    cargarPermisos();
  }, []);

  const crearUsuario = async (payload) => {
    try {
      await api.post("/auth/usuarios", payload);
      await cargarUsuarios();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.response?.data?.error || "Error inesperado" };
    }
  };

  const eliminarUsuario = async (id) => {
    try {
      await api.delete(`/auth/usuarios/${id}`);
      await cargarUsuarios();
      return true;
    } catch (e) {
      logger.error(e);
      return false;
    }
  };

  const editarUsuario = async (id, payload) => {
    try {
      await api.put(`/auth/usuarios/${id}`, payload);
      await cargarUsuarios();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Error al actualizar usuario" };
    }
  };

  return {
    usuarios,
    permisosDisponibles,
    rolesConfig,
    loading,
    crearUsuario,
    eliminarUsuario,
    editarUsuario,
  };
}
