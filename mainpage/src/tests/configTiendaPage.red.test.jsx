/**
 * configTiendaPage.red.test.jsx
 *
 * ⚖️ Constitución ALEF · Art. 4(b) la red va ANTES y sale ROJA con el defecto dentro
 *                        Art. 4(c) un test que no puede ponerse rojo no cuenta como red
 *                        Art. 5  fail-loud: sin configuración cargada NO se guarda nada
 *                        Art. 13 no añade bordes de backend: la pantalla sólo CONSUME
 *                                endpoints que ya existen y son válidos para tiendas
 *
 * LOTE PANEL-CONFIG-TIENDA — defecto que vigila:
 *   Una tienda aterriza en RestauranteConfigPage (panelRoutes.jsx la monta para todos los
 *   tenants). Esa pantalla pinta «Funcionalidades del plan» (secciones de cocina, ETA…) y
 *   llama a endpoints de restaurante (GET /configuracion al alternar un toggle → 403
 *   MODULE_UNAVAILABLE, P-404/P-413). Además guarda con el scope «restaurante_config_general»
 *   y su modal de motivo no pasa el motivo escrito.
 *
 * Los tests T1–T11 describen el comportamiento de TIENDA y deben salir ROJOS con el código de
 * hoy. T12 es la guarda de paridad del RESTAURANTE: debe salir VERDE antes y después.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const H = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  ctx: {},
  auth: {},
  tenant: {},
  onSetConfig: null,
}));

vi.mock("../utils/api", () => ({ default: { get: H.get, post: H.post, put: H.put } }));
vi.mock("../context/ConfigContext.jsx", () => ({ useConfig: () => H.ctx }));
vi.mock("../context/AuthContext.jsx", () => ({ useAuth: () => H.auth }));
vi.mock("../context/TenantContext.jsx", () => ({
  useTenant: () => ({ tenant: H.tenant, tenantId: "tienda-demo" }),
}));
vi.mock("../context/TenantContext", () => ({
  useTenant: () => ({ tenant: H.tenant, tenantId: "tienda-demo" }),
}));
vi.mock("../context/FeaturesPlanContext", () => ({
  useFeaturesPlan: () => ({ hasFeature: () => true }),
}));
vi.mock("../hooks/useLocale", () => ({ useLocale: () => ({ isSpain: true }) }));

const RestauranteConfigPage = (await import("../pages/RestauranteConfigPage.jsx")).default;

const CFG_TIENDA = {
  branding: { nombreRestaurante: "Tienda Original", logoUrl: "" },
  informacionRestaurante: { telefono: "600111222", direccion: "Calle Uno 1" },
  temaShop: { bg: "#f7f7f7", surface: "#ffffff", primary: "#2563eb" },
};

/** Endpoints que una tienda PUEDE llamar desde esta pantalla (ver informe del lote). */
const ENDPOINTS_TIENDA = [
  /^\/shop\/configuracion$/,
  /^\/shop\/configuracion\/logo$/,
  /^\/admin\/config\/versions$/,
  /^\/admin\/config\/versions\/[^/]+\/apply$/,
];

function montar({ tipo = "shop", config = CFG_TIENDA, loading = false, role = "admin_shop", puedeEditar = true } = {}) {
  H.tenant = { tipoNegocio: tipo, slug: "tienda-demo" };
  H.auth = { user: { role }, hasPermission: () => puedeEditar };
  H.ctx = {
    config,
    loading,
    setConfig: (cfg) => H.onSetConfig?.(cfg),
    refreshConfig: vi.fn(async () => config),
    hasFeature: () => true,
    planFeatures: [],
    tipoNegocio: tipo,
  };
  return render(
    <MemoryRouter>
      <RestauranteConfigPage />
    </MemoryRouter>
  );
}

/** Todas las URLs que la pantalla ha pedido, sea cual sea el verbo. */
function urlsLlamadas() {
  return [...H.get.mock.calls, ...H.post.mock.calls, ...H.put.mock.calls].map((c) => String(c[0]));
}

/**
 * Escribe el motivo en el modal de confirmación y pulsa su botón de acción.
 * Se busca por la clase REAL de ModalConfirmacion (no por el texto del botón): el texto lo
 * decide el modal, y así cada test falla por su propio defecto y no por la etiqueta.
 */
function confirmarModal(motivo) {
  const input = document.querySelector(".modal-input--modalconfirmacion");
  if (input) fireEvent.change(input, { target: { value: motivo } });
  const boton = document.querySelector(".boton-aceptar--modalconfirmacion");
  expect(boton, "el modal de confirmación debe tener botón de aceptar").not.toBeNull();
  fireEvent.click(boton);
}

