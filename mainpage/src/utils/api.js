import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// === DEPURACIÓN DE REQUESTS ===
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  const tenantId = sessionStorage.getItem("tenantId");
  const impersonado = sessionStorage.getItem("impersonado");
  const user = sessionStorage.getItem("user");

  config.headers["x-tenant-id"] = tenantId || "";
  if (token) config.headers["Authorization"] = `Bearer ${token}`;

  console.log("📤 [API REQUEST]", {
    method: config.method?.toUpperCase(),
    url: config.url,
    tenantId,
    impersonado,
    token: token ? token.slice(0, 25) + "..." : "N/A",
    user: user ? JSON.parse(user).name : "N/A",
  });

  return config;
});

// === DEPURACIÓN DE RESPUESTAS ===
api.interceptors.response.use(
  (response) => {
    console.log("📥 [API RESPONSE]", {
      url: response.config.url,
      status: response.status,
      ok: true,
      data: response.data,
    });
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
