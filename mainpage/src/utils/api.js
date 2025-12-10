// src/utils/api.js
import axios from "axios";

/* ======================================================================
   🌍 CONFIG BASE
   ====================================================================== */
const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/* ======================================================================
   🔥 RUTAS GLOBALES (no requieren tenant)
   ====================================================================== */
const RUTAS_GLOBALES = [
  "login",
  "registro",
  "superadmin",
  "forgot-password",
  "reset-password",
];

/* ======================================================================
   📤 REQUEST INTERCEPTOR
   ====================================================================== */
api.interceptors.request.use((config) => {
  let tenantId = sessionStorage.getItem("tenantId");

  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const firstSegment = pathParts[0];

  if (RUTAS_GLOBALES.includes(firstSegment)) {
    tenantId = null;
    sessionStorage.removeItem("tenantId");
  }

  if (!tenantId && firstSegment && !RUTAS_GLOBALES.includes(firstSegment)) {
    tenantId = firstSegment;
    sessionStorage.setItem("tenantId", tenantId);
  }

  if (tenantId) {
    config.headers["x-tenant-id"] = tenantId;
  } else {
    delete config.headers["x-tenant-id"];
  }

  return config;
});

/* ======================================================================
   📥 RESPONSE INTERCEPTOR
   ====================================================================== */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ [API ERROR]", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Si perdió sesión → redirigir a login
    if (error.response?.status === 401) {
      const tenant = sessionStorage.getItem("tenantId");
      window.location.href = tenant ? `/login/${tenant}` : "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
