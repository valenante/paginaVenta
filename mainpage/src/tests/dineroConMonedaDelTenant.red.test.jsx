/**
 * ⚖️ RED · EL PANEL ENSEÑA EUROS A UN RESTAURANTE QUE COBRA EN PESOS.
 *
 * Protege: el formato de dinero del panel contra `Config.localization` del tenant.
 *
 * ── POR QUÉ EXISTE, Y NO ES COSMÉTICO ───────────────────────────────────────────────────
 * ALEF es multi-país por diseño: el TPV y la carta leen la moneda del restaurante con
 * `useLocale()` (`tpv/src/hooks/useLocale.js:46`, `carta/src/hooks/useLocale.js:21`), que saca
 * `currencySymbol` de `config.localization`. El TPV incluso trae ya la ficha de **Argentina**
 * —CUIT, AFIP, «peso»— en su `COUNTRY_META`.
 *
 * **El panel no tiene `useLocale`.** Sus trece sitios que pintan dinero llevan el símbolo
 * cableado, casi siempre `€`.
 *
 * ── MEDIDO EN PRODUCCIÓN (Art. 12, lectura agregada, cero escrituras) ───────────────────
 *   zabor-feten        → € · EUR · es-ES
 *   tres-catorce       → **$ · ARS · es-AR**
 *   bodegon-argentino  → sin configurar (cae a los valores por defecto)
 *   anca-joaquin       → sin configurar
 *
 * ⇒ Hoy existe **un tenant configurado en pesos**, y ese restaurante ve `$` en su TPV y en su
 * carta y **`€` en su panel**. El mismo importe, en dos monedas, dentro del mismo producto.
 * ⚠️ Y no es un tenant de laboratorio: Valen confirmó que **su tío va a operar en pesos en
 * Argentina**, así que esto deja de ser una inconsistencia y pasa a ser una cifra equivocada
 * delante de un dueño de restaurante.
 *
 * ── LA PROPIEDAD QUE SE PROTEGE ─────────────────────────────────────────────────────────
 * El dinero que el panel enseña usa **la moneda que el restaurante tiene configurada**, no una
 * escrita a mano en el código.
 *
 * ⚠️ NACE ROJA en H1 y H2. H0 es control y pasa hoy.
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

/** La configuración del restaurante, controlable por caso. */
const cfg = vi.hoisted(() => ({ actual: null }));
vi.mock("../context/ConfigContext", () => ({
  useConfig: () => ({
    config: cfg.actual,
    loading: false,
    setConfig: () => {},
    hasFeature: () => true,
    planFeatures: [],
    tipoNegocio: "restaurante",
  }),
  ConfigContext: React.createContext(null),
}));

vi.mock("../utils/api", () => ({
  default: {
    get: vi.fn(async () => ({
      data: { resumenGlobal: { totalPedidos: 4, totalImporte: 100, productos: [] } },
    })),
  },
}));
vi.mock("../utils/logger", () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }));

import UsuariosStatsModal from "../components/Usuarios/UsuariosStatsModal";

const enPesos = { localization: { currencySymbol: "$", currency: "ARS", locale: "es-AR", country: "AR" } };
const enEuros = { localization: { currencySymbol: "€", currency: "EUR", locale: "es-ES", country: "ES" } };

const montar = () =>
  render(<UsuariosStatsModal usuario={{ _id: "u1", nombre: "Ana" }} onClose={() => {}} />);

