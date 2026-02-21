// src/utils/api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const hasLocalUser = () => {
  try {
    return !!sessionStorage.getItem("user");
  } catch {
    return false;
  }
};

/* =====================================================
   🏷️ Inferir tenant desde hostname (subdominio)
===================================================== */

const KNOWN_APPS = new Set(["tpv", "panel", "carta", "shops", "shop", "pos"]);

function inferTenantFromFrontendHost() {
  try {
    const host = window.location.hostname.toLowerCase();
    const main = String(import.meta.env.VITE_MAIN_DOMAIN || "").toLowerCase();

    if (!main || !host.endsWith(main)) return null;

    // la-campana-panel.softalef.com
    const sub = host.replace(`.${main}`, "");
    const parts = sub.split("-").filter(Boolean);

    const last = parts[parts.length - 1];
    if (KNOWN_APPS.has(last)) parts.pop();

    return parts.join("-") || null;
  } catch {
    return null;
  }
}

/* =====================================================
   🧠 CONFIG
===================================================== */

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

const HARD_INVALID_ERRORS = [
  "TOKEN_INVALID",
  "SESSION_REVOKED",
  "SESSION_STALE",
  "USER_NOT_FOUND",
];

/* =====================================================
   🧹 SESSION HELPERS
===================================================== */

const clearClientSession = () => {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("tenantId");
  sessionStorage.removeItem("impersonado");
};

const hardRedirectLogin = () => {
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

/* =====================================================
   🔄 REFRESH CONTROL
===================================================== */

let refreshing = false;
let queue = [];

const runQueue = (error) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  queue = [];
};

const isAuthRoute = (url = "") =>
  AUTH_ROUTES.some((r) => url.includes(r));

const isNoRefreshRoute = (url = "") =>
  NO_REFRESH_ROUTES.some((r) => url.includes(r));

/* =====================================================
   📤 REQUEST INTERCEPTOR
===================================================== */

api.interceptors.request.use((config) => {
  const url = config.url || "";

  if (isAuthRoute(url)) {
    delete config.headers["x-tenant-id"];
    delete config.headers["X-Tenant-ID"];
    return config;
  }

  let user = null;
  try {
    const raw = sessionStorage.getItem("user");
    user = raw ? JSON.parse(raw) : null;
  } catch { }

  if (user?.role === "superadmin") {
    delete config.headers["x-tenant-id"];
    delete config.headers["X-Tenant-ID"];
    return config;
  }

  let tenantId =
    sessionStorage.getItem("tenantId") ||
    user?.tenantId ||
    inferTenantFromFrontendHost();

  // Si lo inferimos por hostname, lo persistimos
  if (tenantId && !sessionStorage.getItem("tenantId")) {
    sessionStorage.setItem("tenantId", tenantId);
  }

  if (tenantId) config.headers["x-tenant-id"] = tenantId;
  else delete config.headers["x-tenant-id"];

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

/* =====================================================
   📥 RESPONSE INTERCEPTOR (BLINDADO)
===================================================== */

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.error;
    const original = error.config;

    if (status !== 401) {
      return Promise.reject(error);
    }

    /* =====================================================
       🔴 ERRORES FATALES → cerrar sesión
    ===================================================== */

    if (HARD_INVALID_ERRORS.includes(code)) {
      clearClientSession();
      hardRedirectLogin();
      return Promise.reject(error);
    }

    /* =====================================================
       🟡 SI NO ES TOKEN_EXPIRED → NO TOCAR SESIÓN
    ===================================================== */

    const shouldRefresh =
      code === "TOKEN_EXPIRED" ||
      (code === "NO_AUTH" && hasLocalUser());

    if (!shouldRefresh) {
      // NO_AUTH sin user => usuario anónimo en landing => no tocar nada
      return Promise.reject(error);
    }

    /* =====================================================
       🟢 TOKEN_EXPIRED → intentar refresh
    ===================================================== */

    if (!original || original._retry) {
      return Promise.reject(error);
    }

    if (isNoRefreshRoute(original.url || "")) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (refreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: () => resolve(api(original)),
          reject,
        });
      });
    }

    refreshing = true;

    try {
      await api.post("/auth/refresh-token");

      runQueue(null);

      return api(original);
    } catch (refreshError) {
      runQueue(refreshError);
      clearClientSession();
      hardRedirectLogin();
      return Promise.reject(refreshError);
    } finally {
      refreshing = false;
    }
  }
);

export default api;
