/**
 * instagramPanel.red.test.jsx
 *
 * ⚖️ Constitución ALEF · Art. 4 · Art. 10 (el fix de backend no está probado hasta ver al
 * frontend llamándolo).
 *
 * LA CICATRIZ: el backend de Instagram (lote FEATURES-VENTA-30SEP, `wt-instagram`) ya guarda
 * `horaPublicacion` y `aprobacionManual`, desconecta con `motivoDesconexion: "token_invalid"` y
 * permite reintentar un post en `error` (approve desde error). El panel no enseñaba NADA de eso:
 * el dueño no veía por qué se había desconectado, no podía reintentar, no podía elegir la hora,
 * y los errores salían por `alert()` (o no salían: approve/discard sin catch).
 *
 * Contrato leído de `saas-api/src/routes/adminTenant/instagramRoutes.js` +
 * `services/instagram/instagramConfig.constants.js` + `configInstagramParaPanel` (wt-instagram).
 * Respuestas con `sendOk` ⇒ `{ ok, data }`.
 */
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const H = vi.hoisted(() => ({ status: null, config: null, posts: [], media: [], fallos: {} }));

vi.mock("../utils/api", () => {
  const responder = (metodo) => vi.fn(async (url) => {
    const clave = `${metodo} ${url}`;
    if (H.fallos[clave]) throw H.fallos[clave];
    if (url === "/admin/instagram/status") return { data: { ok: true, data: H.status } };
    if (url === "/admin/instagram/config") return { data: { ok: true, data: H.config } };
    if (url.startsWith("/admin/instagram/posts?")) return { data: { ok: true, data: { items: H.posts, total: H.posts.length } } };
    if (url === "/admin/instagram/media") return { data: { ok: true, data: { items: H.media, total: H.media.length } } };
    if (url === "/admin/instagram/auth-url") return { data: { ok: true, data: { url: "about:blank" } } };
    return { data: { ok: true, data: {} } };
  });
  return { default: { get: responder("GET"), post: responder("POST"), put: responder("PUT"), delete: responder("DELETE") } };
});

import api from "../utils/api";
import InstagramPage from "../pages/InstagramPage.jsx";

const configBase = (extra = {}) => ({
  connected: true, username: "zabor", tokenExpiresAt: null, motivoDesconexion: "", desconectadoAt: null,
  frecuencia: { postsSemanales: 3 }, tono: "casual", horaPublicacion: "13:00", idioma: "es",
  hashtagsFijos: [], aprobacionManual: true, ...extra,
});

const irAConfig = async () => {
  fireEvent.click(await screen.findByRole("button", { name: "Configuración" }));
};

let spyConfirm;
let spyAlert;
beforeEach(() => {
  vi.clearAllMocks();
  H.status = { connected: true, username: "zabor", tokenExpiresAt: null };
  H.config = configBase();
  H.posts = [];
  H.media = [];
  H.fallos = {};
  spyConfirm = vi.spyOn(window, "confirm").mockImplementation(() => true);
  spyAlert = vi.spyOn(window, "alert").mockImplementation(() => {});
});
afterEach(() => {
  // ⭐ Ningún camino de esta pantalla puede usar los diálogos nativos del navegador.
  expect(spyConfirm).not.toHaveBeenCalled();
  expect(spyAlert).not.toHaveBeenCalled();
  spyConfirm.mockRestore();
  spyAlert.mockRestore();
});

