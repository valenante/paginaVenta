import { createContext, useEffect, useState, useContext } from "react";
import api from "../utils/api";
import { useTenant } from "./TenantContext.jsx";
import { useConfigStyles } from "../hooks/useConfigStyles";

export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const { tenantId, tenant } = useTenant() || {};

  const tipoNegocio = (
    tenant?.tipoNegocio ||
    tenant?.suscripcion?.tipoNegocio ||
    "restaurante"
  ).toLowerCase();

  const [config, setConfig] = useState(null);
  const [planFeatures, setPlanFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!tenantId || !tenant) {
        // No bajar loading — el tenant aún no ha cargado.
        // Cuando TenantContext resuelva, este effect se re-ejecutará.
        return;
      }

      try {
        setLoading(true);

        // 🔥 ENDPOINT SEGÚN TIPO DE NEGOCIO
        const endpoint =
          tipoNegocio === "shop"
            ? "/shop/configuracion"
            : "/configuracion";
        const { data } = await api.get(endpoint);

        // Backend puede devolver { config, planFeatures } o solo config
        const cfg =
          data?.config && typeof data.config === "object"
            ? data.config
            : data;

        setConfig(cfg);

        // 🔑 Features del plan (si vienen)
        const feats =
          Array.isArray(cfg?.planFeatures) ? cfg.planFeatures : [];

        setPlanFeatures(feats);

        // 🎨 Colores base (branding)
        if (cfg?.colores) {
          Object.entries(cfg.colores).forEach(([key, value]) => {
            document.documentElement.style.setProperty(
              `--color-${key}`,
              value
            );
          });
        }
      } catch (err) {
        console.error(
          `❌ [ConfigContext] Error cargando configuración (${tipoNegocio}):`,
          err
        );
        setConfig(null);
        setPlanFeatures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [tenantId, tenant, tipoNegocio]);

  // 🎨 Aplica estilos avanzados (tema, fuentes, etc.)
  useConfigStyles(config);

  /**
   * 🔑 Helper unificado de features
   *
   * - "estadisticas_avanzadas"        → feature de PLAN
   * - "impresion.imprimirPedidos"    → flag booleana dentro de config
   */
  const hasFeature = (key, defaultValue = true) => {
    if (!key) return defaultValue;

    // 1️⃣ Feature de PLAN (sin puntos)
    if (!key.includes(".")) {
      return planFeatures.includes(key);
    }

    // 2️⃣ Feature dentro de CONFIG (con puntos)
    if (!config) return defaultValue;

    const parts = key.split(".");
    let current = config;

    for (const p of parts) {
      if (
        current &&
        Object.prototype.hasOwnProperty.call(current, p)
      ) {
        current = current[p];
      } else {
        return defaultValue;
      }
    }

    return typeof current === "boolean"
      ? current
      : defaultValue;
  };

  const refreshConfig = async () => {
    if (!tenantId || !tenant) {
      setConfig(null);
      setPlanFeatures([]);
      setLoading(false);
      return null;
    }

    const endpoint =
      tipoNegocio === "shop"
        ? "/shop/configuracion"
        : "/configuracion";

    // Cache-buster: el endpoint tiene cacheableResponse(60), necesitamos
    // forzar lectura fresca al hacer refresh explícito (post-save, rollback)
    const { data } = await api.get(endpoint, {
      params: { _t: Date.now() },
    });

    const cfg =
      data?.config && typeof data.config === "object"
        ? data.config
        : data;

    setConfig(cfg);

    // features si vienen
    const feats = Array.isArray(cfg?.planFeatures) ? cfg.planFeatures : [];
    setPlanFeatures(feats);

    return cfg;
  };

  return (
    <ConfigContext.Provider
      value={{
        config,
        loading,
        setConfig,
        refreshConfig,
        hasFeature,
        planFeatures,
        tipoNegocio, // 👈 útil para el frontend
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);

  if (!context) {
    console.warn(
      "⚠️ useConfig usado fuera de ConfigProvider. Devuelvo stub seguro."
    );
    return {
      config: null,
      loading: false,
      setConfig: () => { },
      hasFeature: () => false,
      planFeatures: [],
      tipoNegocio: "restaurante",
    };
  }

  return context;
};
