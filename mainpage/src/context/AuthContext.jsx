import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";
import { useTenant } from "./TenantContext.jsx";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setTenantId, clearTenant } = useTenant();

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const res = await api.get("/auth/me/me");
        const usuario = res.data.user;

        setUser(usuario);
        sessionStorage.setItem("user", JSON.stringify(usuario));

        if (usuario?.role === "superadmin") {
          clearTenant();
          return;
        }

        if (usuario?.tenantId) {
          setTenantId(usuario.tenantId);
        }
      } catch (error) {
        setUser(null);
        clearTenant(); // 👈 importante si no hay sesión
      } finally {
        setLoading(false);
      }
    };

    verificarSesion();
  }, [setTenantId, clearTenant]);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      clearTenant();
      sessionStorage.removeItem("impersonado");
      sessionStorage.removeItem("user");

      window.location.replace("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
