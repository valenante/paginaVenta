/**
 * reservasEstiloPanel.red.test.jsx — lote/panel-reservas-estilo (14-oct)
 *
 * Valen, en producción (fbd0c40): «TE HAS INVENTADO TOTALMENTE LA INTERFAZ Y LOS COLORES… ESE
 * VERDE Y ESE ROJO NO EXISTEN EN ALEF». La red del lote anterior sólo miraba TEXTOS y el aspecto
 * pasó en verde. Una primera versión de ESTA red («sólo tokens») protegía lo contrario de lo que
 * hacía falta: obligaba a los tokens `-suave` (los fondos que señaló Valen) y dejaba la página a
 * 1,50–3,08:1 (ataque visual 1). Esta versión protege LO CORRECTO (P-168: una red estática cierra
 * un PATRÓN; la prueba del aspecto son las capturas de lotes/PANEL-RESERVAS-ESTILO/capturas):
 *
 *  1. NINGÚN COLOR QUE NO EXISTA YA en el CSS del panel, y ningún token pastel `-suave`, terciario
 *     ni secundario (naranja) en el CSS de reservas: ni por su NOMBRE ni por su VALOR (R3: el ataque
 *     visual 2 escribió #fee2e2 y #d1fae5 a mano y la red R2 seguía verde). NotasCliente.css no
 *     pinta nada, y NINGUNA regla de reservas que toque las notas o la segunda línea dibuja caja,
 *     se llame como se llame su selector.
 *  2. Píldoras de la página: la FORMA de la hermana Fidelización (`.loyalty-pill`) y, en cada
 *     estado, un fondo y un texto que ya usa el panel (R4: ya no el PAR exacto, ver la prueba). Sin
 *     borde. El fondo es un TINTE translúcido (alfa ≤ 0,3) o el gris neutro de la píldora base de
 *     Facturas: un relleno opaco de color (la «píldora pastel» de fbd0c40) no pasa. En el modal, el
 *     tinte es OSCURO.
 *  3. LEGIBILIDAD MEDIDA: el test recalcula el contraste WCAG de cada píldora y de CADA color de
 *     texto que declaran las reglas de reservas (alergias, mensaje, email, etiquetas de la tarjeta)
 *     sobre su fondo real (tarjeta blanca y fila bajo el ratón; en el modal, los dos extremos de
 *     --dash-bg) y exige ≥ 4,5:1. La página activa del paginador también (no `btn-primario`, 2,10:1).
 *  4. «No vino» se distingue de «Rechazada» en las dos pantallas.
 *  5. Modal: la píldora ni se estira ni se parte; las alergias van en el rojo de
 *     `.adm__modal-danger` sin caja; el mensaje en el color de la fila; en MÓVIL la cabecera SE
 *     QUEDA (como en «Stock bajo»), el teléfono y la píldora van en líneas DISTINTAS (R3: en R2
 *     compartían línea y la píldora tapaba el teléfono a ≤ 360 px, D-1392), teléfono y email parten
 *     en vez de salirse, y el orden de columnas del JSX es el que supone el CSS.
 *  ⚠️ R4: esta red lee el CSS por el NOMBRE del selector y por eso NO basta (ataque visual 3: cinco
 *     reglas con selectores neutros devolvieron el aspecto de producción y aquí todo seguía verde). Cierra
 *     PATRONES (P-168). Lo que se ve lo protege reservasColorPintado.red.test.jsx, que resuelve la cascada
 *     y mide el color PINTADO (ΔE frente al verde y al rosa de la captura, contraste, cajas, rejilla).
 *  6. Página: sin el paginador oscuro de Finanzas ni su CSS, sin estilos en línea; la paginación
 *     conserva TODAS las funciones de la de antes; «Cancelar» lleva la clase de su gemelo; la
 *     tarjeta de móvil parte un email largo en vez de salirse de la pantalla (D-1391).
 */
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

