// API client dedicado al consumidor final del programa de fidelización ALEF.
//
// Diferencias con `utils/api.js`:
//   - Sin cookies de staff ni headers de tenant.
//   - Authorization: Bearer leído de localStorage (`alef_cliente_token`).
//   - 401 → limpia el token y redirige a /cliente/login (best-effort).

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
export const CLIENTE_TOKEN_KEY = "alef_cliente_token";

const clienteApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

clienteApi.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(CLIENTE_TOKEN_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* localStorage indisponible */ }
  return config;
});

clienteApi.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try { localStorage.removeItem(CLIENTE_TOKEN_KEY); } catch { }
      // Redirigir solo si no estamos ya en login/registro
      const path = window.location?.pathname || "";
      if (!path.startsWith("/cliente/login") && !path.startsWith("/cliente/registro")) {
        window.location.href = "/cliente/login";
      }
    }
    return Promise.reject(err);
  }
);

export default clienteApi;
