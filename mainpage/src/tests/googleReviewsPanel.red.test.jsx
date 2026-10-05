/**
 * googleReviewsPanel.red.test.jsx
 *
 * ⚖️ Constitución ALEF · Art. 4 (la red se pone ANTES) · Art. 10 (un fix de backend no está
 * probado hasta ver al frontend llamándolo).
 *
 * LA CICATRIZ: el backend de Google Reviews (lote FEATURES-VENTA-30SEP, `wt-google`) necesita
 * `accountId/locationId` para leer reseñas, pero el panel NO tenía selector de ficha: la
 * integración no leía NINGUNA reseña y la pantalla decía «Conectado». Tampoco enseñaba el
 * `estado` real, ni dejaba editar el borrador, ni responder con texto propio tras rechazar.
 *
 * Contrato leído de `saas-api/src/routes/adminTenant/googleReviewsRoutes.js` (wt-google):
 *   GET /admin/google/status → { connected, enabled, modo, locationName, negocioElegido,
 *                                estado, ultimoError, ultimaSyncAt, … }
 *   GET /accounts → { accounts:[{accountId, accountName}] } · GET /locations → { locations:[
 *   {locationId, displayName, address}] } · PUT /location { accountId, locationId, locationName }
 *   POST /reviews/:id/approve [{respuesta}] · PUT /reviews/:id/borrador {respuesta}
 *   POST /reviews/:id/responder {respuesta}
 */
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

vi.mock("../context/ConfigContext", () => ({
  useConfig: () => ({ config: null, loading: false, setConfig: () => {}, hasFeature: () => true, planFeatures: [], tipoNegocio: "restaurante" }),
  ConfigContext: React.createContext(null),
}));

const H = vi.hoisted(() => ({ status: null, reviews: [], pending: [], accounts: [], locations: [], fallos: {} }));

vi.mock("../utils/api", () => {
  const responder = (metodo) => vi.fn(async (url) => {
    const clave = `${metodo} ${url}`;
    if (H.fallos[clave]) throw H.fallos[clave];
    if (url === "/admin/google/status") return { data: H.status };
    if (url === "/admin/google/reviews") return { data: { ok: true, reviews: H.reviews, total: H.reviews.length } };
    if (url === "/admin/google/reviews/pending") return { data: { ok: true, reviews: H.pending } };
    if (url === "/admin/google/accounts") return { data: { ok: true, accounts: H.accounts } };
    if (url === "/admin/google/locations") return { data: { ok: true, locations: H.locations } };
    return { data: { ok: true } };
  });
  return { default: { get: responder("GET"), post: responder("POST"), put: responder("PUT"), delete: responder("DELETE") } };
});

import api from "../utils/api";
import GoogleReviewsPage from "../pages/GoogleReviewsPage.jsx";

const statusBase = (extra = {}) => ({
  ok: true, connected: true, enabled: true, modo: "supervisado", locationName: null,
  negocioElegido: true, estado: "ok", ultimoError: null, ultimaSyncAt: "2026-09-30T08:00:00.000Z",
  pendientes: 0, errores: 0, ...extra,
});

// Las pestañas (no los filtros «Pendientes» de la lista, que se llaman igual).
const irA = (nombre) => {
  const tab = [...document.querySelectorAll(".grev-tab-btn")].find((b) => b.textContent.startsWith(nombre));
  if (!tab) throw new Error(`no hay pestaña ${nombre}`);
  fireEvent.click(tab);
};

beforeEach(() => {
  vi.clearAllMocks();
  H.status = statusBase();
  H.reviews = [];
  H.pending = [];
  H.accounts = [];
  H.locations = [];
  H.fallos = {};
  window.history.replaceState(null, "", "/otros");
});

