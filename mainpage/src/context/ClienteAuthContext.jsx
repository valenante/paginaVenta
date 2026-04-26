// Contexto de auth del consumidor final (programa de fidelización ALEF).
// Independiente de AuthContext (staff). El token vive en localStorage
// para que el cliente no tenga que loguearse cada vez que vuelve.

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  registrarCliente as apiRegister,
  loginCliente as apiLogin,
  logoutCliente as apiLogout,
  obtenerMiPerfil,
} from "../services/clienteAuthService";
import { CLIENTE_TOKEN_KEY } from "../utils/clienteApi";

const ClienteAuthContext = createContext(null);

export function ClienteAuthProvider({ children }) {
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(CLIENTE_TOKEN_KEY);
    if (!token) {
      setCliente(null);
      setLoading(false);
      return null;
    }
    try {
      const me = await obtenerMiPerfil();
      setCliente(me || null);
      return me;
    } catch {
      setCliente(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const register = useCallback(async (datos) => {
    const data = await apiRegister(datos);
    setCliente(data?.cliente || null);
    return data;
  }, []);

  const login = useCallback(async (credenciales) => {
    const data = await apiLogin(credenciales);
    setCliente(data?.cliente || null);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setCliente(null);
  }, []);

  const value = useMemo(
    () => ({ cliente, loading, register, login, logout, refresh, isAuthenticated: !!cliente }),
    [cliente, loading, register, login, logout, refresh]
  );

  return <ClienteAuthContext.Provider value={value}>{children}</ClienteAuthContext.Provider>;
}

export function useClienteAuth() {
  const ctx = useContext(ClienteAuthContext);
  if (!ctx) throw new Error("useClienteAuth debe usarse dentro de ClienteAuthProvider");
  return ctx;
}

export default ClienteAuthContext;
