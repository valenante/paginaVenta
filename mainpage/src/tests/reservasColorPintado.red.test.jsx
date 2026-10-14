/**
 * reservasColorPintado.red.test.jsx — lote/panel-reservas-estilo, R4 (14-oct)
 *
 * Valen, sobre lo desplegado en producción (fbd0c40): «ESE VERDE Y ESE ROJO NO EXISTEN EN ALEF». Los dos
 * colores son #d1fae5 (el verde pastel) y #fee2e2 (el rosa pastel) de su captura.
 *
 * Esta red mira el color que PINTA el navegador, no el nombre del selector (ataque visual 3, MEDIA 1: con
 * cinco reglas de selector neutro volvió el aspecto exacto de producción y las 35 pruebas siguieron verdes).
 * Monta la PÁGINA de reservas y el MODAL «Reservas de hoy» de verdad (testing-library), carga TODAS las hojas
 * `.css` de src/ y resuelve la cascada con `cascadaCss.js` en cinco anchos y en los dos órdenes posibles de
 * ficheros. Exige, sobre el color COMPUESTO con lo que hay debajo:
 *
 *  1. Ningún fondo a la vista igual al verde ni al rosa de la captura: ΔE2000 ≥ 10 frente a #d1fae5 y frente a
 *     #fee2e2 en TODO elemento que pinte fondo (y su ::before/::after), también con la fila bajo el ratón.
 *     ΔE2000 ≈ 1 es el umbral en que el ojo nota una diferencia; 10 es «otro color» sin discusión.
 *  2. Todo texto se lee (WCAG ≥ 4,5:1) sobre lo que tiene debajo, salvo las piezas GLOBALES que esta pantalla
 *     no posee y que ya están registradas (lista `AJENAS`, cada una con su bug).
 *  3. Las notas del cliente (alergias y mensaje) no dibujan caja en ninguna de las dos pantallas.
 *  4. Las píldoras no llevan borde, sombra ni contorno, ni el negro de párrafo; en el modal oscuro, su fondo
 *     compuesto es oscuro (luminancia < 0,1).
 *  5. En móvil (≤ 600 px), dentro de cada fila del modal, ninguna celda colocada a mano comparte casilla con otra
 *     (la píldora tapando el teléfono, D-1392).
 *  6. Fail-loud: un selector que jsdom no sabe evaluar y que podría tocar este DOM rompe la red, y hay
 *     centinelas de población (no vale una red verde que no miró nada).
 *  7. (R5, ataque visual 4, D-1452) Lo que el motor NO SABE MEDIR también rompe la red, en vez de contarse como
 *     transparente o tirarse: un color que no sabe leer (`color-mix()`, `oklch()`, `mistyrose`…), un fondo con
 *     imagen que no es un degradado, un pseudo-elemento que no es ::before/::after, `filter`, `mix-blend-mode`,
 *     `background-clip: text`… y las reglas en `@layer`/`@container` o anidadas. Y los rellenos que no van en
 *     `background` (borde, contorno, sombra interior o exterior) se miden igual que un fondo (regla 1).
 *     Las pruebas «el motor GRITA» del final demuestran cada grito con una hoja mínima.
 *
 * Lo que NO mide (Art. 9) — la lista exacta está en lotes/PANEL-RESERVAS-ESTILO/CIERRE.md §R5: solapes en
 * píxeles, anchos distintos de los de `ANCHOS`, el ratón fuera de la fila, el foco, el calendario (va simulado)
 * y los modales de nueva reserva y de configuración. Eso lo mira la sonda de navegador guardada en
 * lotes/PANEL-RESERVAS-ESTILO/sonda/ (`node sonda.mjs 4623 ahora`, ver su README en el CIERRE §6) o nadie.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Cascada, cargarHojas, conEstado, conRaton, contraste, deltaE2000, encima, hojaDeCss, hojaUA, luminancia, parseColor } from "./cascadaCss.js";

// ── datos ───────────────────────────────────────────────────────────────────────────────────────
const ESTADOS = ["pendiente", "confirmada", "auto-confirmada", "rechazada", "completada", "no-show"];
const EMAIL_LARGO = "reservas.grupo.empresa.cenas@restaurante-ejemplo.test";
const enHoras = (h) => new Date(Date.now() + h * 3600e3).toISOString();
const RESERVAS = Array.from({ length: 24 }, (_, i) => ({
  _id: `r${i}`, nombre: `Cliente ${i}`, personas: 2 + (i % 4), comensales: 2 + (i % 4), hora: enHoras(i + 1),
  estado: ESTADOS[i % 6], mesaAsignada: i % 3 ? String(i) : undefined,
  telefono: i % 2 ? "+34 651 657 946" : "+34600000000",
  email: i % 4 === 0 ? EMAIL_LARGO : i % 4 === 1 ? "uno@ejemplo.test" : undefined,
  alergias: i % 3 === 0 ? "marisco" : undefined,
  mensaje: i % 2 === 0 ? "Mesa en terraza si puede ser" : undefined,
}));

vi.mock("../utils/api", () => ({
  default: {
    get: vi.fn(async (url) => (url === "/reservas/fechasReserva" ? { data: { fechas: [] } } : { data: RESERVAS })),
    patch: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(),
  },
}));
vi.mock("../hooks/useFeature", () => ({ useFeature: () => true }));
vi.mock("../components/Reservas/FiltroFechaReservas", () => ({ default: () => null }));
vi.mock("../components/Reservas/ModalNuevaReserva.jsx", () => ({ default: () => null }));
vi.mock("../components/Reservas/ReservasAjustesPage.jsx", () => ({ default: () => null }));
vi.mock("../hooks/useAdminDashboard", () => ({
  useAdminDashboard: () => ({
    loading: false, error: null, refresh: () => {},
    data: { resumen: { reservasHoy: RESERVAS.length }, caja: {}, topProductos: [], staff: [], eliminaciones: [], reservas: RESERVAS.slice(0, 12) },
  }),
}));
vi.mock("../context/ConfigContext", () => ({ useConfig: () => ({ config: {} }) }));
vi.mock("../hooks/useLocale", () => ({ useLocale: () => ({ currencySymbol: "€", locale: "es-ES" }) }));
vi.mock("../components/Panel/AnalyticsFase2", () => ({ ComparativaCard: () => null, RatioTipoCard: () => null, VentasPorHoraCard: () => null }));
vi.mock("../components/Panel/AnalyticsFase3", () => ({ CorrelacionCard: () => null, AlertasCard: () => null }));
vi.mock("../components/Panel/TiemposCocinaCard", () => ({ default: () => null }));
vi.mock("../components/Estadisticas/UpsellEstadisticasPro", () => ({ default: () => null }));

import ReservasConfigPage from "../pages/ReservasConfigPage.jsx";
import AdminDashboard from "../components/Panel/AdminDashboard.jsx";

// ── referencias ─────────────────────────────────────────────────────────────────────────────────
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOJAS = cargarHojas(RAIZ);
const VERDE_VALEN = parseColor("#d1fae5"); // --color-exito-suave, index.css:23 — la píldora verde de la captura
const ROSA_VALEN = parseColor("#fee2e2");  // --color-error-suave, index.css:29 — la caja / píldora rosa
const DELTA_MIN = 10;
const LEGIBLE = 4.5;
// R5: + 1280 (portátil) y 700 (tableta vertical), los dos que el ataque 4 usó para colar el rosa entre medias.
const ANCHOS = [[1366, 768], [1280, 800], [1024, 768], [700, 900], [390, 844], [360, 780], [320, 700]];

// Piezas GLOBALES que la pantalla no posee: se leen mal igual en producción y en las hermanas, y su arreglo
// cambia todas las páginas del panel. Cada una con su bug; NO se amplía sin uno.
const AJENAS = [
  { quien: (el) => el.closest(".btn.btn-primario"), por: "botón primario global, blanco sobre #60b5ff = 2,10:1 (D-1346)" },
  { quien: (el) => el.matches(".cfg-header p, .cfg-header p *"), por: "subtítulo global de cabecera, #6b7280 sobre el fondo oscuro de la app = 4,05:1 (D-1346)" },
];
const ajena = (el) => AJENAS.find((a) => a.quien(el));

// ── utilidades ──────────────────────────────────────────────────────────────────────────────────
const nombre = (el) => {
  const p = [];
  for (let n = el, i = 0; n && n.nodeType === 1 && i < 3; n = n.parentElement, i++) {
    const cl = [...n.classList].filter((c) => !c.startsWith("__"));
    p.unshift(n.localName + (cl.length ? "." + cl.join(".") : ""));
  }
  return p.join(" > ") + ` «${(el.textContent || "").trim().slice(0, 24)}»`;
};
const rgb = (c) => `rgb(${c.slice(0, 3).map((v) => Math.round(v)).join(",")})`;
const textoPropio = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
const todos = (raiz) => [raiz, ...raiz.querySelectorAll("*")];

const cerca = (c) => { const dv = deltaE2000(c, VERDE_VALEN), dr = deltaE2000(c, ROSA_VALEN); return dv < DELTA_MIN || dr < DELTA_MIN ? `ΔE ${dv.toFixed(1)} del verde y ${dr.toFixed(1)} del rosa de la captura` : null; };
function revisarFondos(C, raiz, fallos, ctx) {
  let pintan = 0, rellenan = 0;
  for (const el of todos(raiz)) {
    if (!C.visible(el)) continue;
    C.vigilar(el); // R5: lo que el motor no sabe medir va a C.noEvaluables (y la red falla)
    for (const ps of [null, "before", "after"]) {
      if (ps && !C.tienePseudo(el, ps)) continue;
      if (C.pintaFondo(el, ps)) {
        pintan++;
        for (const c of C.pintado(el, ps)) { const m = cerca(c); if (m) fallos.push(`${ctx} · ${nombre(el)}${ps ? "::" + ps : ""} pinta ${rgb(c)}: ${m}`); }
      }
      // R5: borde, contorno y sombra rellenan igual que un fondo (ataque 4: sombra interior de 999px, contorno de
      // 60px hacia dentro). Se compone sobre lo de debajo del elemento Y sobre lo del padre (peor caso).
      const rel = C.rellenos(el, ps);
      if (!rel.length) continue;
      const op = C.opacidad(el), padre = ps ? el : el.parentElement;
      const debajo = [...C.pintado(el, ps), ...(padre ? C.pintado(padre) : [])];
      for (const r of rel) {
        if (r.c[3] <= 0) continue;
        rellenan++;
        for (const b of debajo) {
          const c = encima([r.c[0], r.c[1], r.c[2], r.c[3] * op], b), m = cerca(c);
          if (m) fallos.push(`${ctx} · ${nombre(el)}${ps ? "::" + ps : ""} ${r.que} pinta ${rgb(c)}: ${m}`);
        }
      }
    }
  }
  return { pintan, rellenan };
}
function revisarTextos(C, raiz, fallos, ctx) {
  let n = 0;
  for (const el of todos(raiz)) {
    if (!textoPropio(el) || !C.visible(el)) continue;
    if (el.closest("button:disabled")) continue; // WCAG no exige contraste a un control inactivo
    if (ajena(el)) continue;
    n++;
    const tx = C.color(el, "color"), op = C.opacidad(el);
    for (const b of C.pintado(el)) {
      const v = contraste(encima([tx[0], tx[1], tx[2], tx[3] * op], b), b);
      if (v < LEGIBLE) fallos.push(`${ctx} · ${nombre(el)}: ${C.valor(el, "color")} sobre ${rgb(b)} = ${v.toFixed(2)}:1`);
    }
  }
  return n;
}
function revisarSinCaja(C, raiz, sel, fallos, ctx) {
  let n = 0;
  for (const cont of raiz.querySelectorAll(sel)) for (const el of todos(cont)) {
    if (!C.visible(el)) continue;
    n++;
    for (const ps of [null, "before", "after"]) {
      if (ps && !C.tienePseudo(el, ps)) continue;
      const m = C.caja(el, ps);
      if (m.length) fallos.push(`${ctx} · ${nombre(el)}${ps ? "::" + ps : ""} dibuja caja: ${m.join("; ")}`);
    }
  }
  return n;
}
function revisarPildoras(C, raiz, sel, fallos, ctx, { oscura }) {
  const negro = parseColor("#111827"); // --color-texto: el negro de párrafo de producción
  let n = 0;
  for (const el of raiz.querySelectorAll(sel)) {
    if (!C.visible(el)) continue;
    n++;
    const otra = C.caja(el).filter((m) => !m.startsWith("fondo"));
    if (otra.length) fallos.push(`${ctx} · ${nombre(el)} lleva ${otra.join("; ")}`);
    const tx = C.color(el, "color");
    if (Math.max(...[0, 1, 2].map((i) => Math.abs(tx[i] - negro[i]))) <= 8) fallos.push(`${ctx} · ${nombre(el)} con el texto negro de párrafo (${C.valor(el, "color")})`);
    if (oscura) for (const c of C.pintado(el)) if (luminancia(c) >= 0.1) fallos.push(`${ctx} · ${nombre(el)} pinta un fondo CLARO ${rgb(c)} dentro del modal oscuro`);
  }
  return n;
}
// Móvil: dentro de cada fila del modal, ninguna celda colocada a mano comparte casilla con otra.
function revisarRejilla(C, raiz, fallos, ctx) {
  let filas = 0;
  for (const fila of raiz.querySelectorAll(".adm__modal-list-row")) {
    const pistas = C.pistas(fila);
    if (!pistas) continue;
    filas++;
    const linea = (v, def) => { const x = parseInt(v, 10); if (Number.isNaN(x)) return def; return x < 0 ? pistas + 2 + x : x; };
    const celdas = [...fila.children].filter((h) => C.visible(h)).map((h) => {
      const rs = C.valor(h, "grid-row-start");
      if (!/^-?\d+$/.test(rs)) return null;
      const cs = linea(C.valor(h, "grid-column-start"), null);
      let ce = C.valor(h, "grid-column-end");
      const span = ce.match(/^span\s+(\d+)$/);
      ce = span ? (cs ?? 1) + Number(span[1]) : linea(ce, cs == null ? null : cs + 1);
      return { h, fila: Number(rs), ini: cs ?? 1, fin: ce ?? (cs ?? 1) + 1, auto: cs == null };
    }).filter(Boolean);
    for (let a = 0; a < celdas.length; a++) for (let b = a + 1; b < celdas.length; b++) {
      const x = celdas[a], y = celdas[b];
      if (x.fila === y.fila && x.ini < y.fin && y.ini < x.fin) fallos.push(`${ctx} · fila «${(fila.firstChild?.textContent || "").trim()}»: ${nombre(x.h)} y ${nombre(y.h)} en la misma casilla (línea ${x.fila}, columnas ${x.ini}-${x.fin} y ${y.ini}-${y.fin})`);
    }
  }
  return filas;
}

// R5: TODO bajo el ratón y TODO con el foco, a la vez (ataque 4: `td:hover` y `tr:focus-within td` vivían).
function revisarEstados(raiz, fallos, ctx, { ancho, alto, inverso }) {
  for (const estado of ["raton", "foco"]) {
    conEstado(raiz, estado);
    try {
      const E = new Cascada(HOJAS, { ancho, alto, inverso });
      revisarFondos(E, raiz, fallos, `${ctx} · todo con ${estado === "raton" ? "el ratón" : "el foco"}`);
      revisarTextos(E, raiz, fallos, `${ctx} · todo con ${estado === "raton" ? "el ratón" : "el foco"}`);
      expect([...E.noEvaluables], `${ctx} · ${estado}: lo que el motor no sabe medir`).toEqual([]);
    } finally { conEstado(raiz, estado, false); }
  }
}

async function montarPagina() {
  const { container } = render(
    <div className="userlayout-root"><main className="userlayout-main"><ReservasConfigPage /></main></div>,
  );
  await waitFor(() => expect(container.querySelectorAll(".rc-desktop tbody tr")).toHaveLength(20));
  return container.querySelector(".reservas-config-page");
}
function montarModal() {
  render(<div className="userlayout-root"><main className="userlayout-main"><AdminDashboard /></main></div>);
  fireEvent.click(screen.getByText("Reservas").closest("button"));
  const modal = document.querySelector(".adm__modal--reservas");
  expect(modal, "no se abrió el modal de reservas").not.toBeNull();
  return modal;
}

// ═════════════════════════════════════════════════════════════════════════════════════════════
describe("Reservas · color PINTADO (cascada resuelta, no nombres de selector)", () => {
  it("centinela: se leen todas las hojas del panel y el motor sabe ver el verde y el rosa de la captura", () => {
    expect(HOJAS.length, "hojas .css leídas").toBeGreaterThan(150);
    expect(HOJAS.reduce((n, h) => n + h.reglas.length, 0)).toBeGreaterThan(5000);
    expect(deltaE2000(VERDE_VALEN, VERDE_VALEN)).toBe(0);
    // el rosa de «Rechazada» de la R3 (rgba(239,68,68,.14) sobre blanco) es, a la vista, el de la captura
    expect(deltaE2000(encima([239, 68, 68, 0.14], [255, 255, 255, 1]), ROSA_VALEN)).toBeLessThan(DELTA_MIN);
  });

  for (const [ancho, alto] of ANCHOS) {
    it(`PÁGINA a ${ancho}px: ningún fondo verde/rosa de la captura, todo se lee, notas sin caja, píldoras sin borde`, async () => {
      const raiz = await montarPagina();
      const fallos = [];
      for (const inverso of [false, true]) {
        const ctx = `página ${ancho}px${inverso ? " (orden inverso)" : ""}`;
        const C = new Cascada(HOJAS, { ancho, alto, inverso });
        const { pintan, rellenan } = revisarFondos(C, raiz, fallos, ctx);
        const textos = revisarTextos(C, raiz, fallos, ctx);
        const notas = revisarSinCaja(C, raiz, ".rc-notas-cliente", fallos, ctx);
        const pild = revisarPildoras(C, raiz, ".rc-estado, .reservas-config-header-status > *", fallos, ctx, { oscura: false });
        revisarEstados(raiz, fallos, ctx, { ancho, alto, inverso });
        // fila bajo el ratón (escritorio): una de cada estado
        if (ancho > 768) {
          for (const e of ESTADOS) {
            const tr = raiz.querySelector(`.rc-desktop tbody .rc-estado--${e}`)?.closest("tr");
            expect(tr, `sin fila ${e}`).toBeTruthy();
            conRaton(tr);
            const H = new Cascada(HOJAS, { ancho, alto, inverso });
            revisarFondos(H, tr, fallos, `${ctx} · ratón sobre ${e}`);
            revisarTextos(H, tr, fallos, `${ctx} · ratón sobre ${e}`);
            conRaton(tr, false);
            // R5: también con el ratón encima, lo que no se sabe medir grita (antes sólo se miraba en reposo)
            expect([...H.noEvaluables], `${ctx} · ratón sobre ${e}: lo que el motor no sabe medir`).toEqual([]);
          }
        }
        if (ancho > 768) {
          // El teléfono no se parte en la tabla de escritorio («+34 651 657 / 946», D-1438).
          const col = [...raiz.querySelectorAll(".rc-desktop thead th")].findIndex((th) => th.textContent.trim() === "Teléfono");
          expect(col, "sin columna Teléfono").toBeGreaterThanOrEqual(0);
          for (const tr of raiz.querySelectorAll(".rc-desktop tbody tr")) {
            const td = tr.children[col];
            if (C.valor(td, "white-space") !== "nowrap") fallos.push(`${ctx} · ${nombre(td)}: el teléfono puede partirse (white-space ${C.valor(td, "white-space")})`);
          }
          // La columna de la página puede encoger por debajo del ancho de su tabla (la tabla se desplaza DENTRO
          // de su tarjeta): si no, entre 769 y ~955 px la tarjeta se sale de la pantalla y se corta (D-1439).
          for (const item of raiz.querySelectorAll(".cfg-layout > *")) {
            const mw = C.valor(item, "min-width"), ov = C.valor(item, "overflow-x") || C.valor(item, "overflow");
            if (!/^0(px)?$/.test(mw || "") && !/^(hidden|auto|scroll|clip)/.test(ov || "")) fallos.push(`${ctx} · ${nombre(item)}: la columna no puede encoger por debajo de su contenido (min-width ${mw || "auto"})`);
          }
        }
        // centinelas: la red miró algo de verdad
        expect(pintan, `${ctx}: elementos que pintan fondo`).toBeGreaterThan(20);
        expect(rellenan, `${ctx}: bordes, contornos y sombras medidos`).toBeGreaterThan(20);
        expect(textos, `${ctx}: textos medidos`).toBeGreaterThan(80);
        expect(notas, `${ctx}: elementos de notas`).toBeGreaterThan(10);
        expect(pild, `${ctx}: píldoras visibles`).toBeGreaterThanOrEqual(15);
        expect([...C.noEvaluables], `${ctx}: lo que el motor no sabe medir y toca este DOM (selector que jsdom no evalúa, color ilegible, pseudo-elemento, imagen, filtro…)`).toEqual([]);
      }
      expect(fallos).toEqual([]);
    }, 60000);

    it(`MODAL a ${ancho}px: ningún fondo verde/rosa de la captura, píldoras oscuras, todo se lee, notas sin caja, nada se pisa`, () => {
      const raiz = montarModal();
      const fallos = [];
      for (const inverso of [false, true]) {
        const ctx = `modal ${ancho}px${inverso ? " (orden inverso)" : ""}`;
        const C = new Cascada(HOJAS, { ancho, alto, inverso });
        const { pintan, rellenan } = revisarFondos(C, raiz, fallos, ctx);
        const textos = revisarTextos(C, raiz, fallos, ctx);
        const notas = revisarSinCaja(C, raiz, ".adm__reserva-extra", fallos, ctx);
        const pild = revisarPildoras(C, raiz, ".adm__badge", fallos, ctx, { oscura: true });
        const filas = revisarRejilla(C, raiz, fallos, ctx);
        revisarEstados(raiz, fallos, ctx, { ancho, alto, inverso });
        expect(pintan, `${ctx}: elementos que pintan fondo`).toBeGreaterThan(12);
        expect(rellenan, `${ctx}: bordes, contornos y sombras medidos`).toBeGreaterThan(5);
        expect(textos, `${ctx}: textos medidos`).toBeGreaterThan(60);
        expect(notas, `${ctx}: elementos de notas`).toBeGreaterThan(10);
        expect(pild, `${ctx}: píldoras`).toBe(12);
        if (ancho <= 600) expect(filas, `${ctx}: filas con rejilla de móvil`).toBeGreaterThanOrEqual(12);
        expect([...C.noEvaluables], `${ctx}: lo que el motor no sabe medir y toca este DOM (selector que jsdom no evalúa, color ilegible, pseudo-elemento, imagen, filtro…)`).toEqual([]);
      }
      expect(fallos).toEqual([]);
    }, 60000);
  }
});

// ═════════════════════════════════════════════════════════════════════════════════════════════
// R5 (ataque visual 4, D-1452): el motor GRITA ante lo que no sabe medir. Una hoja mínima por cada forma de
// colar el verde o el rosa que el ataque 4 dejó viva (MY1-MY13); cada caso exige que la red FALLE (o por
// `noEvaluables` o por la distancia de color). El control exige lo contrario: que no grite sin motivo.
describe("Reservas · el motor GRITA ante lo que no sabe medir (R5)", () => {
  const DOM = `<main class="m-pag"><table><tbody><tr><td class="m-cel"><div><span class="m-pil">Rechazada</span></div></td></tr></tbody></table><input class="m-cam" placeholder="buscar"></main>`;
  const medir = (css, { estado = null, ancho = 1366 } = {}) => {
    document.body.innerHTML = DOM;
    const raiz = document.querySelector(".m-pag");
    if (estado) conEstado(raiz, estado);
    const C = new Cascada([hojaUA(), hojaDeCss(`.m-pag { background: #ffffff; color: #111827; } ${css}`)], { ancho, alto: 800 });
    const fallos = [];
    revisarFondos(C, raiz, fallos, "prueba");
    revisarTextos(C, raiz, fallos, "prueba");
    return { ruido: [...C.noEvaluables], fallos, fuera: C.fuera };
  };
  const grita = (r, re) => r.ruido.some((x) => re.test(x));
  const CASOS = [
    // [qué, css, cómo debe fallar: «ruido» (noEvaluables) o «distancia» (fallos de ΔE), y qué dice]
    ["color-mix() (MY1)", ".m-pil { background: color-mix(in srgb, #ef4444 15%, white); }", "ruido", /no sabe leer.*color-mix/],
    ["oklch() en la abreviada (MY12)", ".m-pil { background: oklch(0.94 0.03 18); }", "ruido", /no sabe leer.*oklch/],
    ["nombre de color que no conoce (MY2)", ".m-pil { background: mistyrose; }", "ruido", /no sabe leer.*mistyrose/],
    ["nombre desconocido en la propiedad larga", ".m-pil { background-color: honeydew; }", "ruido", /no sabe leer.*honeydew/],
    ["borde con color ilegible", ".m-pil { border: 2px solid lab(90 10 5); }", "ruido", /no sabe leer.*lab\(/],
    ["degradado con un color ilegible", ".m-cel { background: linear-gradient(90deg, #fff 0%, oklch(0.94 0.03 18) 100%); }", "ruido", /no sabe leer.*oklch/],
    ["imagen SVG en el fondo (MY11)", ".m-pil { background-image: url(\"data:image/svg+xml,x\"); }", "ruido", /imagen que el motor no sabe medir/],
    ["::first-line (MY3)", ".m-cel div > span:first-child::first-line { background: #fee2e2; }", "ruido", /pseudo-elemento ::first-line/],
    ["::selection en los descendientes", ".m-cel ::selection { background: #fee2e2; }", "ruido", /pseudo-elemento ::selection.*p\. ej\. en (div|span)/],
    ["::placeholder", ".m-cam::placeholder { color: #fee2e2; }", "ruido", /pseudo-elemento ::placeholder/],
    ["::before de los descendientes (con espacio)", ".m-cel ::before { content: ''; background: #fee2e2; }", "distancia", /span\.m-pil «Rechazada»::before pinta/],
    ["::before con ratón (no es una caja en reposo)", ".m-pil::before:hover { background: #fee2e2; }", "ruido", /pseudo-elemento ::before/],
    ["filter", ".m-cel { filter: hue-rotate(140deg); }", "ruido", /filter: hue-rotate/],
    ["mix-blend-mode", ".m-pil { mix-blend-mode: multiply; }", "ruido", /mix-blend-mode/],
    ["texto recortado al fondo", ".m-pil { -webkit-background-clip: text; -webkit-text-fill-color: transparent; }", "ruido", /background-clip|text-fill-color/],
    ["border-image", ".m-cel { border-image: linear-gradient(#fee2e2, #fee2e2) 30; }", "ruido", /border-image/],
    ["@layer", "@layer base { .m-pil { background: #fee2e2; } }", "ruido", /@layer/],
    ["@container", "@container (min-width: 1px) { .m-pil { background: #fee2e2; } }", "ruido", /@container/],
    ["CSS anidado (MY8)", ".m-pag { td > span { background: #d1fae5; } }", "ruido", /CSS anidado/],
    ["@media con sintaxis de rango", "@media (width >= 1px) { .m-pil { background: #ffffff; } }", "ruido", /@media que el motor no entiende/],
    ["@media con un rasgo que no conoce", "@media (min-resolution: 2dppx) { .m-pil { background: #ffffff; } }", "ruido", /@media que el motor no entiende/],
    ["sombra interior (MY4)", ".m-cel { box-shadow: inset 0 0 0 999px #fee2e2; }", "distancia", /sombra interior pinta/],
    ["contorno hacia dentro (MY9)", ".m-cel { outline: 60px solid #fee2e2; outline-offset: -60px; }", "distancia", /contorno pinta/],
    ["borde grueso", ".m-cel { border: 40px solid #d1fae5; }", "distancia", /borde top pinta/],
    ["sombra exterior", ".m-pil { box-shadow: 0 0 0 30px #d1fae5; }", "distancia", /sombra pinta/],
  ];
  for (const [que, css, como, dice] of CASOS) {
    it(`grita: ${que}`, () => {
      const r = medir(css);
      if (como === "ruido") expect(grita(r, dice), `noEvaluables: ${JSON.stringify(r.ruido)}`).toBe(true);
      else expect(r.fallos.some((f) => dice.test(f)), `fallos: ${JSON.stringify(r.fallos)}`).toBe(true);
    });
  }
  it("grita: el ratón sobre una CELDA (MY5) y el foco en la fila (MY6), con todo encendido a la vez", () => {
    expect(medir(".m-cel:hover { background: #fee2e2; }", { estado: "raton" }).fallos.length).toBeGreaterThan(0);
    expect(medir("tr:focus-within td { background: #d1fae5; }", { estado: "foco" }).fallos.length).toBeGreaterThan(0);
    expect(medir(".m-pil:active { background: #fee2e2; }", { estado: "raton" }).fallos.length).toBeGreaterThan(0);
    // y en reposo no (el estado no se inventa)
    expect(medir(".m-cel:hover { background: #fee2e2; }").fallos).toEqual([]);
  });
  it("control: con colores que sabe leer, la barra de desplazamiento y lo neutro, NO grita (no es una red que siempre falla)", () => {
    const r = medir(`.m-pil { background: rgba(22, 163, 74, 0.06); color: #047857; border: 0; box-shadow: 0 1px 2px rgba(0,0,0,.1); }
      .m-cel { background: linear-gradient(90deg, #ffffff 0%, rgb(243 244 246) 100%); filter: none; mix-blend-mode: normal; }
      .m-pag ::-webkit-scrollbar-thumb { background: #fee2e2; }
      @media (max-width: 600px) { .m-pil { background: #fee2e2; } }`);
    expect(r.ruido).toEqual([]);
    expect(r.fallos).toEqual([]);
    expect([...r.fuera.keys()].join(), "la barra de desplazamiento se CUENTA aunque no se mida").toMatch(/-webkit-scrollbar-thumb/);
  });
});

