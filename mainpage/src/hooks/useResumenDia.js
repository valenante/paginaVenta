import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import * as logger from "../utils/logger";

export function useResumenDia() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await api.get("/dashboard/resumen-dia");
      if (res.data?.ok) setData(res.data);
     
      else setData(null);
    } catch (e) {
      logger.error("useResumenDia: error", e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, refetch: fetch };
}