describe("Google Reviews · (a) selector de cuenta y ficha", () => {
  it("sin ficha elegida pide las cuentas, luego las fichas, y GUARDA la elegida con PUT /location", async () => {
    H.status = statusBase({ negocioElegido: false, estado: "sin_negocio" });
    H.accounts = [
      { accountId: "accounts/1", accountName: "Zabor SL" },
      { accountId: "accounts/2", accountName: "Otra" },
    ];
    H.locations = [
      { locationId: "locations/11", displayName: "Zabor Fetén", address: "Calle 1" },
      { locationId: "locations/12", displayName: "Zabor Centro", address: "" },
    ];
    render(<GoogleReviewsPage />);
    irA("Configuracion");

    const cuenta = await screen.findByLabelText("Cuenta de Google Business");
    expect(api.get).toHaveBeenCalledWith("/admin/google/accounts");
    fireEvent.change(cuenta, { target: { value: "accounts/1" } });

    const ficha = await screen.findByLabelText("Ficha del restaurante");
    expect(api.get).toHaveBeenCalledWith("/admin/google/locations", { params: { accountId: "accounts/1" } });
    fireEvent.change(ficha, { target: { value: "locations/12" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar ficha" }));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("/admin/google/location", {
        accountId: "accounts/1", locationId: "locations/12", locationName: "Zabor Centro",
      })
    );
    expect(await screen.findByText("Ficha guardada: Zabor Centro")).toBeInTheDocument();
  });

  it("si Google falla al listar fichas, enseña el mensaje de la API (no lo traga)", async () => {
    H.status = statusBase({ negocioElegido: false, estado: "sin_negocio" });
    H.accounts = [{ accountId: "accounts/1", accountName: "A" }, { accountId: "accounts/2", accountName: "B" }];
    H.fallos["GET /admin/google/locations"] = { response: { data: { message: "No hay ficha de Google Business elegida, o Google no la encuentra." } } };
    render(<GoogleReviewsPage />);
    irA("Configuracion");
    fireEvent.change(await screen.findByLabelText("Cuenta de Google Business"), { target: { value: "accounts/2" } });
    expect(await screen.findByText("No hay ficha de Google Business elegida, o Google no la encuentra.")).toBeInTheDocument();
    expect(api.put).not.toHaveBeenCalled();
  });
});

