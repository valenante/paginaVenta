import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";
import { useTenant } from "./TenantContext.jsx";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setTenantId } = useTenant();

  useEffect(() => {
    // ================================
    // 🏷️ Detectar tenant desde la URL
    // ================================
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const tenantFromUrl = pathParts[0] || null;

    if (tenantFromUrl) {
      console.log("🏷️ [AuthProvider] Tenant detectado desde la URL:", tenantFromUrl);
      setTenantId(tenantFromUrl);
      sessionStorage.setItem("tenantId", tenantFromUrl);
    }

    const verificarSesion = async () => {
      try {
        console.log("🟡 [AuthProvider] Verificando sesión real (JWT en cookies)...");
        const res = await api.get("/auth/me/me"); // el backend lee la cookie

        const usuario = res.data.user;
        setUser(usuario);

        if (usuario?.tenantId) {
          setTenantId(usuario.tenantId);
          sessionStorage.setItem("tenantId", usuario.tenantId);
        }
      } catch (error) {
        console.warn(
          "🔴 No hay sesión activa.",
          error.response?.status,
          error.response?.data
        );
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verificarSesion();
  }, [setTenantId]);

  const logout = async () => {
    console.log("🚪 [AuthProvider] Logout iniciado...");
    await api.post("/auth/logout"); // borra cookies en backend
    setUser(null);
    sessionStorage.removeItem("tenantId");
    sessionStorage.removeItem("impersonado");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
