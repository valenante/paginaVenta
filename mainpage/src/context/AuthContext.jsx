// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../utils/api";
import { useTenant } from "./TenantContext.jsx";

const AuthContext = createContext(null);

const saveUserClient = (user) => {
  sessionStorage.setItem("user", JSON.stringify(user));
  if (user?.tenantId) sessionStorage.setItem("tenantId", user.tenantId);
  else sessionStorage.removeItem("tenantId");
};

const clearUserClient = () => {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("tenantId");
  sessionStorage.removeItem("impersonado");
};

export function AuthProvider({ children }) {
  const { setTenantId, clearTenant } = useTenant();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState(null);
  const applyUser = useCallback((u) => {
    setUser(u);
    saveUserClient(u);

    if (u?.role === "superadmin") {
      clearTenant();
      sessionStorage.removeItem("tenantId");
      return;
    }

    if (u?.tenantId) setTenantId(u.tenantId);
    else clearTenant();
  }, [setTenantId, clearTenant]);

  const bootstrap = useCallback(async () => {
    try {
      setBootError(null); // ✅ limpia error anterior
      const res = await api.get("/auth/me/me");
      const u = res.data.user;
      applyUser(u);
    } catch (e) { // ✅ aquí capturas el error
      setUser(null);
      clearUserClient();
      clearTenant();
      setBootError(e); // ✅ ahora sí existe
    } finally {
      setLoading(false);
    }
  }, [applyUser, clearTenant]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async ({ email, password }) => {
    try {
      const loginRes = await api.post("/auth/login", { email, password });

      const maybeUser = loginRes.data?.user;
      if (maybeUser) {
        applyUser(maybeUser);
        return maybeUser;
      }

      const meRes = await api.get("/auth/me/me");
      const u = meRes.data.user;
      applyUser(u);
      return u;
    } catch (e) {
      // ✅ IMPORTANTÍSIMO: no conviertas el error a string, re-lánzalo
      throw e;
    }
  }, [applyUser]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      clearUserClient();
      clearTenant();
      window.location.replace("/login");
    }
  }, [clearTenant]);

  return (
    <AuthContext.Provider value={{ user, loading, bootError, login, logout, setUser: applyUser, bootstrap }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
