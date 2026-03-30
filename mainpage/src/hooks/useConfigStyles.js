import { useEffect } from "react";

export function useConfigStyles(config) {
  useEffect(() => {
    if (!config) {
      return;
    }

    if (!config.colores) {
      return;
    }

    Object.entries(config.colores).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    });

    if (config.estilo?.fuente) {
      document.documentElement.style.setProperty("--fuente-principal", config.estilo.fuente);
    }

    if (config.estilo?.tamanoTexto) {
      document.documentElement.style.setProperty("--tamano-texto-base", config.estilo.tamanoTexto);
    }

  }, [config]);
}