describe("el panel usa la moneda del restaurante", () => {
  beforeEach(() => { cfg.actual = null; });

  // ═══════════════════════════════════════════════════════════════════════════════════
  // H0 · CONTROL — con el restaurante en euros, el importe sale en euros.
  //      Sin esto, un H1 rojo no distinguiría «hay defecto» de «la pantalla no pinta dinero».
  // ═══════════════════════════════════════════════════════════════════════════════════
  it("H0 · CONTROL · un restaurante en euros ve el importe en euros", async () => {
    cfg.actual = enEuros;
    montar();
    await waitFor(() => {
      expect(screen.getByText(/100\.00\s*€/), "la pantalla no pinta ningún importe").toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════════
  // H1 · EL DEFECTO — con el restaurante en pesos, el importe NO puede salir en euros.
  // ═══════════════════════════════════════════════════════════════════════════════════
  it("H1 · un restaurante en pesos NO ve euros en su panel", async () => {
    cfg.actual = enPesos;
    montar();

    await waitFor(() => expect(screen.getByText(/100\.00/)).toBeTruthy());

    expect(
      screen.queryByText(/100\.00\s*€/),
      "el panel enseña euros a un restaurante que cobra en pesos",
    ).toBeNull();
    expect(
      screen.getByText(/100\.00\s*\$/),
      "el importe no sale en la moneda del restaurante",
    ).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════════════
  // H2 · EL CENTINELA — ningún fichero del panel escribe el símbolo de moneda a mano.
  //      ⚠️ VIGILA LA CONDUCTA, NO EL NOMBRE. Un centinela que buscara `formatCurrency` o
  //      `fmtMoney` sería una lista negra de dos nombres, y en este mismo panel conviven ya
  //      `fmtMoney`, `fmtEur`, `formatCurrency` y `fmt`. Lo que se busca es el gesto: redondear
  //      a dos decimales y pegarle un símbolo literal al lado.
  //      Es la lección de D-242, donde una red mía dio 4/4 vigilando un nombre.
  // ═══════════════════════════════════════════════════════════════════════════════════
  it("H2 · ningún sitio del panel cablea el símbolo de moneda junto a un importe", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    // ⚠️ Se deriva del propio fichero y NO de `process.cwd()`: el lint del panel no declara los
    // globales de Node, así que `process` daba un error nuevo. Este fichero vive en `src/tests/`,
    // así que su padre es `src/`.
    const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

    const ficheros = [];
    (function rec(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (!/node_modules|tests/.test(p)) rec(p); }
        else if (/\.jsx?$/.test(e.name) && !/\.test\./.test(e.name)) ficheros.push(p);
      }
    })(raiz);

    const sinComentarios = (s) =>
      s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

    // `toFixed(2)` seguido —dentro de la misma plantilla— de un símbolo de moneda literal.
    const CABLEADO = /toFixed\(2\)[^`\n]{0,40}?(€|\\u20AC|\$\s*`|"\s*\$)/;

    /**
     * ⚠️ EN ESTE PANEL CONVIVEN DOS DINEROS, Y SÓLO UNO ES DEL RESTAURANTE.
     *  (a) el del restaurante: ventas, caja, costes, proveedores, fidelización, estadísticas.
     *      Ése puede estar en pesos y es el que este centinela persigue.
     *  (b) **el de ALEF**: el precio de los planes, la suscripción, la facturación de la
     *      plataforma, el alta de un tenant y las pantallas de registro. Eso es lo que ALEF le
     *      COBRA al restaurante, y va en euros pase lo que pase.
     *
     * Estos ficheros quedan fuera **a propósito y por escrito**. Sin esta lista el centinela se
     * quedaría rojo para siempre sobre un comportamiento correcto — y un rojo permanente se acaba
     * ignorando, que es la peor cosa que le puede pasar a una red.
     * ⚠️ La lista es de ficheros ENTEROS: si algún día una de estas pantallas empieza a enseñar
     * también dinero del restaurante, hay que sacarla de aquí y separarlo.
     */
    const DINERO_DE_ALEF = [
      "pages/admin/BillingPage.jsx",
      "pages/admin/SuperadminAltaTenant/SuperadminAltaTenant.jsx",
      "pages/admin/SuperadminAltaTenant/Paso4Provision.jsx",
      "pages/admin/AdminDashboard/components/ChartsSection.jsx",
      "components/Registro/PanelPrecio.jsx",
      "components/Registro/Paso4ResumenPago.jsx",
    ];

    const culpables = [];
    for (const f of ficheros) {
      if (DINERO_DE_ALEF.some((x) => f.endsWith(x.split("/").join(path.sep)))) continue;
      if (CABLEADO.test(sinComentarios(fs.readFileSync(f, "utf8")))) {
        culpables.push(path.relative(raiz, f));
      }
    }

    expect(
      culpables,
      `estos ficheros del panel escriben la moneda a mano en vez de leerla del restaurante:\n  ${culpables.join("\n  ")}`,
    ).toEqual([]);
  });
});
