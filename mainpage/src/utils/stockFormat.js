// Formatea stock decimal en función de las variantes de precio del producto.
// Ej: stock=4.8 con precios=[{copa, factorStock:0.2}, {botella, factorStock:1}]
//     → "4 botellas + 4 copas"
//
// Reglas:
// - Si todas las variantes tienen factorStock=1 (o no hay variantes con factor<1) → muestra solo el número.
// - Si hay una variante con factor=1 (la "unidad padre") y otra(s) con factor<1, se usa la padre como entero
//   y se reparte el resto en la variante de menor factor.
// - Si no hay padre (todas <1), usa la mayor como padre.
// - Stock negativo: usa el formato simple con el número.

// Formatea una cantidad de stock "en limpio": elimina el ruido de coma flotante
// (p. ej. 0.6999999999999986 → 0.7, -4.800000030000001 → -4.8) y quita los ceros
// decimales sobrantes (5 → "5", 0.20 → "0.2"). Mantiene el signo de los negativos
// (stock sobrevendido). Es la forma recomendada de pintar `stockActual`/`stockMinimo`.
export function formatCantidad(value, maxDecimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  // toFixed redondea a la precisión deseada y elimina el error binario; Number()
  // vuelve a número quitando ceros sobrantes; String() lo pasa a texto sin notación.
  return String(Number(n.toFixed(maxDecimals)));
}

function pluralize(label, n) {
  if (!label) return "";
  if (n === 1) return label;
  // simple: añade s si no termina en s
  return /s$/i.test(label) ? label : `${label}s`;
}

export function formatStock(stock, precios) {
  const n = Number(stock);
  if (!Number.isFinite(n)) return "0";

  const variantes = (precios || [])
    .filter((p) => Number(p?.factorStock) > 0)
    .map((p) => ({ ...p, factorStock: Number(p.factorStock) }));

  // Si no hay variantes o todas tienen factor=1 → comportamiento clásico
  const hayFraccional = variantes.some((v) => v.factorStock < 1);
  if (!variantes.length || !hayFraccional) {
    // Stock entero clásico
    return Number.isInteger(n) ? `${n}` : `${n.toFixed(2)}`;
  }

  // Stock negativo: muestra simple
  if (n < 0) return n.toFixed(2);

  // Variante "padre" (factor=1) o la más grande
  const padre = variantes.find((v) => v.factorStock === 1)
    || [...variantes].sort((a, b) => b.factorStock - a.factorStock)[0];
  // Variante "fracción" más pequeña
  const fraccion = [...variantes].sort((a, b) => a.factorStock - b.factorStock)[0];

  if (!padre || !fraccion || padre.clave === fraccion.clave) {
    return Number.isInteger(n) ? `${n}` : n.toFixed(2);
  }

  const padres = Math.floor(n / padre.factorStock);
  const resto = n - padres * padre.factorStock;
  const fracciones = Math.round(resto / fraccion.factorStock);

  const partes = [];
  if (padres > 0) partes.push(`${padres} ${pluralize(padre.label || padre.clave, padres)}`);
  if (fracciones > 0) partes.push(`${fracciones} ${pluralize(fraccion.label || fraccion.clave, fracciones)}`);
  if (!partes.length) return "0";
  return partes.join(" + ");
}

// Versión corta para badges/columnas estrechas
export function formatStockShort(stock, precios) {
  const n = Number(stock);
  if (!Number.isFinite(n)) return "0";
  const tieneFraccional = (precios || []).some((p) => Number(p?.factorStock) > 0 && Number(p.factorStock) < 1);
  if (!tieneFraccional) return Number.isInteger(n) ? `${n}` : n.toFixed(2);
  return n.toFixed(2);
}
