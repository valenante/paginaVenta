// ObtenerCajasPorRango.js
import api from "../../utils/api";

export const obtenerCajasPorRango = async (fi, ff, tipoNegocio) => {
  const endpoint =
    tipoNegocio === "shop"
      ? "shop/ventas/heatmap"
      : "caja/heatmap";

  const response = await api.get(endpoint, {
    params: { fechaInicio: fi, fechaFin: ff },
  });

  const payload = response.data;
  return payload?.data ?? payload; // ✅ compatible
};