describe("PANEL-CONFIG-TIENDA · la pantalla de tienda no usa endpoints ni secciones de restaurante", () => {
  beforeEach(() => {
    H.get.mockReset();
    H.post.mockReset();
    H.put.mockReset();
    H.onSetConfig = null;
    H.get.mockImplementation(async () => ({ data: {} }));
    H.post.mockImplementation(async (url) => {
      if (url === "/admin/config/versions") return { data: { version: { id: "v1" } } };
      return { data: { ok: true } };
    });
    H.put.mockImplementation(async () => ({ data: {} }));
  });

  it("T1 · al montar, la tienda no pide /configuracion, /autopilot, features-plan ni verifactu de restaurante", async () => {
    montar();
    await screen.findByText("Datos del negocio");

    const prohibidos = urlsLlamadas().filter((u) =>
      /^\/(configuracion|autopilot|admin\/features-plan|admin\/verifactu)/.test(u)
    );
    expect(prohibidos).toEqual([]);
  });

  it("T2 · el flujo de guardado completo sólo toca endpoints válidos para tienda", async () => {
    montar();
    await screen.findByText("Datos del negocio");

    fireEvent.change(screen.getByDisplayValue("Tienda Original"), { target: { value: "Tienda Nueva" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar configuración" }));
    confirmarModal("Cambio de nombre");

    await waitFor(() =>
      expect(H.post).toHaveBeenCalledWith("/admin/config/versions/v1/apply", expect.anything())
    );

    for (const url of urlsLlamadas()) {
      const valido = ENDPOINTS_TIENDA.some((re) => re.test(url));
      expect(valido, `endpoint no válido para tienda: ${url}`).toBe(true);
    }
  });

  it("T3 · no muestra secciones que dependen de restaurante (funcionalidades, pitidos, día operativo)", async () => {
    montar();
    await screen.findByText("Datos del negocio");

    expect(screen.queryByText("Funcionalidades del plan")).toBeNull();
    expect(screen.queryByText(/Pitidos de impresora/)).toBeNull();
    expect(screen.queryByText("Día operativo")).toBeNull();
  });

  it("T4 · la cabecera dice «Configuración de la tienda» (no «de la shop»)", async () => {
    montar();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Configuración de la tienda" })
    ).toBeInTheDocument();
  });

  it("T5 · guarda sólo lo cambiado, con rutas que no pisan hermanos, scope de tienda y el motivo escrito", async () => {
    montar();
    await screen.findByText("Datos del negocio");

    fireEvent.change(screen.getByDisplayValue("Tienda Original"), { target: { value: "Tienda Nueva" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar configuración" }));
    confirmarModal("Cambio de nombre");

    await waitFor(() =>
      expect(H.post).toHaveBeenCalledWith("/admin/config/versions", {
        patch: { "branding.nombreRestaurante": "Tienda Nueva" },
        scope: "tienda_config_general",
        reason: "Cambio de nombre",
      })
    );
  });

  it("T6 · sin configuración cargada NO deja guardar y lo dice (fail-loud)", async () => {
    montar({ config: null, loading: false });

    expect(
      await screen.findByText(/No se pudo cargar la configuración de la tienda/)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar configuración" })).toBeDisabled();
    expect(H.post).not.toHaveBeenCalled();
  });

  it("T7 · muestra el estado de carga mientras llega la configuración", async () => {
    montar({ config: null, loading: true });
    expect(await screen.findByText(/Cargando configuración de la tienda/)).toBeInTheDocument();
  });

  it("T8 · «Descartar cambios» devuelve el nombre guardado", async () => {
    montar();
    fireEvent.change(await screen.findByDisplayValue("Tienda Original"), {
      target: { value: "Tienda Nueva" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(screen.getByDisplayValue("Tienda Original")).toBeInTheDocument();
  });

  it("T9 · la pantalla de tienda no ofrece ningún control de revertir (decisión: sin Revertir en tienda)", async () => {
    montar();
    await screen.findByText("Datos del negocio");
    expect(screen.queryByRole("button", { name: /revertir/i })).toBeNull();
    expect(screen.queryByText(/revertir/i)).toBeNull();

    // Con cambios pendientes aparecen más controles (Descartar): tampoco puede haber ninguno de revertir.
    fireEvent.change(screen.getByDisplayValue("Tienda Original"), { target: { value: "Tienda Nueva" } });
    expect(screen.queryByRole("button", { name: /revertir/i })).toBeNull();
    expect(screen.queryByText(/revertir/i)).toBeNull();
  });

  it("T10 · el logo se sube al endpoint de tienda", async () => {
    const { container } = montar();
    await screen.findByText("Datos del negocio");

    H.post.mockImplementation(async () => ({
      data: { logoUrl: "https://api.example.test/uploads/logo.png", config: CFG_TIENDA },
    }));
    const file = new File(["x"], "logo.png", { type: "image/png" });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });

    await waitFor(() =>
      expect(H.post.mock.calls.some((c) => c[0] === "/shop/configuracion/logo")).toBe(true)
    );
  });

  it("T11 · sin permiso de edición, Guardar queda deshabilitado (aunque haya cambios)", async () => {
    montar({ puedeEditar: false, role: "staff" });
    await screen.findByText("Datos del negocio");
    // Con cambios: así el bloqueo lo causa el permiso y no la ausencia de cambios.
    fireEvent.change(screen.getByDisplayValue("Tienda Original"), { target: { value: "Tienda Nueva" } });
    expect(screen.getByRole("button", { name: "Guardar configuración" })).toBeDisabled();
  });

  it("T12 · PARIDAD restaurante: su pantalla sigue con sus secciones y cabecera (golden, verde antes y después)", async () => {
    montar({ tipo: "restaurante", role: "admin_restaurante" });
    expect(
      await screen.findByRole("heading", { level: 1, name: "Configuración del restaurante" })
    ).toBeInTheDocument();
    expect(screen.getByText("Día operativo")).toBeInTheDocument();
    expect(screen.getByText("Funcionalidades del plan")).toBeInTheDocument();
  });

  it("T13 · subir el logo no borra un cambio sin guardar (la config nueva del servidor no pisa el formulario)", async () => {
    const utils = montar();
    await screen.findByText("Datos del negocio");

    fireEvent.change(screen.getByDisplayValue("Tienda Original"), { target: { value: "Tienda Nueva" } });

    const logoUrl = "https://api.example.test/uploads/logo.png";
    const configConLogo = { ...CFG_TIENDA, branding: { ...CFG_TIENDA.branding, logoUrl } };
    H.post.mockImplementation(async () => ({ data: { logoUrl, config: configConLogo } }));
    // ConfigContext reacciona al setConfig: la config nueva llega como props nuevas.
    H.onSetConfig = (cfg) => {
      H.ctx.config = cfg;
      utils.rerender(
        <MemoryRouter>
          <RestauranteConfigPage />
        </MemoryRouter>
      );
    };

    const file = new File(["x"], "logo.png", { type: "image/png" });
    fireEvent.change(utils.container.querySelector('input[type="file"]'), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/Logo actualizado correctamente/)).toBeInTheDocument());
    expect(screen.getByDisplayValue("Tienda Nueva")).toBeInTheDocument();
  });

  it("T14 · si la configuración deja de estar disponible con cambios pendientes, Guardar queda bloqueado", async () => {
    const utils = montar();
    await screen.findByText("Datos del negocio");
    fireEvent.change(screen.getByDisplayValue("Tienda Original"), { target: { value: "Tienda Nueva" } });

    // ConfigContext pierde la config: el formulario ya no es fiable y no debe poder guardarse.
    H.ctx.config = null;
    H.ctx.loading = false;
    utils.rerender(
      <MemoryRouter>
        <RestauranteConfigPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/No se pudo cargar la configuración de la tienda/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar configuración" })).toBeDisabled();
    expect(H.post).not.toHaveBeenCalled();
  });

  it("T15 · ninguna interacción de la pantalla de tienda llama a /admin/config/rollback", async () => {
    // Cada control se pulsa en una pantalla FRESCA con cambios pendientes. Si se pulsaran todos en
    // la misma pantalla, Guardar dejaría deshabilitados los demás y el test podría pasar sin probarlos.
    montar();
    await screen.findByText("Datos del negocio");
    fireEvent.change(screen.getByDisplayValue("Tienda Original"), { target: { value: "Tienda Nueva" } });
    const nombres = screen
      .getAllByRole("button")
      .filter((b) => !b.disabled)
      .map((b) => b.textContent.trim());
    cleanup();

    for (const nombre of nombres) {
      montar();
      await screen.findByText("Datos del negocio");
      fireEvent.change(screen.getByDisplayValue("Tienda Original"), { target: { value: "Tienda Nueva" } });
      fireEvent.click(screen.getByRole("button", { name: nombre }));

      const aceptar = document.querySelector(".boton-aceptar--modalconfirmacion");
      if (aceptar) {
        const motivo = document.querySelector(".modal-input--modalconfirmacion");
        if (motivo) fireEvent.change(motivo, { target: { value: "Prueba de interacción" } });
        fireEvent.click(aceptar);
      }
      cleanup();
    }

    expect(urlsLlamadas()).not.toContain("/admin/config/rollback");
  });
});
