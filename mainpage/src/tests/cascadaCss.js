/**
 * cascadaCss.js — el color que PINTA el navegador, calculado en jsdom (lote/panel-reservas-estilo, R4).
 *
 * POR QUÉ EXISTE. La red de estilo de las vueltas R2/R3 leía el CSS por el NOMBRE del selector («las reglas
 * que nombran `reserva`, `rc-` o `.adm__badge--`»). El ataque visual 3 añadió cinco reglas con selectores
 * neutros (`.reservas-config-page td .badge`, `.adm__modal-list-row > span.adm__badge`, `.rc-alergias` en
 * index.css…) y volvió el aspecto EXACTO de producción con las 35 pruebas en verde. Una red que mira nombres
 * protege nombres. Esto mira lo que acaba pintado.
 *
 * QUÉ HACE. Sobre un DOM ya montado (testing-library), resuelve la cascada como el navegador:
 *  · TODAS las hojas `.css` de `src/` (un SPA acumula las hojas de cada trozo que visitas: es lo que volvió
 *    invisible «Cancelar» tras pasar por /pro). Es el PEOR CASO de lo que puede estar cargado.
 *  · especificidad, orden, `!important`, estilo en línea, hoja del agente de usuario mínima.
 *  · el orden ENTRE ficheros no se conoce (lo decide el empaquetado): se calcula en orden directo y en orden
 *    inverso, y quien llama exige que las DOS pasadas cumplan.
 *  · `@media` evaluado para un ancho y alto concretos (jsdom NO lo hace: `MediaList-impl.js` sólo acepta
 *    «all»/«screen» y descarta todo `max-width`).
 *  · `:hover` (se marca la fila y sus antepasados), `::before`/`::after` con `content`.
 *  · `var()` con su valor heredado y su respaldo, y las abreviadas (`background`, `border`, `grid-row`…)
 *    expandidas DESPUÉS de sustituir `var()`, que es lo que hace el navegador.
 *  · herencia de `color` y `visibility`; `opacity` acumulada; degradados como varios fondos posibles.
 *
 * LÍMITES (dichos, Art. 9): no hay maquetación, así que no mide solapes en píxeles (eso lo mide la sonda de
 * navegador de lotes/PANEL-RESERVAS-ESTILO/sonda/); `:focus`, `:active` y demás estados se tratan como NO activos.
 *
 * R5 · FALLA EN ALTO ante lo que no sabe medir (ataque visual 4, D-1452). Antes, un color que no sabía leer
 * contaba como transparente, las reglas con `::first-line` se tiraban y un relleno hecho con sombra, contorno o
 * imagen no era «fondo»: 13 formas de devolver el verde o el rosa con la red en verde. Ahora va a `noEvaluables`
 * (y quien llama falla) todo esto, SÓLO si toca un elemento visible del DOM medido:
 *  · un color que `parseColor` no lee (`color-mix()`, `oklch()`, `mistyrose`…), en cualquier propiedad medida;
 *  · un fondo con imagen que no es un degradado (`url()`, `image-set()`…) o un degradado con un color ilegible;
 *  · un pseudo-elemento que no sea `::before`/`::after` (`::first-line`, `::placeholder`, `::selection`…), salvo
 *    los de `PSEUDO_FUERA` (barra de desplazamiento y controles internos del navegador), que se CUENTAN;
 *  · una propiedad que cambia el color pintado y el motor no calcula (`filter`, `mix-blend-mode`,
 *    `border-image`, `-webkit-text-fill-color`, `background-clip: text`…), salvo los valores de `NEUTROS`;
 *  · una regla dentro de `@layer`, `@container`, `@scope` u otra regla-@ desconocida, o con CSS anidado;
 *  · una regla bajo un `@media` que no entiende (sintaxis de rango `(width >= …)`, `min-resolution`…): se da por
 *    cierta, como antes, pero ahora grita.
 * Y los rellenos que no van en `background` se MIDEN: borde, contorno y sombra (también la interior) dan su
 * color en `rellenos()`, para medir su distancia igual que un fondo.
 * Un selector que jsdom no sabe evaluar tampoco se ignora: va igual a `noEvaluables`.
 */
import fs from "node:fs";
import path from "node:path";

