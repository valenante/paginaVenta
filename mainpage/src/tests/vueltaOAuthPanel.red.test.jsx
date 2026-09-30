/**
 * vueltaOAuthPanel.red.test.jsx
 *
 * ⚖️ Constitución ALEF · Art. 4 · Art. 10.
 *
 * CONTRATO (fijado por la sesión principal, 30-sep): el OAuth vuelve a
 *   /pro?tab=otros&modulo=google-reviews&google=connected|error&motivo=…
 *   /pro?tab=otros&modulo=instagram&instagram=connected|error&motivo=…
 * LA CICATRIZ: antes Google volvía a `/configuracion` (el Dashboard) e Instagram a
 * `/otros/instagram` (ruta inexistente): el dueño nunca veía el resultado de conectar.
 * Aquí se congela el eslabón del panel: `PanelPro` abre `?tab=` si el usuario puede verla, y
 * `OtrosPage` abre `?modulo=`.
 */
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Funciones ESTABLES (como las del contexto real, memoizadas): una función nueva en cada render
// recalcula `tabs` y los efectos de scroll de PanelPro entran en bucle.
const P = vi.hoisted(() => {
  const P = { permisos: new Set() };
  P.auth = { tienePermiso: (p) => P.permisos.has(p) };
  P.plan = { hasFeature: () => true };
  P.tenant = { tenant: { tipoNegocio: "restaurante" }, loadingTenant: false, tenantError: null };
  return P;
});
// vi.hoisted: los vi.mock suben arriba del fichero y necesitan esto ya definido.
const { maniqui, montajes } = vi.hoisted(() => {
  const montajes = {};
  return {
    montajes,
    maniqui: (nombre) => ({
      default: () => {
        const R = require("react");
        R.useEffect(() => { montajes[nombre] = (montajes[nombre] || 0) + 1; }, []);
        return R.createElement("div", { "data-testid": "pantalla" }, nombre);
      },
    }),
  };
});

vi.mock("../context/TenantContext", () => ({
  useTenant: () => P.tenant,
}));
vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => P.auth,
}));
vi.mock("../context/FeaturesPlanContext", () => ({
  useFeaturesPlan: () => P.plan,
}));

// Pantallas pesadas → maniquíes con un texto reconocible.
vi.mock("../pages/EstadisticasPage", () => maniqui("Estadisticas"));
vi.mock("../components/CajaDiariaUltraPro/CajaDiariaUltraPro", () => maniqui("Caja"));
vi.mock("../pages/MapaEditor", () => maniqui("Mapa"));
vi.mock("../pages/ProductsMenu", () => maniqui("Productos"));
vi.mock("../pages/StockPage", () => maniqui("Stock"));
vi.mock("../pages/VentasPageShop", () => maniqui("VentasShop"));
vi.mock("../pages/ProductosPageShop", () => maniqui("ProductosShop"));
vi.mock("../pages/StockPageShop", () => maniqui("StockShop"));
vi.mock("../pages/panel/StaffPanel", () => maniqui("Staff"));
vi.mock("../pages/Finanzas/FinanzasPage", () => maniqui("Finanzas"));
vi.mock("../pages/HorariosPage", () => maniqui("Horarios"));
vi.mock("../components/Turnos/ControlTurnosPanel", () => maniqui("Turnos"));
vi.mock("../components/Changelog/ChangelogModal", () => ({ default: () => null }));
// Módulos de Otros
vi.mock("../pages/TiemposCocina/TiemposCocina", () => maniqui("Tiempos"));
vi.mock("../pages/DayReplay/DayReplay", () => maniqui("Replay"));
vi.mock("../pages/AutomatizacionesPage", () => maniqui("Automatizaciones"));
vi.mock("../pages/GoogleReviewsPage", () => maniqui("ModuloGoogle"));
vi.mock("../pages/SugerenciasConfigPage", () => maniqui("Sugerencias"));
vi.mock("../pages/AprendizajeIAPage", () => maniqui("AprendizajeIA"));
vi.mock("../pages/FacturasAutomaticasPage", () => maniqui("FacturasAuto"));
vi.mock("../pages/InstagramPage", () => maniqui("ModuloInstagram"));
vi.mock("../pages/TakeawayConfigPage", () => maniqui("Takeaway"));

