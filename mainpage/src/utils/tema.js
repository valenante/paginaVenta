export const DEFAULT_TEMA_TPV = {
  bg: "#5B1010",
  surface: "#2b2b2b",
  surface2: "#3a3a3a",
  text: "#ffffff",
  textMuted: "rgba(255,255,255,0.75)",
  border: "rgba(255,255,255,0.12)",

  primary: "#9B1C1C",
  primaryHover: "#7E1616",
  secondary: "#4465e7",
  secondaryHover: "#3C4C8A",

  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#dc2626",
  info: "#0ea5e9",
  solicitado: "#e65100",
  productoListo: "#16a34a",
  todoJunto: "#8b5cf6",

  mesaCerradaBg: "#1a1a1a",
  mesaCerradaBorder: "#333333",
  mesaAbiertaBg: "#283593",
  mesaAbiertaBorder: "#3949ab",
  mesaMiaBg: "#1b5e20",
  mesaMiaBorder: "#2e7d32",
};

export const normalizarTemaTpv = (raw) => {
  if (!raw) return { ...DEFAULT_TEMA_TPV };

  // ✅ si ya es formato nuevo (tiene bg/primary/etc)
  if (raw.bg || raw.primary || raw.surface) {
    return { ...DEFAULT_TEMA_TPV, ...raw };
  }

  // ✅ soporte formato viejo (tu form actual)
  return {
    ...DEFAULT_TEMA_TPV,
    bg: raw.fondo ?? DEFAULT_TEMA_TPV.bg,
    text: raw.texto ?? DEFAULT_TEMA_TPV.text,
    surface2: raw.cardBg ?? DEFAULT_TEMA_TPV.surface2,
    border: raw.cardBorde ?? DEFAULT_TEMA_TPV.border,

    primary: raw.colorPrincipal ?? DEFAULT_TEMA_TPV.primary,
    secondary: raw.colorSecundario ?? DEFAULT_TEMA_TPV.secondary,

    // en el viejo no tienes hover de primary; usa principalHover si existía en colores
    secondaryHover: raw.botonHover ?? DEFAULT_TEMA_TPV.secondaryHover,
  };
};
