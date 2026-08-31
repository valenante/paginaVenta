// src/hooks/useAdminDashboard.js
import { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/api";

export function useAdminDashboard(fecha = null, turno = null) {
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

    const turnoParam = turno ? `&turno=${encodeURIComponent(turno)}` : "";
    const q = fecha ? `?fecha=${encodeURIComponent(fecha)}${turnoParam}` : turno ? `?turno=${encodeURIComponent(turno)}` : "";
    const qLimit = fecha ? `&fecha=${encodeURIComponent(fecha)}${turnoParam}` : turnoParam;

    try {
      const [resumenRes, cajaRes, topRes, staffRes, elimRes, reservasRes] = await Promise.allSettled([
        api.get(`/dashboard/resumen-dia${q}`, { signal }),
        api.get(`/dashboard/resumen-caja${q}`, { signal }),
        api.get(`/reportes/ventas-hoy${q}`, { signal }),
        api.get(`/dashboard/resumen-staff${q}`, { signal }),
        api.get(`/eliminaciones?limit=200${qLimit}`, { signal }),
        // Reservas: solo hoy tiene sentido; si hay fecha usa endpoint específico
        fecha
          ? api.get(`/reservas/fecha?fecha=${encodeURIComponent(fecha)}`, { signal })
          : api.get(`/reservas`, { signal }),
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
  }, [fecha, turno]);

  useEffect(() => {
    fetchAll();
    return () => controllerRef.current?.abort();
  }, [fetchAll]);

  // Auto-refresh cada 60s — solo si la fecha es hoy (operativa)
  useEffect(() => {
    const ahora = new Date();
    const d = new Date(ahora);
    if (ahora.getUTCHours() < 2) d.setUTCDate(d.getUTCDate() - 1);
    const hoyOp = d.toISOString().slice(0, 10);
    if (fecha && fecha !== hoyOp) return;

    const interval = setInterval(fetchAll, 60_000);
    return () => clearInterval(interval);
  }, [fetchAll, fecha]);

  return { loading, error, data, refresh: fetchAll };
}
