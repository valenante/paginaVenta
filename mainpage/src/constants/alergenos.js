// Catálogo canónico de los 14 alérgenos del Reglamento (UE) 1169/2011, Anexo II.
// Mantener sincronizado con saas-api/src/constants/alergenos.js
// y carta/src/components/Carta/ProductoCard.jsx (mapping ALERGENOS).

export const ALERGENOS = [
  { codigo: 'gluten',       icono: '🌾', es: 'Gluten',       en: 'Gluten',      fr: 'Gluten' },
  { codigo: 'crustaceos',   icono: '🦐', es: 'Crustáceos',   en: 'Crustaceans', fr: 'Crustacés' },
  { codigo: 'huevo',        icono: '🥚', es: 'Huevo',        en: 'Egg',         fr: 'Œuf' },
  { codigo: 'pescado',      icono: '🐟', es: 'Pescado',      en: 'Fish',        fr: 'Poisson' },
  { codigo: 'cacahuetes',   icono: '🥜', es: 'Cacahuetes',   en: 'Peanuts',     fr: 'Arachides' },
  { codigo: 'soja',         icono: '🌱', es: 'Soja',         en: 'Soy',         fr: 'Soja' },
  { codigo: 'lactosa',      icono: '🥛', es: 'Lactosa',      en: 'Lactose',     fr: 'Lactose' },
  { codigo: 'frutos_secos', icono: '🌰', es: 'Frutos secos', en: 'Tree nuts',   fr: 'Fruits à coque' },
  { codigo: 'apio',         icono: '🌿', es: 'Apio',         en: 'Celery',      fr: 'Céleri' },
  { codigo: 'mostaza',      icono: '🌻', es: 'Mostaza',      en: 'Mustard',     fr: 'Moutarde' },
  { codigo: 'sesamo',       icono: '⚪', es: 'Sésamo',       en: 'Sesame',      fr: 'Sésame' },
  { codigo: 'sulfitos',     icono: '🍷', es: 'Sulfitos',     en: 'Sulphites',   fr: 'Sulfites' },
  { codigo: 'altramuces',   icono: '🌼', es: 'Altramuces',   en: 'Lupin',       fr: 'Lupin' },
  { codigo: 'moluscos',     icono: '🐚', es: 'Moluscos',     en: 'Molluscs',    fr: 'Mollusques' },
];

export const ALERGENOS_CODIGOS = ALERGENOS.map((a) => a.codigo);

export const ALERGENOS_BY_CODIGO = ALERGENOS.reduce((acc, a) => {
  acc[a.codigo] = a;
  return acc;
}, {});

// Normaliza un valor heredado a su código canónico cuando es posible.
// Acepta variantes en mayúsculas, con tildes, con espacios o guiones.
// Devuelve null si no se puede mapear.
export function normalizarAlergeno(valor) {
  if (!valor) return null;
  const limpio = String(valor)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s-]+/g, '_');
  return ALERGENOS_BY_CODIGO[limpio] ? limpio : null;
}

// Toma dos arrays heredados (alergenos, alergenosTrazas) y los devuelve
// saneados: códigos canónicos + lista de valores raros que no se pudieron mapear.
export function sanearAlergenos(alergenos = [], trazas = []) {
  const canonicos = new Set();
  const trazasCanonicas = new Set();
  const raros = [];

  for (const v of alergenos || []) {
    const c = normalizarAlergeno(v);
    if (c) canonicos.add(c);
    else if (v) raros.push(v);
  }
  for (const v of trazas || []) {
    const c = normalizarAlergeno(v);
    if (c) trazasCanonicas.add(c);
    else if (v) raros.push(v);
  }

  // Si un alérgeno está en CONTIENE, no debe estar en TRAZAS (CONTIENE gana).
  for (const c of canonicos) trazasCanonicas.delete(c);

  return {
    alergenos: Array.from(canonicos),
    alergenosTrazas: Array.from(trazasCanonicas),
    raros,
  };
}
