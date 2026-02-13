// src/utils/api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const AUTH_ROUTES = [
  "/auth/login",
  "/auth/registro",
  "/auth/register",
  "/auth/me/me",
  "/auth/refresh-token",
  "/auth/logout",
  "/auth/password-setup",
  "/auth/forgot-password",
  "/auth/reset-password",
];

const NO_REFRESH_ROUTES = [
  "/auth/login",
  "/auth/refresh-token",
  "/auth/logout",
];

const clearClientSession = () => {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("tenantId");
  sessionStorage.removeItem("impersonado");
};

const hardRedirectLogin = () => {
  // evita bucle si ya estás en /login
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

let refreshing = false;
let queue = [];

const runQueue = (error) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  queue = [];
};

const isAuthRoute = (url = "") => AUTH_ROUTES.some((r) => url.includes(r));
const isNoRefreshRoute = (url = "") => NO_REFRESH_ROUTES.some((r) => url.includes(r));

api.interceptors.request.use((config) => {
  const url = config.url || "";

  // Nunca mandes tenant en auth
  if (isAuthRoute(url)) {
    delete config.headers["x-tenant-id"];
    delete config.headers["X-Tenant-ID"];
    return config;
  }

  // Lee user/tenant desde sessionStorage (source of truth en cliente)
  let user = null;
  try {
    const u = sessionStorage.getItem("user");
    user = u ? JSON.parse(u) : null;
  } catch { }

  // superadmin nunca manda tenant
  if (user?.role === "superadmin") {
    delete config.headers["x-tenant-id"];
    delete config.headers["X-Tenant-ID"];
    return config;
  }

  const tenantId = sessionStorage.getItem("tenantId") || user?.tenantId;
  if (tenantId) config.headers["x-tenant-id"] = tenantId;
  else delete config.headers["x-tenant-id"];

  // 🔥 Soporte correcto FormData
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.error; // tu backend devuelve { error: "TOKEN_EXPIRED" }
    const original = error.config;

    // Si no es 401 -> normal
    if (status !== 401) return Promise.reject(error);

    // Si es 401 pero no es expiración -> sesión rota / inválida
    // (NO_AUTH, TOKEN_INVALID, SESSION_REVOKED, SESSION_STALE, USER_NOT_FOUND, etc.)
    // Si no es expiración
    if (code !== "TOKEN_EXPIRED") {
      const hadSession = !!sessionStorage.getItem("user");

      // Solo redirigir si había sesión previa
      if (hadSession) {
        clearClientSession();
        hardRedirectLogin();
      }

      return Promise.reject(error);
    }
    // Evitar bucle
    if (!original || original._retry) return Promise.reject(error);

    // No intentes refrescar en rutas auth
    if (isNoRefreshRoute(original.url || "")) return Promise.reject(error);

    original._retry = true;

    // Si ya se está refrescando, espera
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
      clearClientSession();
      hardRedirectLogin();
      return Promise.reject(e);
    } finally {
      refreshing = false;
    }
  }
);

export default api;
