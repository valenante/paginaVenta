// src/hooks/useStockAlertas.js
//
// Fase 4 — polling de alertas de stock para el badge del sidebar
// y el panel dropdown. 5 minutos es un buen compromiso; el usuario
// puede forzar refresh desde el panel.

import { useCallback, useEffect, useRef, useState } from "react";
import api from "../utils/api";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min

export function useStockAlertasCount({ enabled = true } = {}) {
  const [count, setCount] = useState(0);
  const [criticas, setCriticas] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      const { data } = await api.get("/stock/alertas/count");
      setCount(Number(data?.count || 0));
      setCriticas(Number(data?.criticas || 0));
    } catch {
      // Silencioso: la sidebar no debe mostrar errores
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetch();
    timerRef.current = setInterval(fetch, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, fetch]);

  return { count, criticas, loading, refresh: fetch };
}

export function useStockAlertas({ soloRotura = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: res } = await api.get("/stock/alertas", {
        params: soloRotura ? { soloRotura: "true" } : undefined,
      });
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
  }, [soloRotura]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