describe("Google Reviews · (b) estado real, última sincronización y último error", () => {
  it.each([
    ["ok", "ALEF lee las reseñas de tu ficha de Google."],
    ["sin_negocio", "Sin ella ALEF no puede leer ninguna reseña"],
    ["token_invalido", "Google ha retirado el permiso de ALEF"],
    ["sin_acceso_api", "Google aún no ha aprobado el acceso de ALEF a la API de reseñas; lo estamos tramitando"],
    ["error", "Google no respondió bien en la última sincronización"],
  ])("estado %s ⇒ texto humano", async (estado, texto) => {
    H.status = statusBase({ estado, ultimoError: estado === "ok" ? null : "HTTP 403 PERMISSION_DENIED" });
    render(<GoogleReviewsPage />);
    const caja = await screen.findByTestId("grev-estado");
    expect(caja).toHaveTextContent(texto);
    expect(caja).toHaveTextContent("Ultima sincronizacion correcta");
    if (estado !== "ok") expect(caja).toHaveTextContent("Ultimo error: HTTP 403 PERMISSION_DENIED");
  });

  it("token_invalido ofrece «Volver a conectar» aunque `connected` siga true", async () => {
    H.status = statusBase({ estado: "token_invalido" });
    const abrir = vi.spyOn(window, "open").mockImplementation(() => null);
    H.fallos = {};
    render(<GoogleReviewsPage />);
    irA("Configuracion");
    fireEvent.click(await screen.findByRole("button", { name: "Volver a conectar" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/google/auth-url"));
    abrir.mockRestore();
  });
});

describe("Google Reviews · (c) editar borrador y responder con texto propio", () => {
  const HUELLA = "9f2c".padEnd(64, "a"); // sha256 hex tal como llega del GET
  const pendiente = { _id: "r1", authorName: "Ana", rating: 2, text: "Frío", draftResponse: "Borrador IA", status: "pending", huellaBorrador: HUELLA };

  it("aprobar SIN editar manda la `huellaBorrador` del borrador que se VIO (R2-ART16)", async () => {
    H.pending = [pendiente];
    render(<GoogleReviewsPage />);
    irA("Pendientes");
    fireEvent.click(await screen.findByRole("button", { name: "Aprobar y publicar" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(api.post.mock.calls[0]).toEqual(["/admin/google/reviews/r1/approve", { huellaBorrador: HUELLA }]);
  });

  it("R4C-1 · se ENSEÑA y se propone editar `textoAPublicar` (lo que certifica la huella), no `draftResponse`", async () => {
    H.pending = [{ ...pendiente, draftResponse: "Borrador IA viejo", textoAPublicar: "Texto aprobado que saldría" }];
    render(<GoogleReviewsPage />);
    irA("Pendientes");
    expect(await screen.findByText("Texto aprobado que saldría")).toBeInTheDocument();
    expect(screen.queryByText("Borrador IA viejo")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Editar respuesta" }));
    expect(screen.getByLabelText("Edita la respuesta antes de publicarla")).toHaveValue("Texto aprobado que saldría");
  });

  it("R4C-1 · sin `textoAPublicar` (backend viejo) se usa `draftResponse`", async () => {
    H.pending = [pendiente];
    render(<GoogleReviewsPage />);
    irA("Pendientes");
    expect(await screen.findByText("Borrador IA")).toBeInTheDocument();
  });

  it("R4C-1 · «Responder con mi texto» parte de `textoAPublicar`", async () => {
    H.reviews = [{ _id: "r9", authorName: "Luis", rating: 1, status: "error", draftResponse: "IA vieja", textoAPublicar: "Texto certificado" }];
    render(<GoogleReviewsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Responder con mi texto" }));
    expect(screen.getByLabelText("Tu respuesta")).toHaveValue("Texto certificado");
  });

  it("409 BORRADOR_CAMBIADO ⇒ avisa y RECARGA las pendientes para revisarlo", async () => {
    H.pending = [pendiente];
    H.fallos["POST /admin/google/reviews/r1/approve"] = {
      response: { status: 409, data: { ok: false, code: "BORRADOR_CAMBIADO", message: "mensaje técnico" } },
    };
    render(<GoogleReviewsPage />);
    irA("Pendientes");
    await screen.findByRole("button", { name: "Aprobar y publicar" });
    const antes = api.get.mock.calls.filter((c) => c[0] === "/admin/google/reviews/pending").length;
    fireEvent.click(screen.getByRole("button", { name: "Aprobar y publicar" }));
    expect(await screen.findByText("Este borrador ha cambiado desde que lo abriste; revísalo antes de aprobar")).toBeInTheDocument();
    expect(screen.queryByText("mensaje técnico")).toBeNull();
    await waitFor(() =>
      expect(api.get.mock.calls.filter((c) => c[0] === "/admin/google/reviews/pending").length).toBeGreaterThan(antes)
    );
  });

  it("CONTROL · otro error al aprobar enseña el mensaje de la API, no el de borrador cambiado", async () => {
    H.pending = [pendiente];
    H.fallos["POST /admin/google/reviews/r1/approve"] = { response: { status: 502, data: { code: "GOOGLE_ERROR", message: "Google no ha respondido bien." } } };
    render(<GoogleReviewsPage />);
    irA("Pendientes");
    fireEvent.click(await screen.findByRole("button", { name: "Aprobar y publicar" }));
    expect(await screen.findByText("Google no ha respondido bien.")).toBeInTheDocument();
    expect(screen.queryByText(/ha cambiado desde que lo abriste/)).toBeNull();
  });

  it("editar y aprobar publica EL TEXTO EDITADO", async () => {
    H.pending = [pendiente];
    render(<GoogleReviewsPage />);
    irA("Pendientes");
    fireEvent.click(await screen.findByRole("button", { name: "Editar respuesta" }));
    const area = screen.getByLabelText("Edita la respuesta antes de publicarla");
    expect(area).toHaveValue("Borrador IA");
    fireEvent.change(area, { target: { value: "  Lo sentimos, Ana  " } });
    fireEvent.click(screen.getByRole("button", { name: "Aprobar y publicar" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/admin/google/reviews/r1/approve", { respuesta: "Lo sentimos, Ana" })
    );
  });

  it("guardar borrador llama a PUT /borrador sin publicar", async () => {
    H.pending = [pendiente];
    render(<GoogleReviewsPage />);
    irA("Pendientes");
    fireEvent.click(await screen.findByRole("button", { name: "Editar respuesta" }));
    fireEvent.change(screen.getByLabelText("Edita la respuesta antes de publicarla"), { target: { value: "Nuevo" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/admin/google/reviews/r1/borrador", { respuesta: "Nuevo" }));
    expect(api.post).not.toHaveBeenCalled();
  });

  it("una reseña RECHAZADA se puede responder con texto propio (POST /responder)", async () => {
    H.reviews = [{ _id: "r9", authorName: "Luis", rating: 1, text: "Mal", draftResponse: "IA", status: "rejected", rejectedReason: "tono" }];
    render(<GoogleReviewsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Responder con mi texto" }));
    fireEvent.change(screen.getByLabelText("Tu respuesta"), { target: { value: "Gracias, Luis" } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar mi respuesta" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/admin/google/reviews/r9/responder", { respuesta: "Gracias, Luis" }));
  });

  it("si /responder falla, enseña el mensaje de la API", async () => {
    H.reviews = [{ _id: "r9", authorName: "Luis", rating: 1, status: "rejected" }];
    H.fallos["POST /admin/google/reviews/r9/responder"] = { response: { data: { message: "Google no ha respondido bien. Inténtalo más tarde." } } };
    render(<GoogleReviewsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Responder con mi texto" }));
    fireEvent.change(screen.getByLabelText("Tu respuesta"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar mi respuesta" }));
    expect(await screen.findByText("Google no ha respondido bien. Inténtalo más tarde.")).toBeInTheDocument();
  });
});

describe("Google Reviews · (d) vuelta del OAuth `?google=connected`", () => {
  it("abre Configuración, avisa, refresca el estado y limpia la URL", async () => {
    window.history.replaceState(null, "", "/pro?tab=otros&modulo=google-reviews&google=connected");
    H.status = statusBase({ negocioElegido: false, estado: null, ultimaSyncAt: null });
    H.accounts = [];
    render(<GoogleReviewsPage />);
    expect(await screen.findByTestId("grev-vuelta-google")).toHaveTextContent("Google conectado");
    expect(await screen.findByTestId("grev-ficha")).toBeInTheDocument();
    // Sólo quita lo suyo: `tab`/`modulo` son de PanelPro y OtrosPage.
    await waitFor(() => expect(window.location.search).toBe("?tab=otros&modulo=google-reviews"));
    expect(api.get).toHaveBeenCalledWith("/admin/google/status");
  });

  it("`google=error&motivo=…` avisa del fallo con el motivo y limpia la URL", async () => {
    window.history.replaceState(null, "", "/pro?tab=otros&modulo=google-reviews&google=error&motivo=access_denied");
    render(<GoogleReviewsPage />);
    const aviso = await screen.findByTestId("grev-vuelta-google");
    expect(aviso).toHaveTextContent("No se pudo conectar Google (motivo: access_denied)");
    expect(aviso).not.toHaveTextContent("Google conectado");
    await waitFor(() => expect(window.location.search).toBe("?tab=otros&modulo=google-reviews"));
  });

  it("CONTROL · sin el parámetro abre Reseñas y no avisa", async () => {
    render(<GoogleReviewsPage />);
    await screen.findByTestId("grev-estado");
    expect(screen.queryByTestId("grev-vuelta-google")).toBeNull();
    expect(screen.queryByTestId("grev-ficha")).toBeNull();
  });

  it("al volver a la pestaña (focus) vuelve a pedir el estado", async () => {
    render(<GoogleReviewsPage />);
    await screen.findByTestId("grev-estado");
    const antes = api.get.mock.calls.filter((c) => c[0] === "/admin/google/status").length;
    window.dispatchEvent(new Event("focus"));
    await waitFor(() =>
      expect(api.get.mock.calls.filter((c) => c[0] === "/admin/google/status").length).toBe(antes + 1)
    );
  });
});

describe("Google Reviews · (e) los modos dicen la verdad del backend", () => {
  it("supervisado ≤3★ pendiente · automático ≤2★ nunca solo · manual todo pendiente", async () => {
    render(<GoogleReviewsPage />);
    irA("Configuracion");
    const sup = (await screen.findByText("Supervisado")).closest("label");
    expect(sup).toHaveTextContent("Las de 3 estrellas o menos quedan pendientes");
    const auto = screen.getByText("Automatico").closest("label");
    expect(auto).toHaveTextContent("Las de 1 y 2 estrellas no se publican solas");
    expect(auto).not.toHaveTextContent("todas las respuestas generadas por IA sin intervencion");
    const man = screen.getByText("Manual").closest("label");
    expect(within(man).getByText("Tú revisas y publicas cada respuesta; cuando quieras, pasa a Supervisado.")).toBeInTheDocument();
  });

  it("modo MANUAL (el de partida, R2-ART16) ⇒ la pantalla lo explica", async () => {
    H.status = statusBase({ modo: "manual" });
    render(<GoogleReviewsPage />);
    irA("Configuracion");
    expect(await screen.findByTestId("grev-modo-manual")).toHaveTextContent(
      "la IA te prepara la respuesta de cada reseña; tú la revisas y la publicas con un clic. Cuando quieras, pasa a Supervisado."
    );
  });

  it("CONTROL · en supervisado no sale el aviso de manual, y la cabecera no inventa modo", async () => {
    H.status = statusBase({ modo: undefined });
    render(<GoogleReviewsPage />);
    expect(await screen.findByText("Activo")).toBeInTheDocument();
    irA("Configuracion");
    expect(screen.queryByTestId("grev-modo-manual")).toBeNull();
  });
});
