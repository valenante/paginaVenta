// src/Hooks/useRecetas.js
import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export function useReceta(productoId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!productoId) return;
    try {
      setLoading(true);
      const { data: res } = await api.get(`/admin/recetas/${productoId}`);
      setData(res);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [productoId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

export async function guardarReceta(productoId, lineas) {
  const { data } = await api.put(`/admin/recetas/${productoId}`, { lineas });
  return data;
}

export async function buscarIngredientes(q = "") {
  const { data } = await api.get("/admin/recetas/ingredientes", { params: { q } });
  return data.items || [];
}

export async function recalcularCostes() {
  const { data } = await api.post("/admin/recetas/recalcular");
  return data;
}
