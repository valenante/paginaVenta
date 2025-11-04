// src/utils/api.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// 🔹 Interceptor genérico (sin tenant)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ No autorizado (401).");
    } else {
      console.error("❌ Error API:", error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
