// src/context/ConfigContext.jsx
import { createContext, useEffect, useState, useContext } from "react";
import api from "../utils/api";
import { useTenant } from "./TenantContext.jsx";
// 👇 ojo con la ruta/case, en tu repo creo que es "hooks", no "Hooks"
import { useConfigStyles } from "../Hooks/useConfigStyles";

export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const { tenantId } = useTenant() || {};
  const [config, setConfig] = useState(null);
  const [planFeatures, setPlanFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!tenantId) {
        console.warn(
          "⏸ [ConfigProvider] No hay tenantId definido, omitiendo carga de configuración."
        );
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/configuracion", {
          headers: { "x-tenant-id": tenantId },
        });

        // Backend devuelve { config, planFeatures } o directamente el doc
        const cfg = data.config || data;
        const feats = Array.isArray(data.planFeatures)
          ? data.planFeatures.map(f => (typeof f === "string" ? f : f.clave))
          : [];

        // cfg es la config YA normalizada según backend
        setConfig(cfg);

        // planFeatures normales
        setPlanFeatures(cfg.planFeatures || []);


        // Colores base
        if (cfg.colores) {
          Object.entries(cfg.colores).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--color-${key}`, value);
          });
        }
      } catch (err) {
        console.error("❌ [ConfigContext] Error al cargar configuración:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [tenantId]);

  // Aplica estilos avanzados (tema, fuentes, etc.)
  useConfigStyles(config);

  // 🔑 Helper unificado:
  //  - "estadisticas_avanzadas"        → feature del PLAN (slug)
  //  - "impresion.imprimirPedidos..."  → flag booleana dentro de config
  const hasFeature = (key, defaultValue = true) => {
    if (!key) return defaultValue;

    // 1) Feature de PLAN (sin punto)
    if (!key.includes(".")) {
      const enabled = planFeatures.includes(key);
      return enabled;
    }

    // 2) Feature configurable en CONFIG (con puntos)
    if (!config) return defaultValue;

    const parts = key.split(".");
    let current = config;

    for (const p of parts) {
      if (current && Object.prototype.hasOwnProperty.call(current, p)) {
        current = current[p];
      } else {
        return defaultValue;
      }
    }

    const result =
      typeof current === "boolean" ? current : defaultValue;

    return result;
  };

  return (
    <ConfigContext.Provider
      value={{ config, loading, setConfig, hasFeature, planFeatures }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    console.warn(
      "⚠️ useConfig se usó fuera de ConfigProvider. Devuelvo stub para evitar petadas."
    );
    return {
      config: null,
      loading: false,
      setConfig: () => { },
      hasFeature: () => false,
      planFeatures: [],
    };
  }
  return context;
};
