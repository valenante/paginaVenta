import clienteApi from "../utils/clienteApi";

const unwrap = (res) => res?.data?.data ?? res?.data;

export async function getMiLoyaltyPerfil() {
  const res = await clienteApi.get("/cliente/loyalty/perfil");
  return unwrap(res);
}

export async function getMiHistorialLoyalty({ tenantSlug, page = 1, limit = 20 }) {
  const res = await clienteApi.get("/cliente/loyalty/historial", {
    params: { tenantSlug, page, limit },
  });
  return unwrap(res);
}

export async function getRestaurantesLoyalty() {
  const res = await clienteApi.get("/cliente/loyalty/restaurantes");
  return unwrap(res);
}

export async function getDetalleRestauranteCliente(slug) {
  const res = await clienteApi.get(`/cliente/loyalty/restaurante/${encodeURIComponent(slug)}`);
  return unwrap(res);
}
