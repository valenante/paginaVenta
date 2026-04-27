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

export async function getLoyaltyClienteDetalle(clienteId) {
  const res = await api.get(`/loyalty/clientes/${encodeURIComponent(clienteId)}/detalle`);
  return unwrap(res);
}

// Anuncios

export async function listarAnuncios() {
  const res = await api.get("/loyalty/anuncios");
  return unwrap(res)?.anuncios || [];
}

export async function crearAnuncio(data) {
  const res = await api.post("/loyalty/anuncios", data);
  return unwrap(res)?.anuncio;
}

export async function actualizarAnuncio(id, patch) {
  const res = await api.put(`/loyalty/anuncios/${id}`, patch);
  return unwrap(res)?.anuncio;
}

export async function eliminarAnuncio(id) {
  const res = await api.delete(`/loyalty/anuncios/${id}`);
  return unwrap(res);
}
