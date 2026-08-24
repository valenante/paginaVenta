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
  };
}

describe("D-84 · guard de entorno del panel", () => {
  beforeEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); document.body.innerHTML = ""; });

  it("G1 · staging-panel + API de PRODUCCIÓN → grita y se ve", async () => {
    const r = await arrancarPanel({
      hostname: "staging-panel.softalef.com",
      apiUrl: "https://api.softalef.com/api",
    });
    expect(r.errores.join(" "), "tiene que dejar un código greppable").toContain("PANEL_APUNTA_A_PRODUCCION");
    expect(r.banner, "y un aviso VISIBLE: la consola no la mira nadie antes de pulsar Guardar").toBeTruthy();
    expect(r.banner.textContent).toMatch(/PRODUCCIÓN/i);
  });

  it("G2 · staging-panel + API de staging → no molesta", async () => {
    const r = await arrancarPanel({
      hostname: "staging-panel.softalef.com",
      apiUrl: "https://api-staging.softalef.com/api",
    });
    expect(r.errores.join(" "), "un guard que salta con el build bueno se desactiva en una semana").not.toContain("PANEL_APUNTA_A_PRODUCCION");
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
});
