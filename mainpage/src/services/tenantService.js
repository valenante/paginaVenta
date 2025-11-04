import api from "../utils/api.js";

export const crearTenant = async (data) => {
  const res = await api.post("/tenants", data);
  return res.data;
};

export const obtenerTenants = async () => {
  const res = await api.get("/tenants");
  return res.data;
};

export const eliminarTenant = async (id) => {
  const res = await api.delete(`/tenants/${id}`);
  return res.data;
};
