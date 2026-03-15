// src/utils/media.js
// Las imágenes se sirven desde el servidor API, no desde el dominio del panel.

const VITE_API_URL = import.meta.env.VITE_API_URL || "";

const API_ORIGIN = (() => {
  try {
    return new URL(VITE_API_URL).origin;
  } catch {
    return VITE_API_URL.replace(/\/api\/?$/, "") || window.location.origin;
  }
})();

export function toImgSrc(u, { fallback = "" } = {}) {
  const s = String(u || "").trim();
  if (!s) return fallback;

  // Ya es absoluta
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  // Data URLs
  if (s.startsWith("data:")) return s;

  // Ruta absoluta desde raíz (/uploads/...)
  if (s.startsWith("/")) return `${API_ORIGIN}${s}`;

  // Ruta relativa sin / (uploads/products/abc.jpg)
  return `${API_ORIGIN}/${s}`;
}