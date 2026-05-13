// src/Hooks/useHorarios.js
import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export function useSemana(fecha) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get("/admin/horarios/semana", { params: { fecha } });
      setData(res);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [fecha]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

export function useConflictos(fecha) {
  const [conflictos, setConflictos] = useState([]);
  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/horarios/conflictos", { params: { fecha } });
      setConflictos(data.conflictos || []);
    } catch { /* ignore */ }
  }, [fecha]);
  useEffect(() => { fetch(); }, [fetch]);
  return { conflictos, refetch: fetch };
}

export async function asignarTurno(body) {
  const { data } = await api.post("/admin/horarios/asignar", body);
  return data;
}

export async function eliminarAsignacion(planillaId, asignacionId) {
  const { data } = await api.delete(`/admin/horarios/asignacion/${planillaId}/${asignacionId}`);
  return data;
}

export async function editarAsignacion(planillaId, asignacionId, updates) {
  const { data } = await api.patch(`/admin/horarios/asignacion/${planillaId}/${asignacionId}`, updates);
  return data;
}

export async function publicarSemana(fecha) {
  const { data } = await api.post("/admin/horarios/publicar", { fecha });
  return data;
}

export async function crearDisponibilidad(body) {
  const { data } = await api.post("/admin/horarios/disponibilidad", body);
  return data;
}

export function useResumenMensual(mes, anio) {
  const [data, setData] = useState(null);
  const fetch = useCallback(async () => {
    try {
      const { data: res } = await api.get("/admin/horarios/resumen", { params: { mes, anio } });
      setData(res);
    } catch { /* ignore */ }
  }, [mes, anio]);
  useEffect(() => { fetch(); }, [fetch]);
  return { data };
}
