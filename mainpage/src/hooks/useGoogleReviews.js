import { useCallback, useEffect, useState } from "react";
import api from "../utils/api";

const BASE = "/admin/google";

// ─── Status de la integración ────────────────────────────
export function useGoogleStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get(`${BASE}/status`);
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Listado de reseñas (paginado + filtro) ──────────────
export function useGoogleReviews({ status, page = 1, limit = 20 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (status) params.status = status;
      const { data: res } = await api.get(`${BASE}/reviews`, { params });
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Reseñas pendientes ──────────────────────────────────
export function useGooglePending() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get(`${BASE}/reviews/pending`);
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Acciones ────────────────────────────────────────────
export async function approveReview(id) {
  const { data } = await api.post(`${BASE}/reviews/${id}/approve`);
  return data;
}

export async function rejectReview(id, reason) {
  const { data } = await api.post(`${BASE}/reviews/${id}/reject`, { reason });
  return data;
}

export async function updateGoogleConfig(payload) {
  const { data } = await api.put(`${BASE}/config`, payload);
  return data;
}

export async function getAuthUrl() {
  const { data } = await api.get(`${BASE}/auth-url`);
  return data;
}

export async function disconnectGoogle() {
  const { data } = await api.delete(`${BASE}/disconnect`);
  return data;
}
