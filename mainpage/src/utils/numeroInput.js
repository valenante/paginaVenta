// src/utils/numeroInput.js
//
// Utilidades ÚNICAS del panel para inputs numéricos de formularios.
//
// ── EL PROBLEMA QUE RESUELVEN ────────────────────────────────────────────────
// Convertir a número dentro del onChange rompe el input de dos formas:
//
//   1) No se puede borrar el campo. Number("") === 0 (y parseFloat("") || 0 === 0),
//      así que el estado nunca sale de 0. React, al ver estado === 0 con el input
//      vacío, REESCRIBE "0" en el DOM (react-dom: updateInput, rama
//      `0 === value && "" === element.value`). El "0" reaparece en cada tecla.
//
//   2) No se puede escribir "1.29". En un <input type="number"> el navegador
//      sanea .value: mientras en pantalla pone "1.", el change llega con "".
//      Si eso se convierte a 0, React reescribe "0" y destruye el buffer "1."
//      del navegador → el punto decimal nunca se queda.
//
// ── LA REGLA ─────────────────────────────────────────────────────────────────
//   · onChange  → guarda `e.target.value` TAL CUAL (string). Cero conversión.
//   · sembrar   → toInputText(valor)   ("" cuando no hay valor, nunca 0 forzado)
//   · submit    → toNumOrNull / toNum / clampNum + validación VISIBLE si es
//                 obligatorio. Nunca "" ni NaN a la base de datos.
//   · onBlur    → sólo cosmético (formatear). Jamás mutilar mientras se teclea.
//
// Acepta coma decimal ("1,29") por si el teclado del sitio la mete.

/** Texto para SEMBRAR el estado de un input numérico. null/undefined/"" → "". */
export function toInputText(v) {
  if (v === "" || v == null) return "";
  return String(v);
}

/**
 * Número o null. Nunca devuelve NaN.
 * Acepta coma decimal y los textos intermedios del tecleo ("1." → 1, ".5" → 0.5).
 */
export function toNumOrNull(v) {
  if (v === "" || v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const t = String(v).trim().replace(/,/g, ".");
  if (t === "" || t === "." || t === "-" || t === "-." || t === "+") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Número con valor por defecto explícito cuando el campo está vacío o es inválido. */
export function toNum(v, fallback = 0) {
  const n = toNumOrNull(v);
  return n === null ? fallback : n;
}

/** ¿El usuario escribió algo convertible a número? (para validar en el submit) */
export function hasNum(v) {
  return toNumOrNull(v) !== null;
}

/**
 * Clamp que RESPETA el vacío: null entra, null sale.
 * Úsalo al guardar/onBlur, nunca dentro del onChange.
 */
export function clampNumOrNull(v, min = -Infinity, max = Infinity) {
  const n = toNumOrNull(v);
  if (n === null) return null;
  return Math.min(max, Math.max(min, n));
}

/** Clamp con valor por defecto cuando el campo está vacío. */
export function clampNum(v, min = -Infinity, max = Infinity, fallback = min) {
  const n = clampNumOrNull(v, min, max);
  return n === null ? fallback : n;
}

/** Igual que clampNum pero forzando entero (para campos de "cuántos"). */
export function clampIntNum(v, min = -Infinity, max = Infinity, fallback = min) {
  const n = toNumOrNull(v);
  if (n === null) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
