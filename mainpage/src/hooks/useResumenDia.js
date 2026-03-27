import { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/api";
import * as logger from "../utils/logger";

export function useResumenDia() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const fetch = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/dashboard/resumen-dia", {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      // El interceptor ya desenvuelve { ok, data } → res.data es el payload directo
      setData(res.data || null);
    } catch (e) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      logger.error("useResumenDia: error", e);
      setData(null);
      setError("No se pudo cargar el resumen del día.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    return () => controllerRef.current?.abort();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