import PanelPro from "../pages/PanelPro.jsx";
import OtrosPage from "../pages/OtrosPage.jsx";

beforeEach(() => {
  for (const k of Object.keys(montajes)) delete montajes[k];
  P.permisos = new Set(["dashboard.view", "mapa.manage", "herramientas.avanzadas"]);
  P.auth = { tienePermiso: (p) => P.permisos.has(p) };
  window.history.replaceState(null, "", "/pro");
});

describe("PanelPro · `?tab=`", () => {
  it("abre la pestaña pedida si el usuario puede verla, y quita `tab` (deja `modulo` a OtrosPage)", async () => {
    window.history.replaceState(null, "", "/pro?tab=otros&modulo=google-reviews&google=connected");
    render(<PanelPro />);
    expect(await screen.findByTestId("pantalla")).toHaveTextContent("ModuloGoogle");
    await waitFor(() => expect(window.location.search).toBe("?google=connected"));
  });

  it("con permiso NO monta antes el Panel operativo (no dispara sus peticiones para nada)", async () => {
    window.history.replaceState(null, "", "/pro?tab=otros&modulo=instagram");
    render(<PanelPro />);
    expect(await screen.findByTestId("pantalla")).toHaveTextContent("ModuloInstagram");
    expect(montajes.Staff || 0).toBe(0);
  });

  it("si el permiso llega DESPUÉS del primer render (contexto aún cargando), la pestaña pedida se abre igual", async () => {
    P.permisos.delete("herramientas.avanzadas");
    window.history.replaceState(null, "", "/pro?tab=otros&modulo=google-reviews");
    const { rerender } = render(<PanelPro />);
    expect(await screen.findByTestId("pantalla")).toHaveTextContent("Staff");
    // Llega el permiso: el contexto real publica una función nueva.
    P.permisos.add("herramientas.avanzadas");
    P.auth = { tienePermiso: (p) => P.permisos.has(p) };
    rerender(<PanelPro />);
    await waitFor(() => expect(screen.getByTestId("pantalla")).toHaveTextContent("ModuloGoogle"));
  });

  it("SIN permiso para esa pestaña ⇒ la de siempre (Panel operativo)", async () => {
    P.permisos.delete("herramientas.avanzadas");
    window.history.replaceState(null, "", "/pro?tab=otros&modulo=instagram");
    render(<PanelPro />);
    expect(await screen.findByTestId("pantalla")).toHaveTextContent("Staff");
    expect(screen.queryByText("Otros módulos")).toBeNull();
  });

  it("pestaña inventada ⇒ la de siempre", async () => {
    window.history.replaceState(null, "", "/pro?tab=noexiste");
    render(<PanelPro />);
    expect(await screen.findByTestId("pantalla")).toHaveTextContent("Staff");
  });

  it("CONTROL · sin `?tab=` abre el Panel operativo como siempre", async () => {
    render(<PanelPro />);
    expect(await screen.findByTestId("pantalla")).toHaveTextContent("Staff");
  });
});

describe("OtrosPage · `?modulo=`", () => {
  it.each([
    ["google-reviews", "ModuloGoogle"],
    ["instagram", "ModuloInstagram"],
  ])("?modulo=%s abre ese módulo y quita `modulo`", async (modulo, texto) => {
    window.history.replaceState(null, "", `/pro?modulo=${modulo}&x=1`);
    render(<OtrosPage />);
    expect(screen.getByTestId("pantalla")).toHaveTextContent(texto);
    await waitFor(() => expect(window.location.search).toBe("?x=1"));
  });

  it("módulo inventado ⇒ la rejilla de siempre", () => {
    window.history.replaceState(null, "", "/pro?modulo=inventado");
    render(<OtrosPage />);
    expect(screen.getByText("Otros módulos")).toBeInTheDocument();
    expect(screen.queryByTestId("pantalla")).toBeNull();
  });
});