// ── colores ─────────────────────────────────────────────────────────────────────────────────────
const NOMBRADOS = {
  transparent: [0, 0, 0, 0], white: [255, 255, 255, 1], black: [0, 0, 0, 1], gray: [128, 128, 128, 1],
  grey: [128, 128, 128, 1], red: [255, 0, 0, 1], green: [0, 128, 0, 1], blue: [0, 0, 255, 1],
  orange: [255, 165, 0, 1], purple: [128, 0, 128, 1], pink: [255, 192, 203, 1], yellow: [255, 255, 0, 1],
  silver: [192, 192, 192, 1], gold: [255, 215, 0, 1], lightgray: [211, 211, 211, 1], lightgrey: [211, 211, 211, 1],
  darkgray: [169, 169, 169, 1], whitesmoke: [245, 245, 245, 1], gainsboro: [220, 220, 220, 1],
  // agente de usuario (Chrome)
  buttonface: [239, 239, 239, 1], buttontext: [0, 0, 0, 1], canvas: [255, 255, 255, 1], canvastext: [0, 0, 0, 1],
  field: [255, 255, 255, 1], fieldtext: [0, 0, 0, 1], buttonborder: [118, 118, 118, 1],
};
export function parseColor(s) {
  if (s == null) return null;
  s = String(s).trim().toLowerCase();
  if (NOMBRADOS[s]) return [...NOMBRADOS[s]];
  let m = s.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = h.replace(/./g, "$&$&");
    const v = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return v.concat(h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1);
  }
  m = s.match(/^rgba?\(([^()]*)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    const n = p.map((x, i) => (x.endsWith("%") ? (i < 3 ? (parseFloat(x) / 100) * 255 : parseFloat(x) / 100) : parseFloat(x)));
    if (n.slice(0, 3).some(Number.isNaN)) return null;
    return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1];
  }
  m = s.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/);
  if (m) {
    const [h, sa, l] = [Number(m[1]) / 360, Number(m[2]) / 100, Number(m[3]) / 100];
    const q = l < 0.5 ? l * (1 + sa) : l + sa - l * sa, p = 2 * l - q;
    const t = (x) => { x = (x + 1) % 1; return x < 1 / 6 ? p + (q - p) * 6 * x : x < 1 / 2 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p; };
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : Number(m[4]);
    return [t(h + 1 / 3), t(h), t(h - 1 / 3)].map((v) => v * 255).concat(a);
  }
  return null;
}
// `fg` encima de `bg` (los dos rgba; el resultado es opaco si `bg` lo es)
export const encima = (fg, bg) => {
  const a = fg[3] + bg[3] * (1 - fg[3]);
  if (a === 0) return [0, 0, 0, 0];
  return [0, 1, 2].map((i) => (fg[i] * fg[3] + bg[i] * bg[3] * (1 - fg[3])) / a).concat(a);
};
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
// WCAG 2.x (con su umbral 0.03928, el de la norma)
export const luminancia = (c) => {
  const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contraste = (a, b) => { const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export function lab(c) {
  const [r, g, b] = c.slice(0, 3).map(lin);
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f((r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047);
  const fy = f(r * 0.2126729 + g * 0.7151522 + b * 0.072175);
  const fz = f((r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
// CIEDE2000 (comprobada contra los pares de referencia de Sharma, Wu y Dalal 2005).
export function deltaE2000Lab([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2, C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const ang = (a, b) => { if (a === 0 && b === 0) return 0; const x = Math.atan2(b, a) / rad; return x < 0 ? x + 360 : x; };
  const h1p = ang(a1p, b1), h2p = ang(a2p, b2);
  const dL = L2 - L1, dC = C2p - C1p;
  let dh = 0;
  if (C1p * C2p !== 0) { dh = h2p - h1p; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; }
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh / 2) * rad);
  const Lb = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hb = h1p + h2p;
  if (C1p * C2p !== 0) hb = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + (h1p + h2p < 360 ? 360 : -360)) / 2 : (h1p + h2p) / 2;
  const T = 1 - 0.17 * Math.cos((hb - 30) * rad) + 0.24 * Math.cos(2 * hb * rad) + 0.32 * Math.cos((3 * hb + 6) * rad) - 0.2 * Math.cos((4 * hb - 63) * rad);
  const dTh = 30 * Math.exp(-(((hb - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const SL = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2), SC = 1 + 0.045 * Cbp, SH = 1 + 0.015 * Cbp * T;
  const RT = -Math.sin(2 * dTh * rad) * RC;
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}
export const deltaE2000 = (c1, c2) => deltaE2000Lab(lab(c1), lab(c2));

// ── lectura de hojas ────────────────────────────────────────────────────────────────────────────
export function ficherosCss(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") ficherosCss(p, acc); }
    else if (e.name.endsWith(".css")) acc.push(p);
  }
  return acc.sort();
}
const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
// índice del `}` que cierra el `{` en `i` (respeta comillas)
function cierre(s, i) {
  let prof = 0, q = null;
  for (; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === "\\") i++; else if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") q = ch;
    else if (ch === "{") prof++;
    else if (ch === "}") { prof--; if (prof === 0) return i; }
  }
  return s.length;
}
// trocea por `sep` en el nivel superior (fuera de paréntesis, corchetes y comillas)
export function trocear(s, sep) {
  const out = []; let prof = 0, q = null, ini = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === "\\") i++; else if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") q = ch;
    else if (ch === "(" || ch === "[") prof++;
    else if (ch === ")" || ch === "]") prof--;
    else if (prof === 0 && (sep === " " ? /\s/.test(ch) : ch === sep)) { out.push(s.slice(ini, i)); ini = i + 1; }
  }
  out.push(s.slice(ini));
  return out.map((x) => x.trim()).filter(Boolean);
}
function declaraciones(cuerpo, origen = "(en línea)") {
  const out = [];
  for (const d of trocear(cuerpo, ";")) {
    const i = d.indexOf(":");
    if (i < 0) continue;
    const prop = d.slice(0, i).trim();
    let val = d.slice(i + 1).trim();
    const imp = /!\s*important\s*$/i.test(val);
    if (imp) val = val.replace(/!\s*important\s*$/i, "").trim();
    out.push({ prop: prop.startsWith("--") ? prop : prop.toLowerCase(), val, imp, origen });
  }
  return out;
}
const PSEUDO_CAJA = /::?(before|after)\s*$/i;
// Cualquier otro pseudo-elemento (también `::before:hover`, que no es una caja «en reposo»).
const PSEUDO_OTRO = /::([\w-]+)|:(first-line|first-letter)\b/i;
// Pseudo-elementos que NO se miden, por DECISIÓN (Art. 5): no pintan bajo el texto de la pantalla. Se CUENTAN
// en `fuera` para que se vea cuántos hay; cualquier otro que toque el DOM medido falla en alto.
export const PSEUDO_FUERA = {
  "-webkit-scrollbar": "barra de desplazamiento", "-webkit-scrollbar-thumb": "barra de desplazamiento",
  "-webkit-scrollbar-track": "barra de desplazamiento", "-webkit-scrollbar-corner": "barra de desplazamiento",
  "-webkit-inner-spin-button": "flechas de un campo numérico", "-webkit-outer-spin-button": "flechas de un campo numérico",
  "-webkit-calendar-picker-indicator": "icono del selector de fecha nativo", "-webkit-details-marker": "triángulo de <details>",
  "-webkit-slider-thumb": "tirador de un deslizador", "-moz-range-thumb": "tirador de un deslizador (Firefox)",
};
// Especificidad [a, b, c]
export function especificidad(sel) {
  let a = 0, b = 0, c = 0, i = 0;
  const s = sel;
  const ident = () => { const m = s.slice(i).match(/^-?[_a-zA-Z -￿][-\w -￿]*/); i += m ? m[0].length : 0; return m ? m[0] : ""; };
  const arg = () => { let prof = 1; const ini = i; while (i < s.length && prof) { if (s[i] === "(") prof++; else if (s[i] === ")") prof--; i++; } return s.slice(ini, i - 1); };
  while (i < s.length) {
    const ch = s[i];
    if (ch === "#") { i++; ident(); a++; }
    else if (ch === ".") { i++; ident(); b++; }
    else if (ch === "[") { while (i < s.length && s[i] !== "]") i++; i++; b++; }
    else if (ch === ":" && s[i + 1] === ":") { i += 2; ident(); if (s[i] === "(") { i++; arg(); } c++; }
    else if (ch === ":") {
      i++; const n = ident().toLowerCase();
      if (s[i] === "(") {
        i++; const x = arg();
        if (n === "where") { /* 0 */ }
        else if (["is", "not", "has", "matches"].includes(n)) {
          const m = trocear(x, ",").map(especificidad).sort((p, q) => q[0] - p[0] || q[1] - p[1] || q[2] - p[2])[0] || [0, 0, 0];
          a += m[0]; b += m[1]; c += m[2];
        } else b++;
      } else if (["before", "after", "first-line", "first-letter"].includes(n)) c++;
      else b++;
    } else if (/[a-zA-Z]/.test(ch)) { ident(); c++; }
    else i++;
  }
  return [a, b, c];
}
// clave de índice: la última compuesta (el sujeto) → una clase, un id o una etiqueta
function claveSujeto(sel) {
  const partes = trocear(sel.replace(/\s*([>+~])\s*/g, " $1 "), " ").filter((x) => !/^[>+~]$/.test(x));
  const ult = (partes[partes.length - 1] || "").replace(/\([^()]*(?:\([^()]*\)[^()]*)*\)/g, "");
  let m = ult.match(/\.(-?[_a-zA-Z][-\w]*)/);
  if (m) return `c:${m[1]}`;
  m = ult.match(/#(-?[_a-zA-Z][-\w]*)/);
  if (m) return `i:${m[1]}`;
  m = ult.match(/^([a-zA-Z][-\w]*)/);
  if (m) return `t:${m[1].toLowerCase()}`;
  return "*";
}
// Estados: `:hover` casa como `.__hv`, `:active` como `.__ac` y la familia del foco como `.__fc`; quien llama
// los enciende con `conRaton()` / `conEstado()`. Los demás (`:visited`, `:target`, autorrelleno, los de un
// navegador) no se dan en esta pantalla y se vuelven «nunca» (dicho en el CIERRE, no medido).
const FOCO = /:(?:focus-visible|focus-within|focus)(?![-\w(])/gi;
const ESTADOS_INACTIVOS = /:(?:visited|target|-webkit-autofill|autofill|-moz-[\w-]+|-webkit-[\w-]+)(?![-\w(])/gi;
function paraCasar(sel) {
  return sel.replace(/:hover(?![-\w])/g, ".__hv").replace(/:active(?![-\w])/g, ".__ac").replace(FOCO, ".__fc").replace(ESTADOS_INACTIVOS, ".__nunca");
}

// Hoja del agente de usuario MÍNIMA (sólo lo que pinta fondo o borde y lo que oculta).
const HOJA_UA = `
[hidden], head, script, style, template { display: none; }
button { background-color: buttonface; color: buttontext; border: 2px outset buttonborder; }
input, select, textarea { background-color: field; color: fieldtext; border: 2px inset buttonborder; }
`;

// reglas-@ que no pintan elementos (se saltan); `@media` se evalúa; `@supports`/`@document` se dan por ciertas
// (peor caso); CUALQUIER otra (`@layer`, `@container`, `@scope`, `@starting-style`, desconocidas) se marca y, si
// una de sus reglas toca el DOM medido, falla en alto: cambian el orden o la condición y el motor no lo sabe.
const AT_SIN_PINTURA = new Set(["keyframes", "-webkit-keyframes", "font-face", "page", "property", "counter-style", "font-feature-values", "font-palette-values", "view-transition"]);
const tieneLlave = (s) => { let q = null; for (let i = 0; i < s.length; i++) { const ch = s[i]; if (q) { if (ch === "\\") i++; else if (ch === q) q = null; continue; } if (ch === '"' || ch === "'") q = ch; else if (ch === "{") return true; } return false; };
function parsear(css, fichero, media, out, marca = null) {
  const s = sinComentarios(css);
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    const llave = s.indexOf("{", i), pc = s.indexOf(";", i);
    if (s[i] === "@") {
      const nombre = (s.slice(i + 1).match(/^[-\w]+/) || [""])[0].toLowerCase();
      if (pc >= 0 && (llave < 0 || pc < llave)) { i = pc + 1; continue; } // @import, @charset, `@layer a, b;`
      if (llave < 0) break;
      const fin = cierre(s, llave);
      const prelude = s.slice(i + 1 + nombre.length, llave).trim();
      const dentro = s.slice(llave + 1, fin);
      if (nombre === "media") parsear(dentro, fichero, [...media, prelude], out, marca);
      else if (["supports", "document", "-moz-document"].includes(nombre)) parsear(dentro, fichero, media, out, marca);
      else if (!AT_SIN_PINTURA.has(nombre)) parsear(dentro, fichero, media, out, marca || `@${nombre} ${prelude}`.trim());
      i = fin + 1;
      continue;
    }
    if (llave < 0) break;
    const fin = cierre(s, llave);
    const prelude = s.slice(i, llave).trim();
    const cuerpo = s.slice(llave + 1, fin);
    // CSS anidado: el motor no lo resuelve. La regla se guarda sin declaraciones y marcada: si su selector
    // EXTERIOR toca el DOM medido, falla en alto (lo anidado no puede tocar nada que no esté dentro de él).
    const anidada = tieneLlave(cuerpo);
    const decl = anidada ? [] : declaraciones(cuerpo, `${fichero} · ${prelude}`);
    if (decl.length || anidada) {
      const sels = [];
      for (const sel of trocear(prelude, ",")) {
        let pseudo = null, base = sel, otro = null;
        const mp = sel.match(PSEUDO_CAJA);
        const mo = sel.match(PSEUDO_OTRO);
        // la base es lo que va antes del pseudo; si acaba en un combinador (`.x ::selection`), son sus DESCENDIENTES
        const antes = (i) => { const pre = sel.slice(0, i); return (/[\s>+~]$/.test(pre) ? `${pre}*` : pre).trim() || "*"; };
        if (mp && !(mo && mo.index < mp.index)) { pseudo = mp[1].toLowerCase(); base = antes(mp.index); }
        else if (mo) { otro = (mo[1] || mo[2]).toLowerCase(); base = antes(mo.index); }
        sels.push({ texto: sel, casar: paraCasar(base), spec: especificidad(sel), pseudo, otro, clave: claveSujeto(base) });
      }
      if (sels.length) out.push({ fichero, media, sels, decl, marca: anidada ? (marca ? `${marca} + CSS anidado` : "CSS anidado") : marca });
    }
    i = fin + 1;
  }
  return out;
}

/** Una hoja a partir de un texto CSS (para las pruebas del propio motor). */
export function hojaDeCss(css, fichero = "(prueba)") { return { fichero, ua: false, reglas: parsear(css, fichero, [], []) }; }
export const hojaUA = () => ({ fichero: "(agente de usuario)", ua: true, reglas: parsear(HOJA_UA, "(ua)", [], []) });

/** Lee TODAS las hojas `.css` bajo `raiz` (y la del agente de usuario). */
export function cargarHojas(raiz) {
  const ficheros = ficherosCss(raiz);
  const hojas = [hojaUA()];
  for (const f of ficheros) hojas.push({ fichero: path.relative(raiz, f), ua: false, reglas: parsear(fs.readFileSync(f, "utf8"), path.relative(raiz, f), [], []) });
  return hojas;
}

// ── @media ──────────────────────────────────────────────────────────────────────────────────────
const px = (v) => { const m = String(v).trim().match(/^([\d.]+)(px|em|rem)?$/); if (!m) return NaN; return Number(m[1]) * (m[2] === "em" || m[2] === "rem" ? 16 : 1); };
// `dudas` (opcional): aquí se apunta lo que no entiende; la condición se da por CIERTA (peor caso) y quien
// llama grita si la regla toca el DOM medido (R5).
export function evaluaMedia(cond, { ancho, alto }, dudas = null) {
  return trocear(cond, ",").some((q) => {
    let s = q.trim().toLowerCase(), neg = false;
    if (s.startsWith("not ")) { neg = true; s = s.slice(4); }
    s = s.replace(/^only\s+/, "");
    let ok = true;
    for (const parte of s.split(/\s+and\s+/)) {
      const p = parte.trim();
      if (p === "all" || p === "screen") continue;
      if (p === "print" || p === "speech") { ok = false; continue; }
      const m = p.match(/^\(\s*([-\w]+)\s*(?::\s*([^)]+))?\)$/);
      if (!m) { if (dudas) dudas.push(p); continue; } // forma que no se entiende → se supone que aplica (peor caso) y se apunta
      const [, f, v = ""] = m;
      const val = v.trim();
      const tactil = ancho < 700;
      if (f === "max-width") ok = ok && ancho <= px(val);
      else if (f === "min-width") ok = ok && ancho >= px(val);
      else if (f === "max-height") ok = ok && alto <= px(val);
      else if (f === "min-height") ok = ok && alto >= px(val);
      else if (f === "orientation") ok = ok && (val === "portrait" ? alto >= ancho : ancho > alto);
      else if (f === "hover" || f === "any-hover") ok = ok && (val === "none" ? tactil : !tactil);
      else if (f === "pointer" || f === "any-pointer") ok = ok && (val === "coarse" ? tactil : val === "fine" ? !tactil : true);
      else if (f === "prefers-reduced-motion") ok = ok && val !== "reduce";
      else if (f === "prefers-color-scheme") ok = ok && val !== "dark";
      else if (f === "display-mode") ok = ok && val === "browser";
      else if (dudas) dudas.push(p); // cualquier otra característica: se supone que aplica (peor caso) y se apunta
    }
    return neg ? !ok : ok;
  });
}

// ── abreviadas ──────────────────────────────────────────────────────────────────────────────────
const ESTILOS_BORDE = /^(none|hidden|solid|dashed|dotted|double|groove|ridge|inset|outset)$/i;
const ANCHO_BORDE = /^(thin|medium|thick|0|[\d.]+(px|em|rem)?)$/i;
const esColor = (t) => parseColor(t) !== null || /^currentcolor$/i.test(t);
const esImagen = (t) => /^(?:url|image|image-set|-webkit-image-set|cross-fade|-webkit-cross-fade|element|-moz-element|paint|-webkit-gradient|(?:-webkit-|-moz-)?(?:repeating-)?(?:linear|radial|conic)-gradient)\(/i.test(t);
const PALABRA_FONDO = /^(?:none|auto|cover|contain|center|top|bottom|left|right|repeat|no-repeat|repeat-x|repeat-y|space|round|scroll|fixed|local|border-box|padding-box|content-box|text)$|^-?[\d.]+(?:px|%|em|rem|vw|vh|vmin|vmax|ch|ex)?$|^(?:calc|min|max|clamp|var)\(/i;
const noEsColorDeFondo = (t) => t.split("/").filter(Boolean).every((x) => PALABRA_FONDO.test(x));
// Lo que puede ir en un degradado y NO es un color (dirección, forma, posición, espacio de interpolación).
const PALABRA_DEGRADADO = /^(?:to|at|from|in|top|bottom|left|right|center|circle|ellipse|closest-side|closest-corner|farthest-side|farthest-corner|srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|lab|oklab|lch|oklch|hsl|hwb|xyz|xyz-d50|xyz-d65|shorter|longer|increasing|decreasing|hue)$|^-?[\d.]+(?:deg|rad|turn|grad|px|%|em|rem|vw|vh)?$|^(?:calc|min|max|clamp)\(/i;
const LADOS = ["top", "right", "bottom", "left"];
const cuatro = (v) => { const t = trocear(v, " "); return [t[0], t[1] ?? t[0], t[2] ?? t[0], t[3] ?? t[1] ?? t[0]]; };
const QUIEN_DECLARA = {
  "background-color": ["background-color", "background"],
  "background-image": ["background-image", "background"],
  "grid-row-start": ["grid-row-start", "grid-row", "grid-area"],
  "grid-row-end": ["grid-row-end", "grid-row", "grid-area"],
  "grid-column-start": ["grid-column-start", "grid-column", "grid-area"],
  "grid-column-end": ["grid-column-end", "grid-column", "grid-area"],
  "grid-template-columns": ["grid-template-columns", "grid-template"],
  "box-shadow": ["box-shadow"],
  "outline-style": ["outline", "outline-style"], "outline-width": ["outline", "outline-width"], "outline-color": ["outline", "outline-color"],
  "border-image-source": ["border-image", "border-image-source"],
  "background-clip": ["background-clip", "-webkit-background-clip"],
};
for (const l of LADOS) for (const k of ["width", "style", "color"]) QUIEN_DECLARA[`border-${l}-${k}`] = ["border", `border-${l}`, `border-${k}`, `border-${l}-${k}`];
const declarantes = (prop) => QUIEN_DECLARA[prop] || [prop];

function expandir(nombre, valor, prop) {
  if (nombre === prop) return valor;
  const v = valor.trim();
  if (/^(inherit|initial|unset|revert)$/i.test(v)) return v.toLowerCase();
  if (nombre === "background") {
    const capas = trocear(v, ",");
    if (prop === "background-color") {
      const toks = trocear(capas[capas.length - 1] || "", " ");
      const t = toks.find(esColor);
      if (t) return t;
      // R5: un trozo que no es imagen, posición, tamaño, repetición ni caja es un COLOR que el motor no sabe leer
      // (`oklch(…)`, `mistyrose`…): se devuelve tal cual y `color()` falla en alto. Antes salía «transparent».
      return toks.find((x) => !esImagen(x) && !noEsColorDeFondo(x)) || "transparent";
    }
    const imgs = capas.map((c) => trocear(c, " ").find(esImagen)).filter(Boolean);
    return imgs.length ? imgs.join(", ") : "none";
  }
  const mb = prop.match(/^(border|outline)-(?:(top|right|bottom|left)-)?(width|style|color)$/);
  if (mb) {
    const [, fam, lado, parte] = mb;
    if (nombre === `${fam}-${parte}` && fam === "border") return cuatro(v)[LADOS.indexOf(lado)];
    if (nombre === `${fam}-${parte}`) return v;
    // `border`, `border-top`, `outline`
    const t = trocear(v, " ");
    if (parte === "style") return t.find((x) => ESTILOS_BORDE.test(x)) || "none";
    if (parte === "width") return t.find((x) => ANCHO_BORDE.test(x)) || "medium";
    return t.find((x) => !ESTILOS_BORDE.test(x) && !ANCHO_BORDE.test(x)) || "currentcolor";
  }
  if (nombre === "grid-row" || nombre === "grid-column") {
    const [a, b] = trocear(v, "/");
    if (prop.endsWith("-start")) return a;
    return b ?? (/^-?\d+$/.test(a) || /^span/.test(a) ? "auto" : a);
  }
  if (nombre === "grid-area") {
    const p = trocear(v, "/");
    const idx = { "grid-row-start": 0, "grid-column-start": 1, "grid-row-end": 2, "grid-column-end": 3 }[prop];
    return p[idx] ?? "auto";
  }
  if (nombre === "grid-template") { const p = trocear(v, "/"); return p[1] ?? "none"; }
  return v;
}
const HEREDADAS = new Set(["color", "visibility", "white-space", "overflow-wrap", "word-break", "-webkit-text-fill-color", "accent-color"]);
const INICIAL = {
  "background-color": "transparent", "background-image": "none", color: "canvastext", opacity: "1", display: "inline",
  visibility: "visible", "box-shadow": "none", "outline-style": "none", "outline-width": "medium", "outline-color": "currentcolor",
  content: "normal", "grid-row-start": "auto", "grid-row-end": "auto", "grid-column-start": "auto", "grid-column-end": "auto",
  "grid-template-columns": "none", "white-space": "normal", "overflow-wrap": "normal", "word-break": "normal",
  filter: "none", "backdrop-filter": "none", "mix-blend-mode": "normal", "background-blend-mode": "normal",
  "border-image-source": "none", "-webkit-text-fill-color": "currentcolor", "background-clip": "border-box", "accent-color": "auto",
};
// Propiedades que CAMBIAN el color pintado y el motor NO calcula → si una toca el DOM medido con un valor que
// no sea neutro, falla en alto (R5, D-1452). `NEUTROS` es la lista de valores que no cambian el color.
export const NO_MEDIDAS = {
  filter: /^none$/i,
  "backdrop-filter": /^none$/i,
  "mix-blend-mode": /^normal$/i,
  "background-blend-mode": /^normal(?:\s*,\s*normal)*$/i,
  "border-image-source": /^none$/i,
  "-webkit-text-fill-color": /^currentcolor$/i,
  "background-clip": /^(?:border-box|padding-box|content-box)(?:\s*,\s*(?:border-box|padding-box|content-box))*$/i,
};
// `accent-color` sólo pinta en estos controles (la casilla, el botón de radio, el deslizador, la barra)
const CON_ACENTO = "input, progress, meter";
const describir = (el) => `${el.localName}${el.classList && el.classList.length ? "." + [...el.classList].filter((c) => !c.startsWith("__")).join(".") : ""}`;
for (const l of LADOS) { INICIAL[`border-${l}-width`] = "medium"; INICIAL[`border-${l}-style`] = "none"; INICIAL[`border-${l}-color`] = "currentcolor"; }

/**
 * Motor de cascada para UN ancho y UN orden de ficheros.
 *   new Cascada(hojas, { ancho, alto, inverso })
 *   .valor(el, prop, pseudo?)   → valor computado (cadena)
 *   .color(el, prop, pseudo?)   → rgba
 *   .visible(el)                → no está en display:none / visibility:hidden
 *   .pintado(el, pseudo?)       → lista de colores opacos posibles bajo el elemento (degradados ⇒ varios)
 *   .pintaFondo(el, pseudo?)    → ¿el propio elemento pinta fondo?
 */
export class Cascada {
  constructor(hojas, { ancho, alto, inverso = false }) {
    this.ancho = ancho; this.alto = alto;
    this.noEvaluables = new Set();
    this._oidos = new Set();
    this.fuera = new Map(); // pseudo-elementos que no se miden por decisión → cuántas veces tocan el DOM
    this.indice = new Map();
    const orden = hojas.filter((h) => !h.ua);
    if (inverso) orden.reverse();
    const todas = [...hojas.filter((h) => h.ua), ...orden];
    let n = 0;
    todas.forEach((h, ih) => {
      h.reglas.forEach((r) => {
        n++;
        const dudas = [];
        if (r.media.length && !r.media.every((m) => evaluaMedia(m, { ancho, alto }, dudas))) return;
        for (const s of r.sels) {
          const e = { s, r, ua: h.ua, orden: ih * 1e6 + n, dudosa: dudas.length ? dudas.join(" y ") : null };
          if (!this.indice.has(s.clave)) this.indice.set(s.clave, []);
          this.indice.get(s.clave).push(e);
        }
      });
    });
    this.cache = new Map();
  }
  _reglas(el, pseudo) {
    const k = el; let porEl = this.cache.get(k);
    if (!porEl) { porEl = new Map(); this.cache.set(k, porEl); }
    const kp = `__reglas:${pseudo || ""}`;
    if (porEl.has(kp)) return porEl.get(kp);
    const claves = ["*", `t:${el.localName}`, ...[...el.classList].map((c) => `c:${c}`)];
    if (el.id) claves.push(`i:${el.id}`);
    const casan = [];
    for (const c of claves) for (const e of this.indice.get(c) || []) {
      if (e.s.otro) continue; // los mira `vigilar()`
      if ((e.s.pseudo || null) !== (pseudo || null)) continue;
      let ok = false;
      try { ok = el.matches(e.s.casar); } catch { this.noEvaluables.add(`${e.r.fichero} · ${e.s.texto}`); }
      if (ok && e.dudosa) this._ruido(`@media que el motor no entiende (${e.dudosa}): la da por cierta`, el, `${e.r.fichero} · ${e.s.texto}`);
      if (ok && e.r.marca) this._ruido(`regla dentro de ${e.r.marca}: el motor no resuelve su orden ni su condición`, el, `${e.r.fichero} · ${e.s.texto}`);
      if (ok) casan.push(e);
    }
    // estilo en línea
    const linea = el.getAttribute && !pseudo ? el.getAttribute("style") : null;
    const lineaDecl = linea ? declaraciones(linea) : [];
    const res = { casan, lineaDecl };
    porEl.set(kp, res);
    return res;
  }
  // declaración ganadora (cruda) entre `nombres`
  _ganadora(el, nombres, pseudo) {
    const { casan, lineaDecl } = this._reglas(el, pseudo);
    let mejor = null, clave = null;
    const cmp = (x, y) => { for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
    for (const e of casan) for (const d of e.r.decl) {
      if (!nombres.includes(d.prop)) continue;
      const k = [d.imp ? 1 : 0, e.ua ? 0 : 1, 0, ...e.s.spec, e.orden];
      if (!clave || cmp(k, clave) >= 0) { clave = k; mejor = d; }
    }
    for (const d of lineaDecl) {
      if (!nombres.includes(d.prop)) continue;
      const k = [d.imp ? 1 : 0, 1, 1, 0, 0, 0, Infinity];
      if (!clave || cmp(k, clave) >= 0) { clave = k; mejor = d; }
    }
    return mejor;
  }
  _padre(el, pseudo) { return pseudo ? el : el.parentElement; }
  custom(el, nombre, pseudo = null, pila = new Set()) {
    if (!el || el.nodeType !== 1) return undefined;
    const k = `--:${pseudo || ""}:${nombre}`;
    let porEl = this.cache.get(el);
    if (!porEl) { porEl = new Map(); this.cache.set(el, porEl); }
    if (porEl.has(k)) return porEl.get(k);
    const d = this._ganadora(el, [nombre], pseudo);
    let v;
    if (!d || /^(inherit|unset)$/i.test(d.val)) v = this.custom(this._padre(el, pseudo), nombre, null, pila);
    else if (pila.has(nombre)) v = undefined;
    else { pila.add(nombre); v = this.sustituir(el, d.val, pseudo, pila) ?? undefined; pila.delete(nombre); }
    porEl.set(k, v);
    return v;
  }
  // sustituye var(); null si queda una var sin valor y sin respaldo (inválido en tiempo de cómputo)
  sustituir(el, valor, pseudo = null, pila = new Set()) {
    let s = valor, guard = 0;
    while (/var\(/i.test(s) && guard++ < 20) {
      const i = s.search(/var\(/i);
      let prof = 0, j = i + 3;
      for (; j < s.length; j++) { if (s[j] === "(") prof++; else if (s[j] === ")") { prof--; if (prof === 0) break; } }
      const dentro = s.slice(i + 4, j);
      const coma = trocear(dentro, ",");
      const nombre = coma[0].trim();
      const resto = dentro.includes(",") ? dentro.slice(dentro.indexOf(",") + 1).trim() : null;
      let v = this.custom(el, nombre, pseudo, pila);
      if (v === undefined) v = resto;
      if (v == null) return null;
      s = s.slice(0, i) + v + s.slice(j + 1);
    }
    return s;
  }
  valor(el, prop, pseudo = null) {
    if (!el || el.nodeType !== 1) return INICIAL[prop] ?? "";
    let porEl = this.cache.get(el);
    if (!porEl) { porEl = new Map(); this.cache.set(el, porEl); }
    const k = `${pseudo || ""}:${prop}`;
    if (porEl.has(k)) return porEl.get(k);
    const hereda = () => this.valor(this._padre(el, pseudo), prop);
    const d = this._ganadora(el, declarantes(prop), pseudo);
    let v;
    if (!d) v = HEREDADAS.has(prop) && this._padre(el, pseudo) ? hereda() : INICIAL[prop];
    else {
      const sub = this.sustituir(el, d.val, pseudo);
      const x = sub == null ? "unset" : expandir(d.prop, sub, prop);
      if (x === "inherit") v = this._padre(el, pseudo) ? hereda() : INICIAL[prop];
      else if (x === "unset" || x === "revert") v = HEREDADAS.has(prop) && this._padre(el, pseudo) ? hereda() : INICIAL[prop];
      else if (x === "initial") v = INICIAL[prop];
      else v = x;
    }
    porEl.set(k, v);
    return v;
  }
  // Falla en alto (R5): apunta en `noEvaluables` qué no se pudo medir, una vez por mensaje y origen.
  _ruido(msg, el, origen = null) {
    const k = `${msg}|${origen || ""}`;
    if (this._oidos.has(k)) return;
    this._oidos.add(k);
    this.noEvaluables.add(`${msg}${origen ? ` [${origen}]` : ""} (p. ej. en ${describir(el)})`);
  }
  origen(el, prop, pseudo = null) {
    for (let n = el, p = pseudo; n && n.nodeType === 1; p = null, n = n.parentElement) {
      const d = this._ganadora(n, declarantes(prop), p);
      if (d) return d.origen;
      if (!HEREDADAS.has(prop)) break;
    }
    return "(valor inicial)";
  }
  _leer(v, el, prop, pseudo = null) {
    if (/^currentcolor$/i.test(String(v).trim())) return this.color(el, "color", pseudo);
    const c = parseColor(v);
    if (c) return c;
    this._ruido(`color que el motor no sabe leer: ${prop} = «${v}»`, el, this.origen(el, prop, pseudo));
    return [0, 0, 0, 0];
  }
  color(el, prop, pseudo = null) {
    const v = this.valor(el, prop, pseudo);
    if (/^currentcolor$/i.test(v)) return prop === "color" ? this.color(this._padre(el, pseudo), "color") : this.color(el, "color", pseudo);
    return this._leer(v, el, prop, pseudo);
  }
  opacidad(el) { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const x = parseFloat(this.valor(n, "opacity")); o *= Number.isNaN(x) ? 1 : x; } return o; }
  visible(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) if (this.valor(n, "display") === "none") return false;
    return this.valor(el, "visibility") !== "hidden" && this.valor(el, "visibility") !== "collapse";
  }
  tienePseudo(el, pseudo) {
    const c = this.valor(el, "content", pseudo);
    return c && !/^(none|normal)$/i.test(c.trim());
  }
  _capa(el, pseudo) {
    const bg = this.color(el, "background-color", pseudo);
    const img = this.valor(el, "background-image", pseudo);
    const grad = [];
    if (img && !/^none$/i.test(img)) for (const capa of trocear(img, ",")) {
      if (/^none$/i.test(capa)) continue;
      const m = capa.match(/^((?:-webkit-|-moz-)?(?:repeating-)?(?:linear|radial|conic)-gradient)\(([\s\S]*)\)$/i);
      // R5: una imagen que no es un degradado (`url()`, `image-set()`…) puede pintar cualquier color → grita.
      if (!m) { this._ruido(`fondo con una imagen que el motor no sabe medir: «${capa.slice(0, 90)}»`, el, this.origen(el, "background-image", pseudo)); continue; }
      for (const parte of trocear(m[2], ",")) for (const t of trocear(parte, " ")) {
        if (PALABRA_DEGRADADO.test(t)) continue;
        grad.push(this._leer(t, el, "background-image", pseudo));
      }
    }
    return { bg, grad };
  }
  pintaFondo(el, pseudo = null) { const { bg, grad } = this._capa(el, pseudo); return bg[3] > 0 || grad.length > 0; }
  /** Colores posibles (opacos) de lo que se ve bajo el texto del elemento. */
  pintado(el, pseudo = null) {
    const capas = [];
    const nodos = pseudo ? [{ el, pseudo }] : [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) nodos.push({ el: n, pseudo: null });
    for (const { el: n, pseudo: p } of nodos) {
      const { bg, grad } = this._capa(n, p);
      const op = p ? this.opacidad(n) : this.opacidad(n);
      if (grad.length) { capas.push({ grad: grad.map((g) => [g[0], g[1], g[2], g[3] * op]), bajo: [bg[0], bg[1], bg[2], bg[3] * op] }); if (grad.every((g) => g[3] >= 1) && op >= 1) break; }
      else if (bg[3] > 0) { capas.push({ solido: [bg[0], bg[1], bg[2], bg[3] * op] }); if (bg[3] >= 1 && op >= 1) break; }
    }
    let cands = [[255, 255, 255, 1]]; // lienzo
    for (let i = capas.length - 1; i >= 0; i--) {
      const c = capas[i];
      if (c.solido) cands = cands.map((b) => encima(c.solido, b));
      else {
        const base = c.bajo[3] > 0 ? cands.map((b) => encima(c.bajo, b)) : cands;
        const nuevo = [];
        for (const g of c.grad) for (const b of base) nuevo.push(encima(g, b));
        cands = nuevo;
      }
    }
    return cands;
  }
  /**
   * R5 · Lo que RELLENA sin ser `background`: bordes, contorno y sombras (también la interior). Cada uno con su
   * color y si cae FUERA de la caja (contorno, sombra exterior: lo de debajo es el padre) o dentro.
   */
  rellenos(el, pseudo = null) {
    const out = [];
    for (const l of LADOS) {
      const st = this.valor(el, `border-${l}-style`, pseudo), w = this.valor(el, `border-${l}-width`, pseudo);
      if (/^(none|hidden)$/i.test(st) || /^0(\.0+)?(px|em|rem)?$/.test(w)) continue;
      out.push({ que: `borde ${l}`, c: this.color(el, `border-${l}-color`, pseudo), fuera: false });
    }
    const os = this.valor(el, "outline-style", pseudo), ow = this.valor(el, "outline-width", pseudo);
    if (!/^(none|hidden)$/i.test(os) && !/^0(\.0+)?(px)?$/.test(ow)) out.push({ que: "contorno", c: this.color(el, "outline-color", pseudo), fuera: true });
    const bs = this.valor(el, "box-shadow", pseudo);
    if (bs && !/^none$/i.test(bs)) for (const capa of trocear(bs, ",")) {
      const t = trocear(capa, " ");
      const inset = t.some((x) => /^inset$/i.test(x));
      const col = t.filter((x) => !/^inset$/i.test(x) && !/^-?[\d.]+(px|em|rem)?$/i.test(x) && !/^(calc|min|max|clamp)\(/i.test(x));
      const c = col.length ? this._leer(col.join(" "), el, "box-shadow", pseudo) : this.color(el, "color", pseudo);
      out.push({ que: inset ? "sombra interior" : "sombra", c, fuera: !inset });
    }
    return out;
  }
  /**
   * R5 · Falla en alto si a `el` le toca algo que cambia el color pintado y el motor no calcula: un pseudo-elemento
   * que no sea ::before/::after (salvo `PSEUDO_FUERA`, que se cuenta en `fuera`) o una propiedad de `NO_MEDIDAS`.
   */
  vigilar(el) {
    const claves = ["*", `t:${el.localName}`, ...[...el.classList].map((c) => `c:${c}`)];
    if (el.id) claves.push(`i:${el.id}`);
    for (const c of claves) for (const e of this.indice.get(c) || []) {
      if (!e.s.otro) continue;
      let ok = false;
      try { ok = el.matches(e.s.casar); } catch { this.noEvaluables.add(`${e.r.fichero} · ${e.s.texto}`); }
      if (!ok) continue;
      if (PSEUDO_FUERA[e.s.otro]) { const k = `::${e.s.otro} (${PSEUDO_FUERA[e.s.otro]})`; this.fuera.set(k, (this.fuera.get(k) || 0) + 1); }
      else this._ruido(`pseudo-elemento ::${e.s.otro}: el motor no lo mide`, el, `${e.r.fichero} · ${e.s.texto}`);
    }
    for (const ps of [null, "before", "after"]) {
      if (ps && !this.tienePseudo(el, ps)) continue;
      for (const [prop, neutro] of Object.entries(NO_MEDIDAS)) {
        const v = this.valor(el, prop, ps);
        if (v != null && !neutro.test(String(v).trim())) this._ruido(`${prop}: ${v} — cambia el color pintado y el motor no lo calcula`, el, this.origen(el, prop, ps));
      }
    }
    if (el.matches(CON_ACENTO)) { const v = this.valor(el, "accent-color"); if (!/^auto$/i.test(String(v).trim())) this._ruido(`accent-color: ${v} — pinta el control y el motor no lo calcula`, el, this.origen(el, "accent-color")); }
  }
  /** ¿El elemento (o su ::before/::after) dibuja una caja: fondo propio, borde visible, sombra o contorno? */
  caja(el, pseudo = null) {
    const motivos = [];
    if (this.pintaFondo(el, pseudo)) motivos.push(`fondo ${this.valor(el, "background-color", pseudo)} ${this.valor(el, "background-image", pseudo)}`.trim());
    for (const l of LADOS) {
      const st = this.valor(el, `border-${l}-style`, pseudo), w = this.valor(el, `border-${l}-width`, pseudo), c = this.color(el, `border-${l}-color`, pseudo);
      if (!/^(none|hidden)$/i.test(st) && !/^0(px)?$/.test(w) && c[3] > 0) motivos.push(`borde ${l} ${w} ${st} ${this.valor(el, `border-${l}-color`, pseudo)}`);
    }
    if (!/^none$/i.test(this.valor(el, "box-shadow", pseudo))) motivos.push(`sombra ${this.valor(el, "box-shadow", pseudo)}`);
    const os = this.valor(el, "outline-style", pseudo);
    if (!/^(none|hidden)$/i.test(os) && !/^0(px)?$/.test(this.valor(el, "outline-width", pseudo))) motivos.push(`contorno ${os}`);
    return motivos;
  }
  /** Número de pistas de `grid-template-columns` (repeat(n, …) incluido). */
  pistas(el) {
    const v = this.valor(el, "grid-template-columns");
    if (!v || v === "none") return 0;
    let n = 0;
    for (const t of trocear(v, " ")) { const m = t.match(/^repeat\(\s*(\d+)\s*,(.*)\)$/i); n += m ? Number(m[1]) * trocear(m[2], " ").length : 1; }
    return n;
  }
}

/** Marca `el` y sus antepasados como «bajo el ratón» (las reglas `:hover` se casan como `.__hv`). */
export function conRaton(el, si = true) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) n.classList.toggle("__hv", si);
}
/**
 * R5 · Enciende un estado en TODO `raiz` (y sus antepasados) a la vez: `"raton"` (`:hover` + `:active`) o `"foco"`
 * (`:focus`, `:focus-within`, `:focus-visible` + `:active`). Cada elemento queda como estaría con el ratón (o el
 * foco) encima de ÉL; lo que no cubre: un estado del padre SIN el del hijo y reglas que se tapen entre sí.
 */
export function conEstado(raiz, estado, si = true) {
  const clases = estado === "foco" ? ["__fc", "__ac"] : ["__hv", "__ac"];
  const nodos = [...raiz.querySelectorAll("*")];
  for (let n = raiz; n && n.nodeType === 1; n = n.parentElement) nodos.push(n);
  for (const n of nodos) for (const c of clases) n.classList.toggle(c, si);
}
