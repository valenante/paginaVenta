// src/utils/api.js
import axios from "axios";

/* ======================================================================
   🌍 CONFIG BASE
   ====================================================================== */
const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 👈 MUY IMPORTANTE para enviar cookies
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
  "pro"
];

/* ======================================================================
   📤 REQUEST INTERCEPTOR
   ====================================================================== */
api.interceptors.request.use((config) => {
  const tenantId = sessionStorage.getItem("tenantId");

  if (tenantId) {
    config.headers["x-tenant-id"] = tenantId;
    config.headers["X-Tenant-Slug"] = tenantId;
  } else {
    delete config.headers["x-tenant-id"];
    delete config.headers["X-Tenant-Slug"];
  }

  return config;
});

/* ======================================================================
   📥 RESPONSE INTERCEPTOR
   ====================================================================== */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("❌ [API ERROR]", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

export default api;
