// src/hooks/useTurnosAcceso.js
import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export function useTurnosAcceso() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/turnos-acceso/estado");
      setUsuarios(data.usuarios || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { usuarios, loading, refetch: fetch };
}

export async function toggleTurnoUsuario(userId, turnoActivo) {
  const { data } = await api.patch(`/admin/turnos-acceso/${userId}/toggle`, { turnoActivo });
  return data;
}

export async function bulkToggleTurnos(userIds, turnoActivo) {
  const { data } = await api.post("/admin/turnos-acceso/bulk-toggle", { userIds, turnoActivo });
  return data;
}
