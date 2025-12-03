// src/context/FeaturesPlanContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "./AuthContext";
import { useTenant } from "./TenantContext";

const FeaturesPlanContext = createContext(null);

export function FeaturesPlanProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { tenantId } = useTenant(); // slug del tenant, por ejemplo "zabor-feten"

  const [features, setFeatures] = useState([]);
  const [config, setConfig] = useState(null);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [alerta, setAlerta] = useState(null);

  useEffect(() => {
    // Mientras el auth aún está resolviendo, no hacemos nada
    if (authLoading) return;

    // Si no hay usuario logueado → limpiamos y no llamamos a la API
    if (!user || !tenantId) {
      setFeatures([]);
      setConfig(null);
      setLoadingFeatures(false);
      setAlerta(null);
      return;
    }

    const fetchFeatures = async () => {
      setLoadingFeatures(true);
      try {
        const { data } = await api.get("/admin/features-plan", {
          headers: {
            "X-Tenant-Slug": tenantId
          }
        }); setFeatures(data.features || []);
        setConfig(data.config || null);
        setAlerta(null);
      } catch (err) {
        console.error(
          "Error al cargar features-plan:",
          err.response?.status,
          err.response?.data
        );

        // Si es 401, avisamos que la sesión caducó
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
        setLoadingFeatures(false);
      }
    };

    fetchFeatures();
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
