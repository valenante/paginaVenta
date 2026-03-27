export function getFirstPrice(precios) {
  if (Array.isArray(precios)) {
    const sorted = [...precios].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    return sorted[0]?.precio ?? 0;
  }
  return precios?.precioBase ?? 0;
}
