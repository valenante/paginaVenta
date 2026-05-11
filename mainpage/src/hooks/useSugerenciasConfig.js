import { useCallback, useEffect, useState } from "react";
import api from "../utils/api";

const BASE = "/admin/sugerencias";

// ─── Config completa ─────────────────────────────────
export function useSugerenciasConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`${BASE}/config`);
      setConfig(data.config || {});
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { config, loading, error, refetch: fetch };
}

// ─── Stats del motor ─────────────────────────────────
export function useSugerenciasStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`${BASE}/stats`);
      setData(res);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}

// ─── Acciones ────────────────────────────────────────
export async function updateSugerenciasConfig(payload) {
  const { data } = await api.put(`${BASE}/config`, payload);
  return data;
}

export async function autoDetectFases() {
  const { data } = await api.get(`${BASE}/auto-detect-fases`);
  return data;
}

export async function crearRegla(regla) {
  const { data } = await api.post(`${BASE}/reglas`, regla);
  return data;
}

export async function actualizarRegla(id, updates) {
  const { data } = await api.put(`${BASE}/reglas/${id}`, updates);
  return data;
}

export async function eliminarRegla(id) {
  const { data } = await api.delete(`${BASE}/reglas/${id}`);
  return data;
}

export async function toggleRegla(id) {
  const { data } = await api.patch(`${BASE}/reglas/${id}/toggle`);
  return data;
}
