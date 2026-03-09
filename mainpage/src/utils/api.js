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

const getEnvMode = () => {
  try {
    return sessionStorage.getItem("alef_env") || "prod"; // "sandbox" | "prod"
  } catch {
    return "prod";
  }
};

const getSandboxTenantId = () => {
  try {
    return sessionStorage.getItem("sandbox_tenantId") || "";
  } catch {
    return "";
  }
};

function looksLikeCode(s) {
  return /^[A-Z0-9_]{3,}$/.test(String(s || ""));
}

function extractServerError(error) {
  const res = error?.response;
  const data = res?.data;

  const requestId =
    res?.headers?.["x-request-id"] ||
    data?.requestId ||
    "—";

  // nuevo contrato
  if (data && (data.ok === false || data.code || data.message || data.action)) {
    return {
      status: res?.status || null,
      code: data.code ? String(data.code) : null,
      message: data.message ? String(data.message) : "Error inesperado",
      requestId: String(requestId),
      action: data.action ? String(data.action) : null,
      retryAfter: data.retryAfter != null ? Number(data.retryAfter) : null,
      fields: data.fields || null,
    };
  }

  // legacy
  const legacyErrStr = typeof data?.error === "string" ? data.error : null;

  const code =
    (data?.code ? String(data.code) : null) ||
    (legacyErrStr && looksLikeCode(legacyErrStr) ? legacyErrStr : null);

  const message =
    (typeof data?.error === "object" && data?.error?.message ? String(data.error.message) : null) ||
    (legacyErrStr && !looksLikeCode(legacyErrStr) ? legacyErrStr : null) ||
    (data?.message ? String(data.message) : null) ||
    (error?.message ? String(error.message) : "Error inesperado");

  return {
    status: res?.status || null,
    code,
    message,
    requestId: String(requestId),
    action: null,
    retryAfter: null,
    fields: null,
  };
}

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

/* =====================================================
   🧹 SESSION HELPERS
===================================================== */

const clearClientSession = () => {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("tenantId");
  sessionStorage.removeItem("impersonado");
  // Reset refresh queue so a subsequent login doesn't replay stale requests
  refreshing = false;
  queue = [];
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

const CSRF_COOKIE_DEV = "alef_csrf";
const CSRF_COOKIE_PROD = "__Secure-alef_csrf";

const getCookie = (name) => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  } catch {
    return null;
  }
};

const SAFE_METHODS = new Set(["get", "head", "options"]);

const attachCsrf = (config) => {
  const method = String(config.method || "get").toLowerCase();
  if (SAFE_METHODS.has(method)) return;

  const token =
    getCookie(CSRF_COOKIE_PROD) ||
    getCookie(CSRF_COOKIE_DEV);

  if (token) {
    config.headers = config.headers || {};
    config.headers["x-csrf-token"] = decodeURIComponent(token);
  }
};

/* =====================================================
   📤 REQUEST INTERCEPTOR
===================================================== */

api.interceptors.request.use((config) => {
  attachCsrf(config);
  const url = config.url || "";

  if (isAuthRoute(url)) {
    if (config.headers) {
      delete config.headers["x-tenant-id"];
      delete config.headers["X-Tenant-ID"];
      delete config.headers["x-alef-env"];
    }
    return config;
  }

  let user = null;
  try {
    const raw = sessionStorage.getItem("user");
    user = raw ? JSON.parse(raw) : null;
  } catch { }

  const envMode = getEnvMode();                 // "prod" | "sandbox"
  const sandboxTenantId = getSandboxTenantId(); // slug
  const canUseSandbox =
    !!user && (user.role === "superadmin" || user.impersonado === true);

  // ✅ Header env (SOLO soporte) + autocuración
  if (envMode === "sandbox" && canUseSandbox) {
    config.headers = config.headers || {};
    config.headers["x-alef-env"] = "sandbox";
  } else {
    // si un usuario normal tiene sandbox pegado, lo apagamos
    try {
      if (envMode === "sandbox" && user && !canUseSandbox) {
        sessionStorage.setItem("alef_env", "prod");
        sessionStorage.removeItem("sandbox_tenantId");
      }
    } catch { }
    if (config.headers) delete config.headers["x-alef-env"];
  }

  if (user?.role === "superadmin") {
    // 🔥 En modo sandbox, el superadmin SI necesita un tenant para operar
    if (envMode === "sandbox") {
      if (!sandboxTenantId) {
        // Sin tenant seleccionado → no mandamos x-tenant-id y el backend te devolverá TENANT_REQUIRED
        delete config.headers["x-tenant-id"];
        delete config.headers["X-Tenant-ID"];
        return config;
      }

      config.headers["x-tenant-id"] = sandboxTenantId;
      return config;
    }

    // prod normal: superadmin opera global (sin tenant)
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
    const original = error.config;

    const server = extractServerError(error);
    const status = server.status;
    const code = server.code;

    // 🔥 CSRF: si backend devuelve nuevo contrato o legacy, lo detectamos igual
    if (
      status === 403 &&
      (code === "CSRF_MISSING" || code === "CSRF_HEADER_MISSING" || code === "CSRF_INVALID") &&
      original &&
      !original._csrfRetry
    ) {
      original._csrfRetry = true;
      try {
        await api.get("/auth/me/me"); // emite cookie CSRF si hay sesión
      } catch {}
      return api(original);
    }

    // ✅ Si no es 401, dejamos pasar el error (pero ya normalizable en UI)
    if (status !== 401) {
      // Adjunta server normalizado para que la UI lo use directo
      error._server = server;
      return Promise.reject(error);
    }

    /* =====================================================
       🔴 ERRORES FATALES → cerrar sesión
    ===================================================== */

    // Ojo: con el contrato nuevo, quizá uses NO_AUTH / TOKEN_INVALID / etc.
    const HARD_INVALID_ERRORS = [
      "TOKEN_INVALID",
      "SESSION_REVOKED",
      "SESSION_STALE",
      "USER_NOT_FOUND",
      "SESSION_INVALIDATED_TV",
      "SESSION_INVALIDATED_PWD",
      "REFRESH_INVALID",
      "REFRESH_EXPIRED",
    ];

    if (code && HARD_INVALID_ERRORS.includes(code)) {
      clearClientSession();
      hardRedirectLogin();
      error._server = server;
      return Promise.reject(error);
    }

    /* =====================================================
       🟡 SI NO ES EXPIRED → NO TOCAR SESIÓN
    ===================================================== */

    const shouldRefresh =
      code === "TOKEN_EXPIRED" ||
      (code === "NO_AUTH" && hasLocalUser());

    if (!shouldRefresh) {
      error._server = server;
      return Promise.reject(error);
    }

    /* =====================================================
       🟢 TOKEN_EXPIRED → intentar refresh
    ===================================================== */

    if (!original || original._retry) {
      error._server = server;
      return Promise.reject(error);
    }

    if (isNoRefreshRoute(original.url || "")) {
      error._server = server;
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
