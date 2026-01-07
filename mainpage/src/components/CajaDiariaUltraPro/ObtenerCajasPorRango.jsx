// ObtenerCajasPorRango.js
import api from "../../utils/api";

export const obtenerCajasPorRango = async (fi, ff, tipoNegocio) => {
  const endpoint =
    tipoNegocio === "shop"
      ? "shop/ventas/heatmap"
      : "caja/caja"; // (tu endpoint de restaurante)

  const response = await api.get(endpoint, {
    params: { fechaInicio: fi, fechaFin: ff },
  });

  return response.data;
};
