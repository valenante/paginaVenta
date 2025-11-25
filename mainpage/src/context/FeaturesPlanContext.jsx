import React from "react";
// src/context/FeaturesPlanContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../utils/api";

const FeaturesPlanContext = createContext(null);

export const FeaturesPlanProvider = ({ children }) => {
  const [features, setFeatures] = useState([]);
  const [plan, setPlan] = useState(null);
  const [configFromPlan, setConfigFromPlan] = useState(null); // opcional
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturesPlan = async () => {
      try {
        setLoading(true);
        setError(null);

        // 👉 endpoint que ya usas en RestauranteConfigPage
        const { data } = await api.get("/admin/features-plan");
        // data = { plan, features, config }
        setFeatures(data.features || []);
        setPlan(data.plan || null);
        setConfigFromPlan(data.config || null);
      } catch (err) {
        console.error("❌ Error cargando features del plan:", err);
        setError("Error al cargar funcionalidades del plan.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturesPlan();
  }, []);

  // Mapear por clave y por configKey para que sea cómodo de usar
  const featuresByClave = useMemo(() => {
    const map = {};
    features.forEach((f) => {
      if (f.clave) map[f.clave] = f;
    });
    return map;
  }, [features]);

  const featuresByConfigKey = useMemo(() => {
    const map = {};
    features.forEach((f) => {
      if (f.configKey) map[f.configKey] = f;
    });
    return map;
  }, [features]);

  const hasFeature = (clave) => !!featuresByClave[clave];
  const hasFeatureByConfigKey = (configKey) => !!featuresByConfigKey[configKey];

  return (
    <FeaturesPlanContext.Provider
      value={{
        features,
        plan,
        configFromPlan,
        loading,
        error,
        hasFeature,
        hasFeatureByConfigKey,
      }}
    >
      {children}
    </FeaturesPlanContext.Provider>
  );
};

export const useFeaturesPlan = () => {
  const ctx = useContext(FeaturesPlanContext);
  if (!ctx) {
    throw new Error("useFeaturesPlan debe usarse dentro de FeaturesPlanProvider");
  }
  return ctx;
};
