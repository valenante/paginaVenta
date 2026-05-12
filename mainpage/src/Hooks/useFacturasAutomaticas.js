// src/hooks/useFacturasAutomaticas.js
// Hook para gestionar facturas automáticas (inbound invoices).

import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export function useInboundJobs({ estado = "", page = 1 } = {}) {
  const [data, setData] = useState({ items: [], total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page };
      if (estado) params.estado = estado;
      const { data: res } = await api.get("/admin/facturas-automaticas", { params });
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [estado, page]);

  useEffect(() => { fetch(); }, [fetch]);
  return { ...data, loading, error, refetch: fetch };
}

export function useInboundStats() {
  const [stats, setStats] = useState({ pending: 0, completedMonth: 0, totalProcessed: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/facturas-automaticas/stats");
      setStats(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { ...stats, loading, refetch: fetch };
}

export async function aprobarJob(id, overrides = {}) {
  const { data } = await api.patch(`/admin/facturas-automaticas/${id}/aprobar`, overrides);
  return data;
}

export async function rechazarJob(id, motivo = "") {
  const { data } = await api.patch(`/admin/facturas-automaticas/${id}/rechazar`, { motivo });
  return data;
}

export async function reprocesarJob(id) {
  const { data } = await api.post(`/admin/facturas-automaticas/${id}/reprocesar`);
  return data;
}

export function useGmailStatus() {
  const [data, setData] = useState({ connected: false, emailAddress: null, lastSyncAt: null });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data: res } = await api.get("/admin/gmail/status");
      setData(res);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { ...data, loading, refetch: fetch };
}

export async function getGmailAuthUrl() {
  const { data } = await api.get("/admin/gmail/auth-url");
  return data.url;
}

export async function disconnectGmail() {
  const { data } = await api.delete("/admin/gmail/disconnect");
  return data;
}

export async function syncGmailNow() {
  const { data } = await api.post("/admin/gmail/sync");
  return data;
}
