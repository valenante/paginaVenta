// src/context/TenantContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import api from "../utils/api";

const TenantContext = createContext();

/* ================================
   Helpers: detectar tenantId en aURL
================================ */
const RESERVED_FIRST_SEGMENTS = new Set([
  "", "login", "registro", "forgot-password", "reset-password",
  "tpv", "dashboard", "mi-cuenta", "facturas", "perfil",
  "configuracion", "soporte", "ayuda", "estadisticas", "caja-diaria",
  "pro", "superadmin",
]);

const isPublicRoute = (pathname) => {
  return (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/superadmin")
  );
};

const extractTenantFromPath = (pathname) => {
  // /tpv/:tenantId/...
  const m1 = pathname.match(/^\/tpv\/([^/]+)/i);
  if (m1?.[1]) return m1[1];

  // /:tenantId  (solo si NO es ruta reservada)
  const m2 = pathname.match(/^\/([^/]+)/);
  const first = m2?.[1] || "";
  if (first && !RESERVED_FIRST_SEGMENTS.has(first)) return first;

  return null;
};

export const TenantProvider = ({ children }) => {
  const location = useLocation();

  const [tenantId, setTenantId] = useState(() => {
    return sessionStorage.getItem("tenantId") || null;
  });

  const [tenant, setTenant] = useState(null);
  const [loadingTenant, setLoadingTenant] = useState(false);
  const [tenantError, setTenantError] = useState(null);

  // ✅ 1) Si la URL trae tenantId, lo sincronizamos
  useEffect(() => {
    const fromPath = extractTenantFromPath(location.pathname);
    if (fromPath && fromPath !== tenantId) {
      setTenantId(fromPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ✅ 2) Persistir tenantId en sessionStorage
  useEffect(() => {
    if (tenantId) sessionStorage.setItem("tenantId", tenantId);
    else sessionStorage.removeItem("tenantId"); // ✅
  }, [tenantId]);

  // ✅ 4) Cargar tenant real desde backend cuando haya tenantId
  useEffect(() => {
    const run = async () => {
      if (!tenantId) {
        setTenant(null);
        setTenantError(null);
        return;
      }

      // ⛔️ NUEVO: no cargar tenant en rutas públicas
      if (isPublicRoute(location.pathname)) {
        setTenant(null);
        setTenantError(null);
        return;
      }

      try {
        setLoadingTenant(true);
        setTenantError(null);

        const { data } = await api.get("/meTenant/me");
        setTenant(data?.tenant || null);
      } catch (e) {
        setTenant(null);
        setTenantError(
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Error cargando tenant"
        );
      } finally {
        setLoadingTenant(false);
      }
    };

    run();
  }, [tenantId, location.pathname]);

  const clearTenant = () => {
    setTenantId(null);
    setTenant(null);
    setTenantError(null);
    setLoadingTenant(false);

    sessionStorage.removeItem("tenantId");
    localStorage.removeItem("tenantId");
  };

  const value = useMemo(() => {
    return {
      tenantId,
      setTenantId,
      tenant,
      loadingTenant,
      tenantError,
      clearTenant, // ✅
    };
  }, [tenantId, tenant, loadingTenant, tenantError]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
