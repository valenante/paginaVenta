/**
 * aiCopilotGateTienda.red.test.jsx
 *
 * ⚖️ Constitución ALEF · Art. 4(b) la red va ANTES y sale ROJA con el defecto dentro
 *                        Art. 4(c) control positivo: el restaurante SÍ pide /autopilot
 *                        Art. 13 no añade bordes de backend: sólo deja de pedir una ruta
 *                        que el backend no monta para tiendas
 *
 * P-413 / P-454 — defecto que vigila:
 *   AICopilotGate monta AICopilot para cualquier usuario logueado, y AICopilot llama a
 *   useAutopilot, que hace GET /autopilot/actions. El backend monta /autopilot sólo bajo
 *   requireTipoNegocio("restaurante") (saas-api/src/app.js:795) y responde 403
 *   MODULE_UNAVAILABLE a tiendas. El copiloto (/api/copilot) no tiene ese gate y debe
 *   seguir montado en tiendas.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const H = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  auth: {},
  tenant: null,
}));

vi.mock("../utils/api", () => ({
  default: { get: H.get, post: H.post, put: H.put, delete: H.del },
}));
vi.mock("../context/AuthContext.jsx", () => ({ useAuth: () => H.auth }));
vi.mock("../context/AuthContext", () => ({ useAuth: () => H.auth }));
vi.mock("../context/TenantContext.jsx", () => ({
  useTenant: () => ({ tenant: H.tenant, tenantId: "tienda-demo" }),
}));
vi.mock("../context/TenantContext", () => ({
  useTenant: () => ({ tenant: H.tenant, tenantId: "tienda-demo" }),
}));
vi.mock("../context/FeaturesPlanContext.jsx", () => ({
  FeaturesPlanProvider: ({ children }) => children,
  useFeaturesPlan: () => ({ hasFeature: () => true }),
}));
vi.mock("../context/FeaturesPlanContext", () => ({
  FeaturesPlanProvider: ({ children }) => children,
  useFeaturesPlan: () => ({ hasFeature: () => true }),
}));

const { AICopilotGate } = await import("../App.jsx");

/** Todas las rutas /autopilot que el panel ha pedido, con cualquier verbo. */
const peticionesAutopilot = () =>
  [H.get, H.post, H.put, H.del]
    .flatMap((m) => m.mock.calls.map(([url]) => String(url)))
    .filter((url) => url.startsWith("/autopilot"));

async function montarGate(tenant) {
  H.tenant = tenant;
  render(<AICopilotGate />);
  await act(async () => {});
}

describe("AICopilotGate · /autopilot sólo para restaurante", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    H.get.mockResolvedValue({ data: {} });
    H.auth = { user: { _id: "u1", role: "admin" }, loading: false };
  });

  it("tienda: el gate NO pide /autopilot", async () => {
    await montarGate({ tipoNegocio: "shop" });
    expect(peticionesAutopilot()).toEqual([]);
  });

  it("tenant aún sin cargar: no pide /autopilot (el tipo todavía no se conoce)", async () => {
    await montarGate(null);
    expect(peticionesAutopilot()).toEqual([]);
  });

  it("restaurante: sí pide /autopilot/actions (control positivo)", async () => {
    await montarGate({ tipoNegocio: "restaurante" });
    expect(peticionesAutopilot()).toContain("/autopilot/actions?limit=20");
  });

  it("restaurante que carga tarde: pide /autopilot cuando llega el tenant", async () => {
    H.tenant = null;
    const { rerender } = render(<AICopilotGate />);
    await act(async () => {});
    expect(peticionesAutopilot()).toEqual([]);

    H.tenant = { tipoNegocio: "restaurante" };
    rerender(<AICopilotGate />);
    await act(async () => {});
    expect(peticionesAutopilot()).toContain("/autopilot/actions?limit=20");
  });

  it("tienda: el copiloto sigue montado (no se oculta por tipo de negocio)", async () => {
    await montarGate({ tipoNegocio: "shop" });
    expect(screen.getByRole("button", { name: "Abrir ALEF Autopilot" })).toBeInTheDocument();
  });
});
