// src/hooks/useAdminDashboard.js
import { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/api";

export function useAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    resumen: null,
    caja: null,
    topProductos: null,
    staff: null,
    eliminaciones: null,
    reservas: null,
  });

  const controllerRef = useRef(null);

  const fetchAll = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const signal = controller.signal;

    setLoading(true);
    setError(null);

    try {
      const [resumenRes, cajaRes, topRes, staffRes, elimRes, reservasRes] = await Promise.allSettled([
        api.get("/dashboard/resumen-dia", { signal }),
        api.get("/caja/total-realizado", { signal }),
        api.get("/reportes/ventas-hoy", { signal }),
        api.get("/dashboard/resumen-staff", { signal }),
        api.get("/eliminaciones?limit=200", { signal }),
        api.get("/reservas", { signal }),
      ]);

      if (signal.aborted) return;

      const extract = (r) => {
        if (r.status !== "fulfilled") return null;
        const d = r.value?.data;
        return d?.data ?? d;
      };

      setData({
        resumen: extract(resumenRes),
        caja: extract(cajaRes),
        topProductos: extract(topRes),
        staff: extract(staffRes),
        eliminaciones: extract(elimRes),
        reservas: extract(reservasRes),
      });
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setError("Error al cargar el panel.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    return () => controllerRef.current?.abort();
  }, [fetchAll]);

  // Auto-refresh cada 60s
  useEffect(() => {
    const interval = setInterval(fetchAll, 60_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { loading, error, data, refresh: fetchAll };
}
