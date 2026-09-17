/**
 * D-84 · RED — UN PANEL SERVIDO EN staging-* NO PUEDE HABLAR CON LA API DE PRODUCCIÓN EN SILENCIO.
 *
 * ── LO QUE PASÓ ─────────────────────────────────────────────────────────────────────────
 * `staging-panel.softalef.com` sirvió durante meses un bundle compilado contra
 * `https://api.softalef.com`. Quien creía estar probando estaba editando la base de un cliente
 * REAL. Se descubrió el 24-ago-2026 al cambiar el IVA de una categoría «en staging» y
 * encontrarlo escrito en producción (`tpv_tres-catorce`, `Caña` 10 → 21 %).
 *
 * La causa es que `VITE_API_URL` se resuelve en tiempo de BUILD. El runbook ya documentaba el
 * build correcto — no bastó, porque dependía de que alguien recordara exportar tres variables.
 *
 * ── QUÉ FIJA ESTA RED ───────────────────────────────────────────────────────────────────
 * Que la discrepancia entre ENTORNO (hostname) y API (bundle) se detecte y se GRITE. No que se
 * corrija sola: apuntar en silencio a otro sitio del que el build declara sería sustituir una
 * mentira por otra.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/** Carga `api.js` con un hostname y una VITE_API_URL dados, y devuelve lo que gritó. */
async function arrancarPanel({ hostname, apiUrl }) {
  vi.resetModules();
  document.body.innerHTML = "";
  vi.stubGlobal("location", { hostname, href: `https://${hostname}/` });
  vi.stubEnv("VITE_API_URL", apiUrl);
  const errores = [];
  const spy = vi.spyOn(console, "error").mockImplementation((...a) => errores.push(a.join(" ")));
  await import("../utils/api.js");
  spy.mockRestore();
  return {
    errores,
    banner: document.querySelector('[data-alef-guard="panel-apunta-a-produccion"]'),
    marca: window.__ALEF_GUARD_ENTORNO,
  };
}

describe("D-84 · guard de entorno del panel", () => {
  beforeEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); delete window.__ALEF_GUARD_ENTORNO; });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); document.body.innerHTML = ""; });

  it("G1 · staging-panel + API de PRODUCCIÓN → grita y se ve", async () => {
    const r = await arrancarPanel({
      hostname: "staging-panel.softalef.com",
      apiUrl: "https://api.softalef.com/api",
    });
    // ⚠️ La señal estable NO puede ser el `console`: `vite.config.js` lleva
    //    `esbuild: { drop: ["console"] }` y lo borra del build. Esto se descubrió grepeando el
    //    bundle: el test pasaba y el artefacto no lo llevaba (P-2 en el verificador).
    expect(r.marca?.code, "el código estable tiene que sobrevivir a la minificación").toBe("PANEL_APUNTA_A_PRODUCCION");
    expect(r.errores.join(" "), "y en dev, además, por consola").toContain("PANEL_APUNTA_A_PRODUCCION");
    expect(r.banner, "y un aviso VISIBLE: la consola no la mira nadie antes de pulsar Guardar").toBeTruthy();
    expect(r.banner.textContent).toMatch(/PRODUCCIÓN/i);
  });

  it("G2 · staging-panel + API de staging → no molesta", async () => {
    const r = await arrancarPanel({
      hostname: "staging-panel.softalef.com",
      apiUrl: "https://api-staging.softalef.com/api",
    });
    expect(r.errores.join(" "), "un guard que salta con el build bueno se desactiva en una semana").not.toContain("PANEL_APUNTA_A_PRODUCCION");
    expect(r.marca, "ni deja marca").toBeFalsy();
    expect(r.banner).toBeNull();
  });

  it("G3 · panel de PRODUCCIÓN + API de producción → no molesta (es lo correcto)", async () => {
    const r = await arrancarPanel({
      hostname: "panel.softalef.com",
      apiUrl: "https://api.softalef.com/api",
    });
    expect(r.errores.join(" ")).not.toContain("PANEL_APUNTA_A_PRODUCCION");
    expect(r.banner).toBeNull();
  });

  it("G4 · `api-staging` no puede confundirse con `api` (el prefijo importa)", async () => {
    // Si el guard usara `includes("api.softalef.com")` sin anclar, `api-staging.softalef.com`
    // NO lo contiene… pero un `includes("softalef.com")` sí, y saltaría siempre. G2 lo cubre;
    // esto fija el otro lado: un dominio parecido no debe engañarlo.
    const r = await arrancarPanel({
      hostname: "staging-panel.softalef.com",
      apiUrl: "https://mi-api.softalef.com.evil.test/api",
    });
    expect(r.banner, "sólo la API de producción real dispara el aviso").toBeNull();
  });
  // ── D-642 · TU PORTÁTIL TAMBIÉN ES UN ENTORNO DE PRUEBAS (17-sep) ────────────────────────
  // El guard sólo consideraba `staging-*`. Un panel abierto en `localhost` contra la API de
  // producción **no gritaba nada**, y el panel escribe precios, carta y configuración. Es el
  // mismo defecto de D-84, en el otro sitio donde la gente trabaja de verdad.
  // 🟥 G5 y G6 nacieron ROJOS el 17-sep con el defecto dentro.

  it("G5 · panel en localhost + API de PRODUCCIÓN → grita y se ve", async () => {
    const r = await arrancarPanel({ hostname: "localhost", apiUrl: "https://api.softalef.com/api" });
    expect(r.marca?.code, "en tu máquina también tiene que dejar marca").toBe("PANEL_APUNTA_A_PRODUCCION");
    expect(r.banner, "y el aviso VISIBLE, que es lo único que se mira antes de pulsar Guardar").toBeTruthy();
  });

  it("G6 · ídem con 127.0.0.1, que es la misma máquina con otro nombre", async () => {
    const r = await arrancarPanel({ hostname: "127.0.0.1", apiUrl: "https://api.softalef.com/api" });
    expect(r.marca?.code).toBe("PANEL_APUNTA_A_PRODUCCION");
    expect(r.banner).toBeTruthy();
  });

  it("G7 · CONTROL · panel en localhost contra tu API local → no molesta", async () => {
    const r = await arrancarPanel({ hostname: "localhost", apiUrl: "http://localhost:3000/api" });
    expect(r.marca, "un guard que salta con la configuración buena se desactiva en una semana").toBeFalsy();
    expect(r.banner).toBeNull();
  });

  it("G8 · LÍMITE DECLARADO · con ruta relativa el guard NO puede saberlo, y quien protege es el proxy", async () => {
    // ⚠️ Esto NO es un descuido: es el caso real de D-642. Si `VITE_API_URL=/api`, el navegador
    // no sabe a dónde va esa petición — lo decide el proxy de `vite.config.js`. Por eso el arreglo
    // de D-642 tiene DOS capas y ésta sólo cubre una:
    //   · capa 1 (compilación): el proxy apunta a tu máquina por defecto y GRITA si lo apuntas fuera
    //     (`vite.config.js`, código `ALEF-DEV-DESTINO-FUERA`, gemelo de tpv/carta);
    //   · capa 2 (ejecución): este guard, para builds con URL ABSOLUTA — el caso `npm run preview`.
    // Este caso fija por escrito que la capa 2 no cubre la ruta relativa, para que nadie lea el
    // verde de G5/G6 como «el panel ya no puede tocar producción». [CONTRATO, no red causal.]
    const r = await arrancarPanel({ hostname: "localhost", apiUrl: "/api" });
    expect(r.marca, "con ruta relativa no hay nada que mirar desde el navegador").toBeFalsy();
  });
});
