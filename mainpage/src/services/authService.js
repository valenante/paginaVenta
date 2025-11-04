import api from "../utils/api.js";

export const login = async (credenciales) => {
  const res = await api.post("/auth/login", credenciales);
  return res.data;
};

export const registro = async (datos) => {
  const res = await api.post("/auth/registro", datos);
  return res.data;
};

export const obtenerUsuarioActual = async () => {
  const res = await api.get("/auth/yo");
  return res.data.user;
};

export const logout = async () => {
  const res = await api.post("/auth/logout");
  return res.data;
};
