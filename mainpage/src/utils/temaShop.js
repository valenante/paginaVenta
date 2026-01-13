// utils/temaShop.js
export const DEFAULT_TEMA_SHOP = {
  bg: "#f7f7f7",
  surface: "#ffffff",
  surface2: "#f1f1f1",
  text: "#1f2937",
  textMuted: "rgba(31,41,55,0.65)",
  border: "#e5e7eb",

  primary: "#2563eb",
  primaryHover: "#1d4ed8",

  secondary: "#10b981",        // 👈 añadido (verde shop típico)
  secondaryHover: "#059669",   // 👈 añadido

  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#dc2626",
  info: "#0ea5e9",
};

export const normalizarTemaShop = (raw) => {
  if (!raw) return { ...DEFAULT_TEMA_SHOP };

  // ✅ formato nuevo
  if (raw.bg || raw.primary || raw.surface) {
    return { ...DEFAULT_TEMA_SHOP, ...raw };
  }

  // 🧓 soporte legacy (por si acaso)
  return {
    ...DEFAULT_TEMA_SHOP,
    bg: raw.fondo ?? DEFAULT_TEMA_SHOP.bg,
    text: raw.texto ?? DEFAULT_TEMA_SHOP.text,
    surface2: raw.cardBg ?? DEFAULT_TEMA_SHOP.surface2,
    border: raw.cardBorde ?? DEFAULT_TEMA_SHOP.border,

    primary: raw.colorPrincipal ?? DEFAULT_TEMA_SHOP.primary,
    secondary: raw.colorSecundario ?? DEFAULT_TEMA_SHOP.secondary,
    secondaryHover: raw.botonHover ?? DEFAULT_TEMA_SHOP.secondaryHover,
  };
};
