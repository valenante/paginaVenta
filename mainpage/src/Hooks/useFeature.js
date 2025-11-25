// src/hooks/useFeature.js
import { useConfig } from "../context/ConfigContext";

/**
 * path: puede ser "stockHabilitado" o "impresion.imprimirPedidosCocina"
 */
export function useFeature(path) {
  const { config, plan } = useConfig(); // si en ConfigProvider guardas también el plan

  // 1) Leer el booleano en Config (source of truth)
  let enabledInConfig = true;
  if (config && path) {
    const parts = path.split(".");
    let current = config;
    for (const p of parts) {
      if (current && Object.prototype.hasOwnProperty.call(current, p)) {
        current = current[p];
      } else {
        current = undefined;
        break;
      }
    }
    if (typeof current === "boolean") {
      enabledInConfig = current;
    }
  }

  // 2) Opcional: comprobar que el plan tenga esa feature
  let includedInPlan = true;
  if (plan?.features?.length && path) {
    const fromPlan = plan.features.find(
      (f) => f.configKey === path && f.activa !== false
    );
    includedInPlan = !!fromPlan;
  }

  return Boolean(enabledInConfig && includedInPlan);
}
