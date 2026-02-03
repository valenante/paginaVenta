// src/utils/api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const RUTAS_SIN_REFRESH = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh-token",       // <- IMPORTANTE: no intentes refrescar si falla refresh
  "/auth/logout",
];

let refreshing = false;
let queue = [];

const runQueue = (error) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  queue = [];
};

api.interceptors.request.use((config) => {
  const userStr = sessionStorage.getItem("user");
  let role = null;

  try {
    role = userStr ? JSON.parse(userStr)?.role : null;
  } catch {
    role = null;
  }

  // ✅ superadmin => NUNCA enviar tenant headers
  if (role === "superadmin") {
    delete config.headers["x-tenant-id"];
    delete config.headers["x-tenant-slug"];
    delete config.headers["X-Tenant-Slug"];
    delete config.headers["X-Tenant-ID"];
    return config;
  }

  const tenantId = sessionStorage.getItem("tenantId");

  if (tenantId) {
    // ✅ usa solo UNA convención (te recomiendo x-tenant-id)
    config.headers["x-tenant-id"] = tenantId;
    // si quieres, elimina el slug para no duplicar:
    delete config.headers["X-Tenant-Slug"];
  } else {
    delete config.headers["x-tenant-id"];
    delete config.headers["X-Tenant-Slug"];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config;

    // Si no es 401 -> normal
    if (status !== 401) return Promise.reject(error);

    // Evitar bucle infinito
    if (!original || original._retry) return Promise.reject(error);

    // No intentar refresh en rutas de auth (login/renovar/logout…)
    const url = original.url || "";
    if (RUTAS_SIN_REFRESH.some((r) => url.includes(r))) {
      return Promise.reject(error);
    }

    original._retry = true;

    // Si ya se está refrescando, esperamos
    if (refreshing) {
      await new Promise((resolve, reject) => queue.push({ resolve, reject }));
      return api(original);
    }

    refreshing = true;
    try {
      await api.post("/auth/refresh-token"); 
      runQueue(null);
      return api(original);
    } catch (e) {
      runQueue(e);
      return Promise.reject(e);
    } finally {
      refreshing = false;
    }
  }
);

export default api;
