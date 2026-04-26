// Wrapper API para la configuración del programa de fidelización (panel admin).
// Usa el axios staff (cookie + tenant header), no el del cliente final.

import api from "../utils/api";

const unwrap = (res) => res?.data?.data ?? res?.data;

export async function getLoyaltyConfig() {
  const res = await api.get("/loyalty/config");
  return unwrap(res)?.config;
}

export async function updateLoyaltyConfig(patch) {
  const res = await api.put("/loyalty/config", patch);
  return unwrap(res)?.config;
}

export async function getLoyaltyStats() {
  const res = await api.get("/loyalty/stats");
  return unwrap(res)?.stats;
}

export async function getLoyaltyClientes({ search = "", page = 1, limit = 20 } = {}) {
  const res = await api.get("/loyalty/clientes", { params: { search, page, limit } });
  return unwrap(res);
}
