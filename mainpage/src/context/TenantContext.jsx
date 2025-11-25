// src/context/TenantContext.jsx
import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [tenantId, setTenantId] = useState(() => {
    return sessionStorage.getItem("tenantId") || localStorage.getItem("tenantId") || null;
  });

  // Guardar automáticamente cada vez que cambie
  useEffect(() => {
    if (tenantId) {
      sessionStorage.setItem("tenantId", tenantId);
    }
  }, [tenantId]);

  // Inyectar en Axios (una sola vez)
  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      const tenant = tenantId || sessionStorage.getItem("tenantId");
      if (tenant) config.headers["X-Tenant-ID"] = tenant;
      return config;
    });

    return () => api.interceptors.request.eject(interceptor);
  }, [tenantId]);

  return (
    <TenantContext.Provider value={{ tenantId, setTenantId }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
