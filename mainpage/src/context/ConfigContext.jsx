import { createContext, useEffect, useState, useContext } from "react";
import api from "../utils/api";
import { useTenant } from "./TenantContext.jsx";
import { useConfigStyles } from "../Hooks/useConfigStyles";

// Crear contexto
export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const { tenantId } = useTenant() || {}; // sin try/catch
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!tenantId) {
        console.warn("⏸ [ConfigProvider] No hay tenantId definido, omitiendo carga de configuración.");
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/configuracion", {
          headers: { "x-tenant-id": tenantId },
        });
        setConfig(data);

        if (data.colores) {
          Object.entries(data.colores).forEach(([key, value]) => {
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

  useConfigStyles(config);

  return (
    <ConfigContext.Provider value={{ config, loading, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    console.warn("⚠️ useConfig se usó fuera de ConfigProvider. Se devuelve contexto vacío.");
    return { config: null, loading: false, setConfig: () => {} };
  }
  return context;
};
