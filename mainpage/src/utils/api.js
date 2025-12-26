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
  let tenantId = sessionStorage.getItem("tenantId");
  const impersonado = sessionStorage.getItem("impersonado") === "true";
  const userRaw = sessionStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  // --------------------------------------------------------------
  // 🧩 1. Detectar tenant automáticamente desde URL
  // --------------------------------------------------------------
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const firstSegment = pathParts[0]; // ej: "zabor-feten" o "login"

  // Si estamos en una ruta global → NO usar tenant
  if (RUTAS_GLOBALES.includes(firstSegment)) {
    tenantId = null;
    sessionStorage.removeItem("tenantId");
  }

  // Si NO estamos en ruta global → considerar que el primer segmento es el tenant
  if (!tenantId && firstSegment && !RUTAS_GLOBALES.includes(firstSegment)) {
    tenantId = firstSegment;
    sessionStorage.setItem("tenantId", tenantId);
  }

  // --------------------------------------------------------------
  // 🧩 2. Cabecera de tenant
  // --------------------------------------------------------------
  if (tenantId) {
    config.headers["x-tenant-id"] = tenantId;
    config.headers["X-Tenant-Slug"] = tenantId;  // 🔥 NECESARIO PARA TENANT MIDDLEWARE
  } else {
    delete config.headers["x-tenant-id"];
    delete config.headers["X-Tenant-Slug"];
  }

  // --------------------------------------------------------------
  // 🔐 3. YA NO enviamos Authorization con token de sessionStorage
  //      -> El backend usa las cookies httpOnly
  // --------------------------------------------------------------

  // --------------------------------------------------------------
  // 🪵 4. Debug elegante
  // --------------------------------------------------------------

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
