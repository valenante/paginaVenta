// src/Hooks/useResumenCajaGestor.js
// Configuración y envío del resumen MENSUAL de caja (efectivo/tarjeta) al gestor.

import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

const DEFAULT = {
  activo: false,
  email: "",
  incluirEfectivo: true,
  incluirTarjeta: true,
  diaMes: 1,
  hora: "08:00",
  ultimoEnvio: null,
  ultimoPeriodoEnviado: "",
};

export function useResumenCajaGestor() {
  const [config, setConfig] = useState(DEFAULT);
  const [gestorEmailFallback, setGestorEmailFallback] = useState("");
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/resumen-caja-gestor/config");
      setConfig({ ...DEFAULT, ...(data.config || {}) });
      setGestorEmailFallback(data.gestorEmailFallback || "");
    } catch {
      // Silent fail — feature may not be deployed yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { config, gestorEmailFallback, loading, refetch: fetch };
}

export async function updateResumenCajaGestor(updates) {
  const { data } = await api.put("/admin/resumen-caja-gestor/config", updates);
  return data;
}

export async function enviarResumenCajaAhora(body = {}) {
  const { data } = await api.post("/admin/resumen-caja-gestor/enviar", body);
  return data;
}
