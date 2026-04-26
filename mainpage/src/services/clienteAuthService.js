import clienteApi, { CLIENTE_TOKEN_KEY } from "../utils/clienteApi";

const unwrap = (res) => res?.data?.data ?? res?.data;

export async function registrarCliente(datos) {
  const res = await clienteApi.post("/cliente/auth/register", datos);
  const data = unwrap(res);
  if (data?.token) localStorage.setItem(CLIENTE_TOKEN_KEY, data.token);
  return data;
}

export async function loginCliente(credenciales) {
  const res = await clienteApi.post("/cliente/auth/login", credenciales);
  const data = unwrap(res);
  if (data?.token) localStorage.setItem(CLIENTE_TOKEN_KEY, data.token);
  return data;
}

export async function logoutCliente() {
  try { await clienteApi.post("/cliente/auth/logout"); } catch { /* best-effort */ }
  localStorage.removeItem(CLIENTE_TOKEN_KEY);
}

export async function obtenerMiPerfil() {
  const res = await clienteApi.get("/cliente/auth/me");
  return unwrap(res)?.cliente;
}
