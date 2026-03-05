// src/utils/media.js
export function toImgSrc(u, { fallback = "" } = {}) {
  const s = String(u || "").trim();
  if (!s) return fallback;

  // Ya es absoluta
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  // Uploads: siempre resuelve al origin actual (panel/carta/tpv)
  if (s.startsWith("/uploads/")) return `${window.location.origin}${s}`;

  // Data URLs
  if (s.startsWith("data:")) return s;

  // Si viene algo raro, devuelve tal cual o fallback
  return s || fallback;
}