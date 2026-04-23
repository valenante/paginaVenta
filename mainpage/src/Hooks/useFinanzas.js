// hooks/useFinanzas.js
// Fetch + estado para todos los endpoints del módulo Finanzas.
// Cada función usa SWR-style: loading + data + error + refetch.

import { useCallback, useEffect, useState } from "react";
import api from "../utils/api";

const BASE = "/admin/finanzas";

function useEndpoint(endpoint, params, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get(endpoint, { params });
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Dashboard ────────────────────────────────────────────
export function useFinanzasDashboard({ desde, hasta }) {
  return useEndpoint(
    `${BASE}/dashboard`,
    { desde, hasta },
    [desde, hasta]
  );
}

// ─── Productos rentabilidad ───────────────────────────────
export function useFinanzasProductos({ desde, hasta, sortBy = "revenue", page = 1, pageSize = 20, q = "", soloSinCoste = false, incluirSinVentas = false }) {
  return useEndpoint(
    `${BASE}/productos-rentabilidad`,
    { desde, hasta, sortBy, page, pageSize, q, soloSinCoste, incluirSinVentas },
    [desde, hasta, sortBy, page, pageSize, q, soloSinCoste, incluirSinVentas]
  );
}

// ─── Tendencia ────────────────────────────────────────────
export function useFinanzasTendencia({ meses = 12 }) {
  return useEndpoint(
    `${BASE}/tendencia`,
    { meses },
    [meses]
  );
}

// ─── Fase 3: analytics por proveedor ──────────────────────
export function useFinanzasAnalyticsProveedor({ proveedorId, desde, hasta }) {
  return useEndpoint(
    `${BASE}/proveedores/${proveedorId}/analytics`,
    { desde, hasta },
    [proveedorId, desde, hasta]
  );
}

// ─── Gastos fijos ─────────────────────────────────────────
export function useGastosFijos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get(`${BASE}/gastos-fijos`);
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const crear = useCallback(async (payload) => {
    const { data } = await api.post(`${BASE}/gastos-fijos`, payload);
    await fetch();
    return data;
  }, [fetch]);

  const editar = useCallback(async (id, payload) => {
    const { data } = await api.put(`${BASE}/gastos-fijos/${id}`, payload);
    await fetch();
    return data;
  }, [fetch]);

  const borrar = useCallback(async (id) => {
    await api.delete(`${BASE}/gastos-fijos/${id}`);
    await fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch, crear, editar, borrar };
}
