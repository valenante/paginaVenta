/**
 * landingPromesasResenasIG.red.test.js
 *
 * ⚖️ Constitución ALEF · Art. 9 (honestidad): la web de venta no puede prometer lo que el
 * backend no hace.
 *   · Google (reviewFlow.service.js `decidirAutopublicacion`, wt-google): en supervisado quedan
 *     pendientes las de ≤3★ (no «1-2»). El aviso existe: push `notifyTenant` a la app de ALEF
 *     para las ≤3★ pendientes (googleReviewsResponder.js).
 *   · «+15% de visibilidad» no tiene fuente.
 *   · Instagram se publica solo SÓLO si el dueño apaga la aprobación manual.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const leer = (rel) => fs.readFileSync(path.join(RAIZ, rel), "utf8");

describe("landing · promesas de reseñas e Instagram alineadas con el backend", () => {
  it("AutopilotIA: sin «1-2 estrellas»", () => {
    expect(leer("pages/features/AutopilotIA.jsx")).not.toMatch(/1-2 estrellas/);
  });

  it("SocialAuto: sin la cifra del 15% y con «o revisándolo antes»", () => {
    const src = leer("components/SocialAuto/SocialAuto.jsx");
    expect(src).not.toMatch(/15\s*%/);
    expect(src).toMatch(/si tú quieres, o revisándolo antes/);
  });

  // R2-ART16 (F6): los clientes empiezan en modo MANUAL ⇒ la web no puede decir que las
  // reseñas «se responden solas» ni «automáticamente». Censo 30-sep: 14 ficheros del panel
  // mencionan reseñas; los de venta que lo prometían son éstos.
  const FRASE = "La IA te prepara la respuesta de cada reseña; tú la revisas y la publicas con un clic";
  const WEB = [
    "pages/features/AutopilotIA.jsx",
    "components/SocialAuto/SocialAuto.jsx",
    "components/Ahorro/Ahorro.jsx",
    "components/Promo/PromoLanzamiento.jsx",
    "pages/blog/PostAutomatizacion.jsx",
    "pages/blog/BlogIndex.jsx",
    "components/SEO/StructuredData.jsx",
    "pages/OtrosPage.jsx",
    "pages/Ayuda/ayudaDataRestaurante.js",
  ];
  const PROMESA_AUTO = /rese(ñ|n)as?[^"\n]{0,80}(solas|autom[aá]tica)|(se responden solas|respondidas? autom[aá]ticamente|respuestas? autom[aá]ticas? (a|por|con))/i;

  it.each(WEB)("%s no promete respuestas automáticas a reseñas", (rel) => {
    expect(leer(rel)).not.toMatch(PROMESA_AUTO);
  });

  it("la frase acordada está en AutopilotIA, SocialAuto y el blog", () => {
    for (const rel of ["pages/features/AutopilotIA.jsx", "components/SocialAuto/SocialAuto.jsx", "pages/blog/PostAutomatizacion.jsx"]) {
      expect(leer(rel).replace(/\s+/g, " ")).toContain(FRASE);
    }
  });

  it("la FAQ de AutopilotIA (también va al JSON-LD de FAQ) responde con la frase acordada", () => {
    expect(leer("pages/features/AutopilotIA.jsx")).toMatch(/a: "La IA te prepara la respuesta de cada reseña; tú la revisas y la publicas con un clic\./);
  });

  it("la ayuda de alérgenos no promete «Nunca se sugiere»", () => {
    expect(leer("pages/Ayuda/ayudaDataRestaurante.js")).not.toMatch(/Nunca se sugiere algo que el cliente/);
  });
});
