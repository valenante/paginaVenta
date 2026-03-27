export function toNum(v, fallback = 0) {
  if (v === "" || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function clampMin(n, min = 0) {
  return Math.max(min, n);
}
