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
