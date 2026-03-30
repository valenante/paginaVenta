// src/hooks/useFeature.js
import { useConfig } from "../context/ConfigContext";
import { useFeaturesPlan } from "../context/FeaturesPlanContext";

/**
 * Unified feature check.
 *
 * - "estadisticas_avanzadas"       → plan-level feature (no dots) → FeaturesPlanContext
 * - "impresion.imprimirPedidos"    → config boolean flag (dots)   → ConfigContext
 */
export function useFeature(path) {
  const { config } = useConfig();
  const { hasFeature: hasPlanFeature } = useFeaturesPlan();

  if (!path) return false;

  // Plan-level feature: delegate to the dedicated features-plan context
  if (!path.includes(".")) {
    return hasPlanFeature(path);
  }

  // Config boolean flag: traverse the config object
  if (!config) return true;

  const parts = path.split(".");
  let current = config;

  for (const p of parts) {
    if (current && Object.prototype.hasOwnProperty.call(current, p)) {
      current = current[p];
    } else {
      return true; // key absent → default enabled
    }
  }

  return typeof current === "boolean" ? current : true;
}
