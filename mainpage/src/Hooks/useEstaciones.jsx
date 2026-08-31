import { useEffect, useState } from "react";
import api from "../utils/api";

/**
 * useEstaciones — loads tenant stations from GET /estaciones
 * @returns {{ estaciones: Array<{value,label}>, loading: boolean }}
 */
export function useEstaciones() {
  const [estaciones, setEstaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/estaciones", {
          params: { includeInactive: 0 },
        });
        if (!alive) return;

        const raw = data?.items ?? data ?? [];
        const list = Array.isArray(raw) ? raw : [];
        setEstaciones(
          list.map((e) => ({
            value: e.slug || e.nombre || e._id,
            label: e.nombre || e.slug || e._id,
          }))
        );
      } catch (err) {
        console.error("[useEstaciones] Error:", err?.response?.status, err?.message);
        if (!alive) return;
        setEstaciones([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  return { estaciones, loading };
}
