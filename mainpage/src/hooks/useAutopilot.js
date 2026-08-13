import { useCallback, useEffect, useRef, useState } from "react";
import api from "../utils/api";

const REFRESH_MS = 5 * 60 * 1000; // 5 minutos

export function useAutopilot() {
  const [actions, setActions] = useState({ pendientes: [], ejecutadas: [] });
  const [badge, setBadge] = useState({ count: 0, severity: "ok" });
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchActions = useCallback(async () => {
    try {
      const { data } = await api.get("/autopilot/actions?limit=20");
      setActions({ pendientes: data.pendientes || [], ejecutadas: data.ejecutadas || [] });
      setBadge(data.badge || { count: 0, severity: "ok" });
    } catch {
      // best-effort — no romper si el endpoint aún no existe
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActions();
    intervalRef.current = setInterval(fetchActions, REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchActions]);

  const approve = useCallback(async (id) => {
    try {
      await api.post(`/autopilot/actions/${id}/approve`);
      fetchActions();
    } catch (err) {
      throw err;
    }
  }, [fetchActions]);

  const reject = useCallback(async (id) => {
    try {
      await api.post(`/autopilot/actions/${id}/reject`);
      fetchActions();
    } catch (err) {
      throw err;
    }
  }, [fetchActions]);

  const revert = useCallback(async (id) => {
    try {
      await api.post(`/autopilot/actions/${id}/revert`);
      fetchActions();
    } catch (err) {
      throw err;
    }
  }, [fetchActions]);

  return { actions, badge, loading, approve, reject, revert, refetch: fetchActions };
}
