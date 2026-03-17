// src/components/Usuarios/useUsuarios.js
import { useEffect, useState } from "react";
import api from "../../utils/api";
import * as logger from "../../utils/logger";
import { normalizeApiError } from "../../utils/normalizeApiError.js";

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [permisosDisponibles, setPermisosDisponibles] = useState([]);
  const [rolesConfig, setRolesConfig] = useState({});
  const [loading, setLoading] = useState(false);

  const cargarUsuarios = async () => {
    try {
      const { data } = await api.get("/auth/usuarios");
      // /auth/usuarios uses ok() spread → { ok, usuarios } (no data wrapper)
      const payload = data?.data || data;
      setUsuarios(Array.isArray(payload?.usuarios) ? payload.usuarios : []);
      return { ok: true };
    } catch (e) {
      logger.error("usuarios.load.error", e);
      setUsuarios([]);
      return { ok: false, error: normalizeApiError(e) };
    }
  };

  const cargarPermisos = async () => {
    try {
      const { data } = await api.get("/admin/permisos");
      // /admin/permisos uses sendOk() → { ok, data: { permisosDisponibles, roles, ... } }
      const payload = data?.data || data;
      setPermisosDisponibles(Array.isArray(payload?.permisosDisponibles) ? payload.permisosDisponibles : []);
      setRolesConfig(payload?.roles || {});
      return { ok: true };
    } catch (e) {
      logger.error("usuarios.permisos.load.error", e);
      setPermisosDisponibles([]);
      setRolesConfig({});
      return { ok: false, error: normalizeApiError(e) };
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
      return { ok: false, error: normalizeApiError(e) };
    }
  };

  const eliminarUsuario = async (id) => {
    try {
      await api.delete(`/auth/usuarios/${id}`);
      await cargarUsuarios();
      return { ok: true };
    } catch (e) {
      logger.error("usuarios.delete.error", e);
      return { ok: false, error: normalizeApiError(e) };
    }
  };

  const editarUsuario = async (id, payload) => {
    try {
      await api.put(`/auth/usuarios/${id}`, payload);
      await cargarUsuarios();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: normalizeApiError(e) };
    }
  };

  const actualizarPermisosUsuario = async (id, payload) => {
    try {
      await api.put(`/admin/permisos/usuarios/${id}`, payload);
      await cargarUsuarios();
      await cargarPermisos();
      return { ok: true };
    } catch (e) {
      logger.error("usuarios.permisos.update.error", e);
      return { ok: false, error: normalizeApiError(e) };
    }
  };

  return {
    usuarios,
    permisosDisponibles,
    rolesConfig,
    loading,

    cargarUsuarios,
    cargarPermisos,

    crearUsuario,
    eliminarUsuario,
    editarUsuario,
    actualizarPermisosUsuario,
  };
}