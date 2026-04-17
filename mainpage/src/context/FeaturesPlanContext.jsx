// src/context/FeaturesPlanContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "./AuthContext";
import { useTenant } from "./TenantContext";

const FeaturesPlanContext = createContext(null);

export function FeaturesPlanProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { tenantId, tenant } = useTenant(); // slug del tenant, por ejemplo "zabor-feten"

  const [features, setFeatures] = useState([]);
  const [config, setConfig] = useState(null);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [alerta, setAlerta] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !tenantId) {
      setFeatures([]);
      setConfig(null);
      setLoadingFeatures(false);
      setAlerta(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const fetchFeatures = async () => {
      setLoadingFeatures(true);
      try {
        const endpoint =
          tenant?.tipoNegocio === "shop"
            ? "/shop/admin/features-plan"
            : "/admin/features-plan";

        const { data } = await api.get(endpoint, { signal: controller.signal });

        if (cancelled) return;

        setFeatures(data.features || []);
        setConfig(data.config || null);
        setAlerta(null);
      } catch (err) {
        if (cancelled || err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        console.error(
          "Error al cargar features-plan:",
          err.response?.status,
          err.response?.data
        );

        if (err.response?.status === 401) {
          setAlerta({
            tipo: "error",
            mensaje: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
          });
        } else {
          setAlerta({
            tipo: "error",
            mensaje: "Error al cargar funcionalidades del plan.",
          });
        }

        setFeatures([]);
        setConfig(null);
      } finally {
        if (!cancelled) setLoadingFeatures(false);
      }
    };

    fetchFeatures();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [user, tenantId, authLoading]);

  const hasFeature = (clave, fallback = false) => {
    if (!clave) return fallback;
    if (!features || features.length === 0) return fallback;
    return features.some((f) => f.clave === clave);
  };

  return (
    <FeaturesPlanContext.Provider
      value={{
        features,
        config,
        setConfig,
        hasFeature,
        loading: loadingFeatures,
        alerta,
        setAlerta,
      }}
    >
      {children}
    </FeaturesPlanContext.Provider>
  );
}

export const useFeaturesPlan = () => {
  const ctx = useContext(FeaturesPlanContext);
  if (!ctx) {
    throw new Error(
      "useFeaturesPlan debe usarse dentro de <FeaturesPlanProvider>"
    );
  }
  return ctx;
};