describe("Instagram · (a) configuración real y lo guardado se ve al recargar", () => {
  it("pinta los valores GUARDADOS: tono, frecuencia, idioma, hora, hashtags, publicar solo", async () => {
    H.config = configBase({
      tono: "formal", idioma: "en", frecuencia: { postsSemanales: 5 }, horaPublicacion: "20:30",
      hashtagsFijos: ["ZaborFeten", "Torremolinos"], aprobacionManual: false,
    });
    render(<InstagramPage />);
    await irAConfig();
    expect(screen.getByLabelText("Tono del contenido")).toHaveValue("formal");
    expect(screen.getByLabelText("Posts por semana")).toHaveValue("5");
    expect(screen.getByLabelText("Idioma")).toHaveValue("en");
    expect(screen.getByLabelText("Hora de publicación")).toHaveValue("20:30");
    expect(screen.getByLabelText("Hashtags fijos")).toHaveValue("ZaborFeten, Torremolinos");
    expect(screen.getByRole("switch", { name: "Publicar automáticamente sin revisar" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("ig-aviso-autopublicar")).toHaveTextContent("nadie revisa");
  });

  it("cambiar la hora y salir del campo guarda SÓLO horaPublicacion", async () => {
    render(<InstagramPage />);
    await irAConfig();
    const hora = screen.getByLabelText("Hora de publicación");
    fireEvent.change(hora, { target: { value: "21:15" } });
    fireEvent.blur(hora);
    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/admin/instagram/config", { horaPublicacion: "21:15" }));
  });

  it("activar «publicar sin revisar» pide confirmación con el modal del panel; cancelar NO guarda", async () => {
    render(<InstagramPage />);
    await irAConfig();
    fireEvent.click(screen.getByRole("switch", { name: "Publicar automáticamente sin revisar" }));
    expect(await screen.findByText(/se publicarán solos en tu Instagram a las 13:00/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(api.put).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("switch", { name: "Publicar automáticamente sin revisar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sí, publicar solo" }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/admin/instagram/config", { aprobacionManual: false }));
  });

  it("hashtags: se guardan limpios (sin #) al salir del campo", async () => {
    render(<InstagramPage />);
    await irAConfig();
    const campo = screen.getByLabelText("Hashtags fijos");
    fireEvent.change(campo, { target: { value: "#Zabor, Malaga ,, " } });
    fireEvent.blur(campo);
    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/admin/instagram/config", { hashtagsFijos: ["Zabor", "Malaga"] }));
  });

  it("si el PUT falla, el mensaje de la API se enseña (no se traga)", async () => {
    H.fallos["PUT /admin/instagram/config"] = { response: { data: { message: "Formato HH:MM (00:00-23:59)" } } };
    render(<InstagramPage />);
    await irAConfig();
    fireEvent.change(screen.getByLabelText("Tono del contenido"), { target: { value: "divertido" } });
    expect(await screen.findByText("Formato HH:MM (00:00-23:59)")).toBeInTheDocument();
  });
});

describe("Instagram · (b) por qué está desconectado + reconectar", () => {
  it("token_invalid ⇒ explica que caducó y ofrece «Reconectar Instagram»", async () => {
    H.status = { connected: false, username: "zabor", tokenExpiresAt: null };
    H.config = configBase({ connected: false, motivoDesconexion: "token_invalid" });
    render(<InstagramPage />);
    const caja = await screen.findByTestId("ig-desconexion");
    expect(caja).toHaveTextContent("@zabor");
    expect(caja).toHaveTextContent("caducado o retirado el permiso");
    fireEvent.click(screen.getByRole("button", { name: "Reconectar Instagram" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/instagram/auth-url"));
  });

  it("CONTROL · desconectado sin motivo ⇒ la invitación de siempre, sin caja de error", async () => {
    H.status = { connected: false };
    H.config = configBase({ connected: false });
    render(<InstagramPage />);
    expect(await screen.findByText("Conecta tu Instagram Business")).toBeInTheDocument();
    expect(screen.queryByTestId("ig-desconexion")).toBeNull();
  });
});

describe("Instagram · (c) post en error: motivo + Reintentar", () => {
  it("enseña el motivo y «Reintentar» aprueba otra vez (error → aprobado)", async () => {
    H.posts = [{ _id: "p1", estado: "error", caption: "Hola", error: "Meta rechazó la imagen: no es JPEG", motivo: "novedad" }];
    render(<InstagramPage />);
    expect(await screen.findByText("Motivo del error: Meta rechazó la imagen: no es JPEG")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/admin/instagram/posts/p1/approve"));
    expect(await screen.findByText(/Reintento en cola/)).toBeInTheDocument();
  });

  it("si reintentar da 409, se enseña el mensaje del backend", async () => {
    H.posts = [{ _id: "p1", estado: "error", caption: "Hola", error: "x", motivo: "novedad" }];
    H.fallos["POST /admin/instagram/posts/p1/approve"] = { response: { data: { message: "Este post está «publicando» y ya no se puede aprobar." } } };
    render(<InstagramPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Este post está «publicando» y ya no se puede aprobar.")).toBeInTheDocument();
  });
});

describe("Instagram · verificación pendiente (R2 del backend: «no sé si salió»)", () => {
  it("post en error con `verificacionPendiente` ⇒ texto humano y SIN Reintentar/Publicar", async () => {
    H.posts = [{ _id: "p7", estado: "error", caption: "Hola", error: "estado_desconocido: timeout", motivo: "novedad", verificacionPendiente: true }];
    render(<InstagramPage />);
    expect(await screen.findByTestId("ig-verificando")).toHaveTextContent(
      "Comprobando con Instagram si se llegó a publicar; no lo repetimos para no duplicarlo"
    );
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Publicar" })).toBeNull();
    expect(screen.queryByText(/estado_desconocido/)).toBeNull();
  });

  it("aprobado con verificación pendiente tampoco ofrece Publicar", async () => {
    H.posts = [{ _id: "p8", estado: "aprobado", caption: "Hola", motivo: "novedad", verificacionPendiente: true }];
    render(<InstagramPage />);
    await screen.findByTestId("ig-verificando");
    expect(screen.queryByRole("button", { name: "Publicar" })).toBeNull();
  });
});

describe("Instagram · contenedor inexistente (R3 del backend)", () => {
  const post = { _id: "p9", estado: "error", caption: "Hola", motivo: "novedad", error: "contenedor_inexistente: Instagram ya no reconoce el intento anterior" };

  it("«Publicar de nuevo» pide confirmación con el texto del riesgo y manda `confirmarRepublicar: true`", async () => {
    H.posts = [post];
    render(<InstagramPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Publicar de nuevo" }));
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
    expect(await screen.findByText(
      "Instagram ya no reconoce el intento anterior. Si llegó a publicarse en otra cuenta, podría salir dos veces. ¿Publicar de nuevo?"
    )).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
    const botones = screen.getAllByRole("button", { name: "Publicar de nuevo" });
    fireEvent.click(botones[botones.length - 1]); // el del modal
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/admin/instagram/posts/p9/publish", { confirmarRepublicar: true }));
  });

  it("cancelar el modal NO publica", async () => {
    H.posts = [post];
    render(<InstagramPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Publicar de nuevo" }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(api.post).not.toHaveBeenCalled();
  });

  it("CONTROL · un error normal sigue ofreciendo «Reintentar», no «Publicar de nuevo»", async () => {
    H.posts = [{ ...post, error: "Meta rechazó la imagen" }];
    render(<InstagramPage />);
    await screen.findByRole("button", { name: "Reintentar" });
    expect(screen.queryByRole("button", { name: "Publicar de nuevo" })).toBeNull();
  });
});

describe("Instagram · intento incierto (R2-ART16 del backend)", () => {
  const TXT = "No sabemos si Instagram llegó a publicarlo. Lo revisamos nosotros para no duplicarlo; escríbenos si lo necesitas ya.";

  it("post con `intentoIncierto` ⇒ el texto y NINGÚN botón de republicar/reintentar", async () => {
    H.posts = [{ _id: "p10", estado: "error", caption: "Hola", motivo: "novedad", intentoIncierto: true,
      error: "contenedor_inexistente: texto sin la marca" }]; // sólo el booleano decide (mutante I1)
    render(<InstagramPage />);
    expect(await screen.findByTestId("ig-incierto")).toHaveTextContent(TXT);
    expect(screen.queryByRole("button", { name: "Publicar de nuevo" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });

  it("sin el booleano, el motivo `(intento_incierto)` en el error basta", async () => {
    H.posts = [{ _id: "p11", estado: "error", caption: "Hola", motivo: "novedad",
      error: "contenedor_inexistente (intento_incierto): x" }];
    render(<InstagramPage />);
    expect(await screen.findByTestId("ig-incierto")).toHaveTextContent(TXT);
    expect(screen.queryByRole("button", { name: "Publicar de nuevo" })).toBeNull();
  });

  it("si al republicar la API responde 409 `intento_incierto`, se enseña ese mismo mensaje", async () => {
    H.posts = [{ _id: "p12", estado: "error", caption: "Hola", motivo: "novedad", error: "contenedor_inexistente: x" }];
    H.fallos["POST /admin/instagram/posts/p12/publish"] = {
      response: { status: 409, data: { ok: false, code: "INSTAGRAM_CONTENEDOR_INEXISTENTE", message: "mensaje técnico del backend", fields: { motivo: "intento_incierto" } } },
    };
    render(<InstagramPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Publicar de nuevo" }));
    const botones = await screen.findAllByRole("button", { name: "Publicar de nuevo" });
    fireEvent.click(botones[botones.length - 1]);
    expect(await screen.findByText(TXT)).toBeInTheDocument();
    expect(screen.queryByText("mensaje técnico del backend")).toBeNull();
  });
});

describe("Instagram · (d) sin confirm/alert: modal del panel", () => {
  it("desconectar abre ModalConfirmacion y sólo desconecta al aceptar", async () => {
    render(<InstagramPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Desconectar" }));
    expect(await screen.findByText(/dejará de generar y publicar posts/)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalledWith("/admin/instagram/disconnect");
    const botones = screen.getAllByRole("button", { name: "Desconectar" });
    fireEvent.click(botones[botones.length - 1]); // el del modal
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/admin/instagram/disconnect"));
  });

  it("un fallo al generar se enseña en la pantalla, no con alert()", async () => {
    H.fallos["POST /admin/instagram/posts/generate"] = { response: { data: { message: "No se pudo generar contenido" } } };
    render(<InstagramPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Post" }));
    expect(await screen.findByText("No se pudo generar: No se pudo generar contenido")).toBeInTheDocument();
  });
});

describe("Instagram · vuelta del OAuth (contrato 30-sep)", () => {
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("`instagram=connected` avisa y quita SÓLO su parámetro", async () => {
    window.history.replaceState(null, "", "/pro?tab=otros&modulo=instagram&instagram=connected");
    render(<InstagramPage />);
    expect(await screen.findByTestId("ig-vuelta")).toHaveTextContent("Instagram conectado");
    await waitFor(() => expect(window.location.search).toBe("?tab=otros&modulo=instagram"));
  });

  it("`instagram=error&motivo=…` avisa del fallo con el motivo", async () => {
    window.history.replaceState(null, "", "/pro?instagram=error&motivo=state_caducado");
    render(<InstagramPage />);
    expect(await screen.findByTestId("ig-vuelta")).toHaveTextContent("No se pudo conectar Instagram (motivo: state_caducado)");
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("CONTROL · sin parámetro no hay aviso", async () => {
    window.history.replaceState(null, "", "/pro");
    render(<InstagramPage />);
    await screen.findByRole("button", { name: "Configuración" });
    expect(screen.queryByTestId("ig-vuelta")).toBeNull();
  });
});

describe("(e) sin estilos inline en las pantallas tocadas", () => {
  const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  it.each([
    "pages/InstagramPage.jsx",
    "pages/GoogleReviewsPage.jsx",
    "pages/features/AutopilotIA.jsx",
  ])("%s no tiene style={{…}} ni window.confirm/alert", (rel) => {
    const src = fs.readFileSync(path.join(RAIZ, rel), "utf8");
    expect(src).not.toMatch(/style=\{\{/);
    expect(src).not.toMatch(/(^|[^.\w])(confirm|alert)\(/m);
  });
});
