import api from '../../utils/api';

export const obtenerCajasPorRango = async (fi, ff) => {
  const response = await api.get("caja/caja", {
    params: { fechaInicio: fi, fechaFin: ff }
  });
  return response.data;
};