vi.mock("../utils/api", () => ({ default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock("../hooks/useFeature", () => ({ useFeature: () => true }));
vi.mock("../components/Reservas/FiltroFechaReservas", () => ({ default: () => null }));
vi.mock("../components/Reservas/ModalNuevaReserva.jsx", () => ({ default: () => null }));
vi.mock("../components/Reservas/ReservasAjustesPage.jsx", () => ({ default: () => null }));

import api from "../utils/api";
import ReservasConfigPage from "../pages/ReservasConfigPage.jsx";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const leer = (rel) => fs.readFileSync(path.join(RAIZ, rel), "utf8");

const CSS_PAGINA = "styles/ReservasConfigPage.css";
const CSS_NOTAS = "components/Reservas/NotasCliente.css";
const CSS_PANEL = "components/Panel/AdminDashboard.css";
const JSX_PANEL = "components/Panel/AdminDashboard.jsx";
const ESTADOS = ["pendiente", "confirmada", "auto-confirmada", "rechazada", "completada", "no-show"];

// ── lectura de CSS ──────────────────────────────────────────────────────────────────────────
const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
// Reglas más internas (lo de dentro de un @media también sale, con su propio selector).
function reglas(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  const limpio = sinComentarios(css);
  while ((m = re.exec(limpio))) out.push({ sel: m[1].trim().replace(/\s+/g, " "), cuerpo: m[2] });
  return out;
}
// Cuerpo de cada `@media (max-width: N)` del fichero.
function medias(css, maxWidth) {
  const limpio = sinComentarios(css);
  const out = [];
  const re = new RegExp(`@media\\s*\\(\\s*max-width:\\s*${maxWidth}px\\s*\\)\\s*\\{`, "g");
  let m;
  while ((m = re.exec(limpio))) {
    let i = m.index + m[0].length, prof = 1;
    const ini = i;
    while (prof && i < limpio.length) { if (limpio[i] === "{") prof++; else if (limpio[i] === "}") prof--; i++; }
    out.push(limpio.slice(ini, i - 1));
  }
  return out.join("\n");
}
const decl = (cuerpo, prop) => {
  const m = cuerpo.match(new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*([^;]+)`, "i"));
  return m ? m[1].trim().replace(/\s*!important$/, "") : null;
};
// `var(--token, fallback)` → `var(--token)`: el fallback no es el color que se pinta.
const sinFallbacks = (s) => s.replace(/var\(\s*(--[\w-]+)\s*,[^()]*(?:\([^()]*\)[^()]*)*\)/g, "var($1)");
const LITERALES = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/gi;
const NOMBRES = /(?<![\w-])(?:white|black|gray|grey|red|green|blue|orange|purple|pink|yellow|silver)(?![\w-])/i;
const norm = (c) => c.toLowerCase().replace(/\s+/g, "").replace(/,0\./g, ",.");
const literales = (cuerpo) => (sinFallbacks(cuerpo).match(LITERALES) || []).map(norm);

function cssDelPanel(dir = RAIZ, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") cssDelPanel(p, acc); }
    else if (e.name.endsWith(".css")) acc.push(p);
  }
  return acc;
}
// Reglas de AdminDashboard.css que son de RESERVAS (las propias y las píldoras de estado).
const esDeReservas = (sel) => /reserva|\brc-|\.adm__badge--/.test(sel);

// EL SISTEMA = todo el CSS del panel MENOS lo de reservas: lo que ya existía, contra lo que se mide
// si un color o un par (fondo, texto) es inventado.
let _sistema;
function sistema() {
  if (_sistema) return _sistema;
  const colores = new Set();
  const pares = new Set();
  for (const f of cssDelPanel()) {
    if (/ReservasConfigPage\.css$|NotasCliente\.css$/.test(f)) continue;
    const propio = /AdminDashboard\.css$/.test(f);
    for (const { sel, cuerpo } of reglas(fs.readFileSync(f, "utf8"))) {
      if (propio && esDeReservas(sel)) continue;
      for (const c of literales(cuerpo)) colores.add(c);
      const bg = decl(cuerpo, "background") || decl(cuerpo, "background-color");
      const co = decl(cuerpo, "color");
      if (bg && co) pares.add(`${norm(bg)}|${norm(co)}`);
    }
  }
  _sistema = { colores, pares };
  return _sistema;
}

// ── contraste WCAG ──────────────────────────────────────────────────────────────────────────
function token(nombre) {
  for (const f of ["index.css", "styles/dashboard-common.css"]) {
    const m = sinComentarios(leer(f)).match(new RegExp(`${nombre}\\s*:\\s*([^;]+);`));
    if (m) return m[1].trim();
  }
  throw new Error(`token ${nombre} no encontrado`);
}
const resolver = (v) => {
  let s = sinFallbacks(v.trim());
  for (let i = 0; i < 5 && /^var\(/.test(s); i++) s = sinFallbacks(token(s.slice(4, -1)));
  return s;
};
function rgba(c) {
  const s = resolver(c);
  let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    const h = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1);
  }
  m = s.match(/^rgba?\(([^)]*)\)$/i);
  if (m) { const p = m[1].split(",").map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
  m = s.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+))?\s*\)$/i);
  if (m) {
    const [h, sa, l] = [Number(m[1]) / 360, Number(m[2]) / 100, Number(m[3]) / 100];
    const q = l < 0.5 ? l * (1 + sa) : l + sa - l * sa, p = 2 * l - q;
    const t = (x) => { x = (x + 1) % 1; return x < 1 / 6 ? p + (q - p) * 6 * x : x < 1 / 2 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p; };
    return [t(h + 1 / 3), t(h), t(h - 1 / 3)].map((v) => Math.round(v * 255)).concat(m[4] !== undefined ? Number(m[4]) : 1);
  }
  throw new Error(`color no reconocido: ${c} → ${s}`);
}
const encima = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
const lum = (c) => {
  const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// texto sobre su fondo (rgba) que a su vez está sobre `base`
const contraste = (texto, fondo, base) => {
  const f = encima(rgba(fondo), rgba(base));
  return ratio(encima(rgba(texto), f), f);
};
const MINIMO = 4.5;
// Fondos reales de la página: la tarjeta blanca y la fila de la tabla bajo el ratón.
const basesPagina = () => {
  const blanco = resolver("var(--color-fondo-card)");
  const hover = decl(reglas(leer("styles/config-common.css")).find((r) => r.sel === ".cfg-table tbody tr:hover").cuerpo, "background");
  const filaHover = encima(rgba(hover), rgba(blanco));
  return [blanco, `rgba(${filaHover.slice(0, 3).join(",")},1)`];
};
// Fondos reales del modal: los dos extremos del degradado --dash-bg.
const basesModal = () => {
  const ext = token("--dash-bg").match(/#[0-9a-f]{6}/gi);
  expect(ext.length).toBeGreaterThanOrEqual(2);
  return ext;
};

const PASTEL = /--color-(?:exito|aviso|error|primario)-suave|--color-terciario|--color-secundario/;
// Los MISMOS tokens, por su VALOR: #d1fae5 (el verde de la captura), #fee2e2 (el rosa), #fef3c7,
// hsl(206,100%,84%), #ffecdb y los naranjas. Se resuelven de index.css, no se copian aquí.
const TOKENS_PASTEL = ["--color-exito-suave", "--color-aviso-suave", "--color-error-suave", "--color-primario-suave",
  "--color-terciario", "--color-secundario", "--color-secundario-oscuro"];
const valoresPastel = () => TOKENS_PASTEL.map((t) => [t, rgba(`var(${t})`)]);
const mismoRGB = (a, b) => [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) <= 1);
// Todos los colores (literales y tokens) de un cuerpo de regla, resueltos.
const coloresDe = (cuerpo) => {
  const limpio = sinFallbacks(cuerpo);
  const toks = (limpio.match(/var\(--[\w-]+\)/g) || []).filter((v) => { try { rgba(v); return true; } catch { return false; } });
  return [...(limpio.match(LITERALES) || []), ...toks].map((c) => [c, rgba(c)]);
};
const PROPS_CAJA = ["background", "background-color", "border", "border-color", "border-width", "padding", "border-radius", "box-shadow", "outline"];
// Reglas de reservas que tocan las NOTAS o la segunda línea del modal (sea cual sea el selector).
const esDeNotas = (sel) => /rc-notas|rc-alergias|rc-mensaje|adm__reserva-extra|adm__reserva-email/.test(sel);
// Reglas de reservas de los tres ficheros (lo de AdminDashboard.css, sólo lo de reservas).
const reglasDeReservas = () => [
  ...reglas(leer(CSS_PAGINA)).map((r) => ({ ...r, f: CSS_PAGINA })),
  ...reglas(leer(CSS_NOTAS)).map((r) => ({ ...r, f: CSS_NOTAS })),
  ...reglas(leer(CSS_PANEL)).filter((r) => esDeReservas(r.sel)).map((r) => ({ ...r, f: CSS_PANEL })),
];
const NARANJA = /#ff9149|#e86f1c|#ffecdb|#ff6700|#ffa600|rgba\(255,145,73|rgba\(255,103,0|--color-secundario|--color-terciario/i;

// ═════════════════════════════════════════════════════════════════════════════════════════════
describe("Reservas · ningún color inventado ni caja pastel", () => {
  it("NotasCliente.css sólo maqueta: no pinta fondo, borde, color ni caja", () => {
    for (const { sel, cuerpo } of reglas(leer(CSS_NOTAS))) {
      for (const prop of ["background", "background-color", "border", "border-color", "color", "padding", "border-radius", "box-shadow", "outline"]) {
        expect(decl(cuerpo, prop), `${sel} declara ${prop}`).toBeNull();
      }
      expect(cuerpo, `${sel} trae un color`).not.toMatch(LITERALES);
      expect(cuerpo, `${sel} trae un color con nombre`).not.toMatch(NOMBRES);
      expect(cuerpo, `${sel} trae un token de color`).not.toMatch(/--color-/);
    }
  });

  it("ReservasConfigPage.css: ni tokens pastel ni naranja, y cada color ya existe en el panel", () => {
    const css = sinComentarios(leer(CSS_PAGINA));
    expect(css, "token pastel / naranja en la página").not.toMatch(PASTEL);
    const { colores } = sistema();
    for (const { sel, cuerpo } of reglas(leer(CSS_PAGINA))) {
      expect(sinFallbacks(cuerpo), `${sel} trae un color con nombre`).not.toMatch(NOMBRES);
      for (const c of literales(cuerpo)) expect(colores.has(c), `${sel} estrena el color ${c}`).toBe(true);
    }
  });

  it("ni el VALOR de un token pastel o naranja, escrito a mano en cualquier notación", () => {
    const pastel = valoresPastel();
    const reglasR = reglasDeReservas();
    expect(reglasR.length).toBeGreaterThan(15);
    for (const { f, sel, cuerpo } of reglasR) {
      for (const [c, v] of coloresDe(cuerpo)) {
        for (const [t, pv] of pastel) expect(mismoRGB(v, pv), `${f} · ${sel}: ${c} es el valor de ${t}`).toBe(false);
      }
    }
  });

  it("ninguna regla de las notas ni de la segunda línea dibuja una caja (con cualquier selector)", () => {
    const deNotas = reglasDeReservas().filter((r) => r.f === CSS_NOTAS || esDeNotas(r.sel));
    expect(deNotas.length).toBeGreaterThan(6);
    for (const { f, sel, cuerpo } of deNotas) {
      for (const prop of PROPS_CAJA) expect(decl(cuerpo, prop), `${f} · ${sel} declara ${prop}`).toBeNull();
    }
  });

  it("AdminDashboard.css: lo de reservas no estrena colores, ni pastel ni naranja", () => {
    const propias = reglas(leer(CSS_PANEL)).filter((r) => esDeReservas(r.sel));
    expect(propias.length).toBeGreaterThan(5);
    const { colores } = sistema();
    for (const { sel, cuerpo } of propias) {
      expect(cuerpo, `${sel} trae un token pastel/naranja`).not.toMatch(PASTEL);
      expect(cuerpo.replace(/\s+/g, ""), `${sel} es naranja`).not.toMatch(NARANJA);
      expect(sinFallbacks(cuerpo), `${sel} trae un color con nombre`).not.toMatch(NOMBRES);
      for (const c of literales(cuerpo)) expect(colores.has(c), `${sel} estrena el color ${c}`).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════
describe("Reservas · píldoras de estado de la PÁGINA", () => {
  const pagina = () => reglas(leer(CSS_PAGINA));
  const reglaEstado = (e) => pagina().filter((r) => r.sel.split(",").some((s) => s.trim() === `.reservas-config-page .rc-estado--${e}`));

  it("tienen la forma de la píldora de la hermana Fidelización (.loyalty-pill) y ningún borde", () => {
    const hermana = reglas(leer("pages/LoyaltyConfigPage.css")).find((r) => r.sel === ".loyalty-pill");
    const propia = pagina().find((r) => r.sel === ".reservas-config-page .rc-estado");
    expect(hermana, "falta .loyalty-pill en la hermana").toBeTruthy();
    expect(propia, "falta la regla con ámbito .reservas-config-page .rc-estado").toBeTruthy();
    for (const prop of ["padding", "font-size", "font-weight", "text-transform", "letter-spacing"]) {
      expect(decl(propia.cuerpo, prop), `forma: ${prop}`).toBe(decl(hermana.cuerpo, prop));
    }
    expect(resolver(decl(propia.cuerpo, "border-radius"))).toBe(resolver(decl(hermana.cuerpo, "border-radius")));
    expect(decl(propia.cuerpo, "white-space")).toBe("nowrap");
    for (const { sel, cuerpo } of pagina().filter((r) => /\.rc-estado\b/.test(r.sel))) {
      for (const prop of ["border", "border-color", "border-width", "outline", "box-shadow"]) {
        expect(decl(cuerpo, prop), `${sel} lleva ${prop}`).toBeNull();
      }
    }
  });

  // R4 (cambio DECLARADO de esta prueba): hasta la R3 exigía que el PAR (fondo, texto) existiera tal
  // cual en otra píldora. Con la exigencia nueva —ningún fondo a ΔE < 10 del verde #d1fae5 ni del rosa
  // #fee2e2 de la captura, que mide reservasColorPintado.red.test.jsx sobre el color PINTADO— no queda
  // en el panel claro NINGÚN par con texto verde o rojo que cumpla (medido: todos sus tintes rojos
  // están a ΔE ≤ 9 del rosa). Ahora: el FONDO y el TEXTO salen, cada uno, de una pieza que ya existe
  // (ningún color nuevo) y el fondo es un tinte translúcido o el gris neutro de la píldora base de
  // Facturas (FacturasPage.css:233). Sigue sin valer un relleno opaco de color.
  it("cada estado: fondo y texto que ya usa el panel (ningún color nuevo), fondo tinte o gris neutro, y se lee (≥ 4,5:1)", () => {
    const { colores } = sistema();
    const fondosDePildora = new Set(reglas(leer("styles/FacturasPage.css")).filter((r) => r.sel === ".estado-factura").map((r) => norm(decl(r.cuerpo, "background"))));
    expect(fondosDePildora.size, "falta la píldora base de Facturas").toBe(1);
    const bases = basesPagina();
    for (const e of ESTADOS) {
      const r = reglaEstado(e);
      expect(r.length, `sin regla con ámbito para ${e}`).toBe(1);
      const bg = decl(r[0].cuerpo, "background");
      const co = decl(r[0].cuerpo, "color");
      expect(bg && co, `${e} sin fondo o sin texto`).toBeTruthy();
      expect(colores.has(norm(bg)), `${e} estrena el fondo ${bg}`).toBe(true);
      expect(colores.has(norm(co)), `${e} estrena el texto ${co}`).toBe(true);
      expect(resolver(co), `${e} en el negro de párrafo`).not.toBe(resolver("var(--color-texto)"));
      const alfa = rgba(bg)[3];
      const tinte = alfa > 0 && alfa <= 0.3;
      expect(tinte || fondosDePildora.has(norm(bg)), `${e}: el fondo ${bg} no es un tinte (alfa ${alfa}) ni el gris de la píldora base; una píldora clara del panel no es un relleno opaco de color`).toBe(true);
      for (const base of bases) {
        const c = contraste(co, bg, base);
        expect(c, `${e}: ${c.toFixed(2)}:1 sobre ${base}`).toBeGreaterThanOrEqual(MINIMO);
      }
    }
  });

  it("«No vino» no se pinta como «Rechazada»", () => {
    const par = (e) => { const r = reglaEstado(e)[0]; return [norm(decl(r.cuerpo, "background")), norm(decl(r.cuerpo, "color"))]; };
    const [nb, nc] = par("no-show");
    const [rb, rc] = par("rechazada");
    expect(nb).not.toBe(rb);
    expect(nc).not.toBe(rc);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════
describe("Reservas · el MODAL del panel operativo", () => {
  const panel = () => reglas(leer(CSS_PANEL));

  it("píldoras: se leen sobre el fondo del modal (≥ 4,5:1) y «No vino» ≠ «Rechazada»", () => {
    const bases = basesModal();
    const par = {};
    for (const e of ESTADOS) {
      const r = panel().find((x) => x.sel.split(",").some((s) => s.trim() === `.adm__badge--${e}`));
      expect(r, `sin color para ${e} en el modal`).toBeTruthy();
      const bg = decl(r.cuerpo, "background"); const co = decl(r.cuerpo, "color");
      par[e] = `${norm(bg)}|${norm(co)}`;
      const alfa = rgba(bg)[3];
      expect(alfa > 0 && alfa <= 0.3, `${e}: el fondo ${bg} del modal no es un tinte (alfa ${alfa})`).toBe(true);
      for (const base of bases) {
        const c = contraste(co, bg, base);
        expect(c, `${e}: ${c.toFixed(2)}:1 sobre ${base}`).toBeGreaterThanOrEqual(MINIMO);
        // Píldora del tema OSCURO: el tinte compuesto sigue siendo oscuro y el texto es el claro.
        const f = encima(rgba(bg), rgba(base));
        expect(lum(f), `${e}: fondo claro dentro del modal oscuro`).toBeLessThan(0.1);
        expect(lum(encima(rgba(co), f)), `${e}: texto más oscuro que su fondo`).toBeGreaterThan(lum(f));
      }
    }
    expect(par["no-show"]).not.toBe(par.rechazada);
    // El único color de píldora que cambia este lote sale de una píldora que YA existe en el panel.
    expect(sistema().pares.has(par["no-show"]), `«No vino» inventa el par ${par["no-show"]}`).toBe(true);
  });

  it("la píldora no se estira a toda la columna ni se parte en dos líneas", () => {
    const r = panel().find((x) => x.sel === ".adm__modal--reservas .adm__badge");
    expect(r, "falta la regla con ámbito para la píldora del modal").toBeTruthy();
    expect(decl(r.cuerpo, "white-space")).toBe("nowrap");
    expect(decl(r.cuerpo, "justify-self")).toBe("start");
  });

  it("alergias: el rojo de .adm__modal-danger, sin caja, y se leen; el mensaje, en el color de la fila", () => {
    const peligro = decl(panel().find((r) => r.sel === ".adm__modal-danger").cuerpo, "color");
    const alerg = panel().find((r) => r.sel === ".adm__modal--reservas .rc-alergias");
    expect(alerg, "falta la regla con ámbito para las alergias del modal").toBeTruthy();
    const c = decl(alerg.cuerpo, "color");
    expect(norm(resolver(c))).toBe(norm(resolver(peligro)));
    for (const prop of ["background", "background-color", "border", "border-color", "padding", "border-radius", "box-shadow"]) {
      expect(decl(alerg.cuerpo, prop), `alergias del modal con ${prop}`).toBeNull();
    }
    for (const base of basesModal()) expect(contraste(c, "rgba(0,0,0,0)", base)).toBeGreaterThanOrEqual(MINIMO);

    const fila = decl(panel().find((r) => r.sel === ".adm__modal-list-row").cuerpo, "color");
    const msg = panel().find((r) => r.sel === ".adm__modal--reservas .rc-mensaje");
    expect(msg, "falta la regla con ámbito para el mensaje del modal").toBeTruthy();
    expect(decl(msg.cuerpo, "color")).toBe(fila);
  });

  it("CADA color de texto de las reglas de reservas del modal se lee sobre el modal (≥ 4,5:1)", () => {
    const conTexto = panel().filter((r) => esDeReservas(r.sel) && !/\.adm__badge--/.test(r.sel) && decl(r.cuerpo, "color"));
    expect(conTexto.length).toBeGreaterThanOrEqual(3);
    for (const { sel, cuerpo } of conTexto) {
      const co = decl(cuerpo, "color");
      for (const base of basesModal()) {
        const v = contraste(co, "rgba(0,0,0,0)", base);
        expect(v, `${sel}: ${co} a ${v.toFixed(2)}:1 sobre ${base}`).toBeGreaterThanOrEqual(MINIMO);
      }
    }
  });

  it("en MÓVIL la cabecera se queda, como en «Stock bajo», alineada con las filas", () => {
    const movil = reglas(medias(leer(CSS_PANEL), 600));
    const deReservas = movil.filter((r) => /adm__modal--reservas/.test(r.sel));
    expect(deReservas.length, "sin reglas de móvil para el modal de reservas").toBeGreaterThan(0);
    for (const { sel, cuerpo } of movil) {
      const ocultaCabecera = sel.split(",").some((s) => /\.adm__modal-list-head\s*$/.test(s.trim()));
      expect(ocultaCabecera && decl(cuerpo, "display") === "none", `${sel} oculta la cabecera entera`).toBe(false);
    }
    // cabecera y filas con la MISMA rejilla
    const rejilla = deReservas.find((r) => /\.adm__modal-list-head/.test(r.sel) && /\.adm__modal-list-row/.test(r.sel) && decl(r.cuerpo, "grid-template-columns"));
    expect(rejilla, "cabecera y filas no comparten rejilla en móvil").toBeTruthy();
    // sólo se esconden las etiquetas de lo que se explica solo (teléfono y estado: 5.ª y 6.ª)
    const ocultas = deReservas.filter((r) => decl(r.cuerpo, "display") === "none").map((r) => r.sel);
    expect(ocultas).toEqual([".adm__modal--reservas .adm__modal-list-head > :nth-child(n+5)"]);
  });

  it("en MÓVIL el teléfono y la píldora NO comparten línea (la píldora tapaba el teléfono, D-1392)", () => {
    const movil = reglas(medias(leer(CSS_PANEL), 600));
    const fila = (pred) => {
      const r = movil.filter((x) => x.sel.split(",").some((s) => pred(s.trim())) && decl(x.cuerpo, "grid-row"));
      expect(r.length, "sin grid-row explícito").toBe(1);
      return Number(decl(r[0].cuerpo, "grid-row"));
    };
    const tel = fila((s) => s === ".adm__modal--reservas .adm__modal-list-row > :nth-child(5)");
    const pil = fila((s) => s === ".adm__modal--reservas .adm__modal-list-row > .adm__badge");
    const ext = fila((s) => s === ".adm__modal--reservas .adm__reserva-extra");
    expect(tel, "el teléfono en la línea de hora/nombre/pers./mesa").toBeGreaterThan(1);
    expect(pil, "la píldora comparte línea con el teléfono").not.toBe(tel);
    expect(pil, "la píldora en la línea de hora/nombre/pers./mesa").toBeGreaterThan(1);
    expect(ext, "la segunda línea no va después del teléfono y la píldora").toBeGreaterThan(Math.max(tel, pil));
    // ni la píldora se alinea contra el borde de la línea (se montaba hacia la izquierda sobre lo que hubiera)
    for (const r of movil.filter((x) => /\.adm__badge/.test(x.sel))) expect(decl(r.cuerpo, "justify-self")).not.toBe("end");
  });

  it("teléfono y email parten en vez de salirse del modal", () => {
    const tel = panel().find((r) => r.sel === ".adm__modal--reservas .adm__modal-list-row > :nth-child(5)" && decl(r.cuerpo, "overflow-wrap"));
    const mail = panel().find((r) => r.sel === ".adm__modal--reservas .adm__reserva-email");
    expect(tel && decl(tel.cuerpo, "overflow-wrap"), "el teléfono no parte").toBe("anywhere");
    expect(mail && decl(mail.cuerpo, "overflow-wrap"), "el email no parte").toBe("anywhere");
  });

  it("el orden de columnas del JSX es el que supone el CSS de móvil", () => {
    const src = leer(JSX_PANEL);
    const ini = src.indexOf('modal === "reservas"');
    const bloque = src.slice(ini, src.indexOf('modal === "eliminaciones"', ini));
    const cabecera = [...bloque.slice(bloque.indexOf("adm__modal-list-head")).matchAll(/<span>([^<]+)<\/span>/g)].slice(0, 6).map((m) => m[1]);
    expect(cabecera).toEqual(["Hora", "Nombre", "Pers.", "Mesa", "Teléfono", "Estado"]);
    const fila = bloque.slice(bloque.indexOf("adm__reserva-row"));
    const pos = ["fmtHora(", "r.nombre", "r.comensales", "r.mesaAsignada", "r.telefono", "adm__badge adm__badge--", "adm__reserva-extra"].map((k) => fila.indexOf(k));
    expect(pos.every((p) => p > 0), "falta una celda").toBe(true);
    expect([...pos].sort((a, b) => a - b)).toEqual(pos);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════
describe("Reservas · alergias de la PÁGINA", () => {
  it("sin caja (ni fondo, ni borde, ni relleno) y legibles sobre la tarjeta (≥ 4,5:1)", () => {
    const todas = [...reglas(leer(CSS_PAGINA)), ...reglas(leer(CSS_NOTAS))].filter((r) => /\.rc-alergias\b/.test(r.sel));
    expect(todas.length).toBeGreaterThan(0);
    for (const { sel, cuerpo } of todas) {
      for (const prop of ["background", "background-color", "border", "border-color", "padding", "border-radius", "box-shadow", "outline"]) {
        expect(decl(cuerpo, prop), `${sel} con ${prop}`).toBeNull();
      }
    }
    const alerg = reglas(leer(CSS_PAGINA)).find((r) => r.sel === ".reservas-config-page .rc-alergias");
    expect(alerg, "falta la regla con ámbito para las alergias de la página").toBeTruthy();
    const c = decl(alerg.cuerpo, "color");
    for (const base of basesPagina()) {
      const v = contraste(c, "rgba(0,0,0,0)", base);
      expect(v, `alergias a ${v.toFixed(2)}:1`).toBeGreaterThanOrEqual(MINIMO);
    }
  });

  it("CADA color de texto de la página (mensaje, alergias, tarjeta de móvil) se lee (≥ 4,5:1)", () => {
    const conTexto = reglas(leer(CSS_PAGINA)).filter((r) => !/\.rc-estado\b/.test(r.sel) && decl(r.cuerpo, "color"));
    expect(conTexto.map((r) => r.sel)).toEqual(expect.arrayContaining([".reservas-config-page .rc-mensaje", ".reservas-config-page .rc-alergias", ".rc-mcard-k", ".rc-mcard-v"]));
    for (const { sel, cuerpo } of conTexto) {
      const co = decl(cuerpo, "color");
      for (const base of basesPagina()) {
        const v = contraste(co, "rgba(0,0,0,0)", base);
        expect(v, `${sel}: ${co} a ${v.toFixed(2)}:1 sobre ${base}`).toBeGreaterThanOrEqual(MINIMO);
      }
    }
  });

  it("la tarjeta de móvil parte un email o teléfono largo en vez de salirse de la pantalla (D-1391)", () => {
    const r = reglas(leer(CSS_PAGINA)).find((x) => x.sel === ".reservas-config-page .rc-mcard-v");
    expect(r && decl(r.cuerpo, "overflow-wrap"), ".rc-mcard-v sin overflow-wrap").toBe("anywhere");
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════
describe("Reservas · la página usa las piezas de configuración", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("no trae el paginador oscuro de Finanzas ni su CSS, ni estilos en línea", () => {
    const src = leer("pages/ReservasConfigPage.jsx");
    expect(src).not.toMatch(/Finanzas\.css/);
    expect(src, "importa el COMPONENTE de Finanzas").not.toMatch(/import\s+Pagination\b/);
    expect(src).not.toMatch(/fin-pag/);
    expect(src).not.toMatch(/style=\{\{/);
  });

  const hora = (h) => new Date(Date.now() + h * 3600e3).toISOString();
  const servir = (lista) => api.get.mockImplementation(async (url) => (url === "/reservas/fechasReserva" ? { data: { fechas: [] } } : { data: lista }));
  const filas = (container) => container.querySelectorAll(".rc-desktop tbody tr");

  it("«Cancelar» lleva la clase de su gemelo «Rechazar»", async () => {
    servir([
      { _id: "p1", nombre: "Pendiente", personas: 2, telefono: "6", hora: hora(1), estado: "pendiente" },
      { _id: "c1", nombre: "Confirmada", personas: 2, telefono: "6", hora: hora(2), estado: "confirmada" },
    ]);
    render(<ReservasConfigPage />);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Rechazar" }).length).toBeGreaterThan(0));
    const rechazar = screen.getAllByRole("button", { name: "Rechazar" })[0];
    const cancelar = screen.getAllByRole("button", { name: "Cancelar" })[0];
    expect(cancelar.className).toBe(rechazar.className);
    expect(cancelar.className).not.toMatch(/btn-ghost/);
  });

  it("la paginación conserva TODAS las funciones de la de antes, con piezas claras", async () => {
    servir(Array.from({ length: 47 }, (_, i) => ({ _id: `r${i}`, nombre: `R${i}`, personas: 2, telefono: "6", hora: hora(i + 1), estado: "confirmada" })));
    const { container } = render(<ReservasConfigPage />);
    await waitFor(() => expect(filas(container)).toHaveLength(20));
    const pager = container.querySelector(".cfg-pager");
    expect(pager, "la paginación no es .cfg-pager").not.toBeNull();
    expect(container.querySelector(".fin-pagination")).toBeNull();
    const p = within(pager);
    expect(pager.textContent).toMatch(/Mostrando\s*1–20\s*de\s*47/);
    // Todos con la pieza clara de configuración; la activa, por aria-current (btn-primario = 2,10:1).
    for (const b of pager.querySelectorAll("button")) expect(b.className).toBe("btn btn-secundario cfg-btn-compact");
    expect(p.getByRole("button", { name: "1" }).getAttribute("aria-current")).toBe("page");
    expect(pager.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(p.getByRole("button", { name: "Primera página" })).toBeDisabled();
    expect(p.getByRole("button", { name: "Página anterior" })).toBeDisabled();

    fireEvent.click(p.getByRole("button", { name: "Última página" }));
    await waitFor(() => expect(filas(container)).toHaveLength(7));
    expect(pager.textContent).toMatch(/Mostrando\s*41–47\s*de\s*47/);
    expect(p.getByRole("button", { name: "3" }).getAttribute("aria-current")).toBe("page");
    expect(p.getByRole("button", { name: "Página siguiente" })).toBeDisabled();

    fireEvent.click(p.getByRole("button", { name: "Página anterior" }));
    await waitFor(() => expect(pager.textContent).toMatch(/Mostrando\s*21–40\s*de\s*47/));
    fireEvent.click(p.getByRole("button", { name: "Primera página" }));
    await waitFor(() => expect(pager.textContent).toMatch(/Mostrando\s*1–20\s*de\s*47/));
    fireEvent.click(p.getByRole("button", { name: "Página siguiente" }));
    await waitFor(() => expect(pager.textContent).toMatch(/Mostrando\s*21–40\s*de\s*47/));
    fireEvent.click(p.getByRole("button", { name: "3" }));
    await waitFor(() => expect(filas(container)).toHaveLength(7));
  });

  it("la página activa se distingue y se lee: texto ≥ 4,5:1 y borde ≥ 3:1 contra la tarjeta", () => {
    const r = reglas(leer(CSS_PAGINA)).find((x) => x.sel === '.reservas-config-page .rc-pager-pages .btn[aria-current="page"]');
    expect(r, "la página activa no se marca").toBeTruthy();
    const borde = decl(r.cuerpo, "border-color");
    expect(borde, "la página activa sin borde que la marque").toBeTruthy();
    const blanco = resolver("var(--color-fondo-card)");
    expect(contraste(borde, "rgba(0,0,0,0)", blanco), "borde de la activa < 3:1").toBeGreaterThanOrEqual(3);
    const texto = decl(reglas(leer("index.css")).find((x) => x.sel === ".btn-secundario").cuerpo, "color");
    for (const base of basesPagina()) expect(contraste(texto, "rgba(0,0,0,0)", base)).toBeGreaterThanOrEqual(MINIMO);
    expect(decl(r.cuerpo, "color"), "la activa cambia el color del texto").toBeNull();
    expect(decl(r.cuerpo, "background") || decl(r.cuerpo, "background-color"), "la activa con relleno").toBeNull();
    // Primera/anterior/siguiente/última sin destino se ven apagadas, como en la paginación de antes,
    // con la receta del botón claro desactivado de configuración (`.cfg-btn-ghost:disabled`).
    const apagado = reglas(leer(CSS_PAGINA)).find((x) => x.sel === ".reservas-config-page .rc-pager-pages .btn:disabled");
    const receta = reglas(leer("styles/config-common.css")).find((x) => x.sel === ".cfg-btn-ghost:disabled");
    expect(apagado, "los botones desactivados no se distinguen").toBeTruthy();
    expect(decl(apagado.cuerpo, "opacity")).toBe(decl(receta.cuerpo, "opacity"));
    expect(decl(apagado.cuerpo, "cursor")).toBe(decl(receta.cuerpo, "cursor"));
  });

  it("con muchas páginas, salto a una concreta y elipsis (1 … 4 [5] 6 … 10)", async () => {
    servir(Array.from({ length: 200 }, (_, i) => ({ _id: `r${i}`, nombre: `R${i}`, personas: 2, telefono: "6", hora: hora(i + 1), estado: "confirmada" })));
    const { container } = render(<ReservasConfigPage />);
    await waitFor(() => expect(filas(container)).toHaveLength(20));
    const p = within(container.querySelector(".cfg-pager"));
    fireEvent.click(p.getByRole("button", { name: "Última página" }));
    await waitFor(() => expect(p.getByRole("button", { name: "10" }).getAttribute("aria-current")).toBe("page"));
    fireEvent.click(p.getByRole("button", { name: "9" }));
    fireEvent.click(await p.findByRole("button", { name: "8" }));
    fireEvent.click(await p.findByRole("button", { name: "7" }));
    fireEvent.click(await p.findByRole("button", { name: "6" }));
    fireEvent.click(await p.findByRole("button", { name: "5" }));
    await waitFor(() => expect(container.querySelector(".cfg-pager").textContent).toMatch(/Mostrando\s*81–100\s*de\s*200/));
    expect(container.querySelectorAll(".cfg-pager .rc-pager-pages > span").length).toBe(2);
    expect(p.queryByRole("button", { name: "2" })).toBeNull();
  });
});
