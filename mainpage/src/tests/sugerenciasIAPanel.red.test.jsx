/**
 * sugerenciasIAPanel.red.test.jsx
 *
 * ⚖️ Constitución ALEF · Art. 4 · Art. 10 (el fix de backend no está probado hasta ver al panel
 * llamándolo). Lotes A (Sugerencias) y D (Aprendizaje IA) de FEATURES-VENTA-30SEP.
 *
 * Contrato leído de `wt-sugerencias`: `sugerenciasConfigRoutes.js`, `adminPanel.schemas.js`
 * (`sugerenciasConfigSchema`, `sugerenciaReglaSchema` con coherencia por tipo),
 * `SugerenciaConfig.schema.js` (pesos cargaCocina 30 · stock 25 · clima 35; `clima.*`) y
 * `chatLearning.service.js` (`tasaAceptacion` null con < 5 muestras; timeline de 14 días).
 */
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

vi.mock("../context/ConfigContext", () => ({
  useConfig: () => ({ config: null, loading: false, setConfig: () => {}, hasFeature: () => true, planFeatures: [], tipoNegocio: "restaurante" }),
  ConfigContext: React.createContext(null),
}));

const H = vi.hoisted(() => ({ config: null, stats: null, learning: null, productos: [], categorias: [], fallos: {} }));

vi.mock("../utils/api", () => {
  const responder = (metodo) => vi.fn(async (url) => {
    const clave = `${metodo} ${url}`;
    if (H.fallos[clave]) {
      const f = H.fallos[clave];
      if (Array.isArray(f)) { const e = f.shift(); if (e) throw e; } else throw f;
    }
    if (url === "/admin/sugerencias/config") return { data: { ok: true, config: H.config } };
    if (url === "/admin/sugerencias/stats") return { data: H.stats || { ok: true, perfil: null, reglasCount: 0 } };
    if (url === "/admin/sugerencias/auto-detect-fases") return { data: { ok: true, fases: [], categoriasDisponibles: [] } };
    if (url.startsWith("/productos")) return { data: { productos: H.productos } };
    if (url === "/categorias") return { data: { categorias: H.categorias } };
    if (url === "/admin/sugerencias/learning-stats") return { data: H.learning };
    return { data: { ok: true } };
  });
  return { default: { get: responder("GET"), post: responder("POST"), put: responder("PUT"), patch: responder("PATCH"), delete: responder("DELETE") } };
});

import api from "../utils/api";
import SugerenciasConfigPage from "../pages/SugerenciasConfigPage.jsx";
import AprendizajeIAPage from "../pages/AprendizajeIAPage.jsx";
import { mensajeConCampos } from "../utils/normalizeApiError";

// Config EFECTIVA tal y como la devuelve la API (defaults del esquema + lo guardado).
const configEfectiva = (extra = {}) => ({
  enabled: true,
  touchpoints: { carrito: true, postPedido: true, detalleProducto: true },
  maxSugerencias: { carrito: 3, postPedido: 2, detalleProducto: 2 },
  filtrarAlergenos: true,
  incluirTrazas: true,
  fasesMenu: [],
  pesos: { flujoComida: 80, coocurrencia: 70, margen: 50, popularidad: 40, cargaCocina: 30, stock: 25, categoriaEsperada: 20, promocion: 15, clima: 35 },
  umbrales: { minCoocPct: 30, minCoocMuestras: 5, minCatPct: 35, minFreqPct: 40 },
  clima: { enabled: true, calorUmbral: 28, frioUmbral: 12, categoriasCalor: [], categoriasFrio: [] },
  reglas: [],
  ...extra,
});

const irA = async (nombre) => {
  const btn = await screen.findByRole("button", { name: nombre });
  fireEvent.click(btn);
};

beforeEach(() => {
  vi.clearAllMocks();
  H.config = configEfectiva();
  H.stats = null;
  H.learning = null;
  H.productos = [
    { _id: "a".repeat(24), nombre: "Pan de la casa" },
    { _id: "b".repeat(24), nombre: "Mojito" },
  ];
  H.categorias = [{ nombre: "Bebidas" }, { nombre: "Sopas" }];
  H.fallos = {};
});

describe("mensajeConCampos · las dos formas de `fields` del backend", () => {
  it("objeto { ruta: mensaje } (zBody)", () => {
    const err = { response: { data: { message: "Datos de entrada inválidos.", fields: { productoSugerido: "Elige el producto de la regla" } } } };
    expect(mensajeConCampos(err, "x")).toBe("Datos de entrada inválidos.: Elige el producto de la regla");
  });
  it("array [{ path, message }] (REGLA_INCOHERENTE) y sin repetir el propio message", () => {
    const err = { response: { data: { message: "Elige el producto de la regla", fields: [
      { path: "productoSugerido", message: "Elige el producto de la regla" },
      { path: "hasta", message: "La franja necesita hora de inicio y de fin" },
    ] } } };
    expect(mensajeConCampos(err, "x")).toBe("Elige el producto de la regla: La franja necesita hora de inicio y de fin");
  });
  it("sin respuesta ⇒ fallback / message del error", () => {
    expect(mensajeConCampos({}, "Error al guardar")).toBe("Error al guardar");
  });
});

describe("Sugerencias · A1 regla «nunca» con producto y errores de la API a la vista", () => {
  it("«Nunca sugerir» ofrece el selector de producto y lo MANDA", async () => {
    render(<SugerenciasConfigPage />);
    await irA("Reglas fijas");
    fireEvent.click(screen.getByRole("button", { name: "+ Nueva regla" }));
    fireEvent.change(screen.getByDisplayValue("Maridaje"), { target: { value: "nunca" } });
    expect(screen.getByText("Producto que NUNCA se sugiere")).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Pan de la casa" }));
    fireEvent.click(screen.getByRole("button", { name: "Crear regla" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    const [url, body] = api.post.mock.calls[0];
    expect(url).toBe("/admin/sugerencias/reglas");
    expect(body).toMatchObject({ tipo: "nunca", productoSugerido: "a".repeat(24), nombreSugerido: "Pan de la casa" });
  });

  it("un 400 de la API se enseña con su `message` y el detalle de `fields` (no «Error al guardar»)", async () => {
    H.fallos["POST /admin/sugerencias/reglas"] = {
      response: { data: { message: "Datos de entrada inválidos.", fields: { productoSugerido: "Elige el producto de la regla" } } },
    };
    render(<SugerenciasConfigPage />);
    await irA("Reglas fijas");
    fireEvent.click(screen.getByRole("button", { name: "+ Nueva regla" }));
    fireEvent.change(screen.getByDisplayValue("Maridaje"), { target: { value: "nunca" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear regla" }));
    expect(await screen.findByText("Datos de entrada inválidos.: Elige el producto de la regla")).toBeInTheDocument();
  });

  it("pausar una regla que falla enseña el mensaje (antes `catch {}` mudo)", async () => {
    H.config = configEfectiva({ reglas: [{ _id: "c".repeat(24), tipo: "siempre", activa: true, prioridad: 90, nombreSugerido: "Mojito" }] });
    H.fallos[`PATCH /admin/sugerencias/reglas/${"c".repeat(24)}/toggle`] = { response: { data: { message: "Regla no encontrada." } } };
    render(<SugerenciasConfigPage />);
    await irA("Reglas fijas");
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    expect(await screen.findByText("Regla no encontrada.")).toBeInTheDocument();
  });

  it("si no cargan productos/categorías, se dice (antes `catch {}` mudo)", async () => {
    H.fallos["GET /categorias"] = { response: { data: { message: "Sin permiso para ver categorías" } } };
    render(<SugerenciasConfigPage />);
    await irA("Reglas fijas");
    expect(await screen.findByText("Sin permiso para ver categorías")).toBeInTheDocument();
  });
});

describe("Sugerencias · A2 pesos vigentes", () => {
  it("sin «Valoraciones»; con Carga de cocina, Stock y Clima leídos de la config y ENVIADOS", async () => {
    H.config = configEfectiva({
      pesos: { ...configEfectiva().pesos, cargaCocina: 45, stock: 60, clima: 10, valoraciones: 30 },
    });
    render(<SugerenciasConfigPage />);
    await irA("Pesos y umbrales");
    expect(screen.queryByText("Valoraciones")).toBeNull();
    expect(screen.getByLabelText("Peso Carga de cocina")).toHaveValue("45");
    expect(screen.getByLabelText("Peso Stock")).toHaveValue("60");
    expect(screen.getByLabelText("Peso Clima")).toHaveValue("10");
    fireEvent.click(screen.getByRole("button", { name: "Guardar pesos y umbrales" }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/admin/sugerencias/config", expect.objectContaining({ pesos: expect.any(Object) })));
    const body = api.put.mock.calls.find((c) => c[1]?.pesos)[1];
    expect(body.pesos).toEqual({
      flujoComida: 80, coocurrencia: 70, margen: 50, popularidad: 40,
      cargaCocina: 45, stock: 60, categoriaEsperada: 20, promocion: 15, clima: 10,
    });
  });

  it("«Restaurar defaults» vuelve a los del esquema (30/25/35)", async () => {
    H.config = configEfectiva({ pesos: { ...configEfectiva().pesos, cargaCocina: 90, stock: 90, clima: 90 } });
    render(<SugerenciasConfigPage />);
    await irA("Pesos y umbrales");
    fireEvent.click(screen.getByRole("button", { name: "Restaurar defaults" }));
    expect(screen.getByLabelText("Peso Carga de cocina")).toHaveValue("30");
    expect(screen.getByLabelText("Peso Stock")).toHaveValue("25");
    expect(screen.getByLabelText("Peso Clima")).toHaveValue("35");
  });
});

describe("Sugerencias · A3 sección Clima", () => {
  it("explica el requisito, pinta lo guardado y manda `clima` completo", async () => {
    H.config = configEfectiva({ clima: { enabled: true, calorUmbral: 30, frioUmbral: 10, categoriasCalor: ["Bebidas"], categoriasFrio: [] } });
    render(<SugerenciasConfigPage />);
    await irA("Clima");
    expect(screen.getByTestId("sug-clima-requisito")).toHaveTextContent("ubicación configurada");
    expect(screen.getByLabelText("Calor a partir de")).toHaveValue(30);
    expect(screen.getByLabelText("Frío por debajo de")).toHaveValue(10);
    const frio = await screen.findByRole("group", { name: "Categorías que suben con frío" });
    fireEvent.click(within(frio).getByRole("button", { name: "Sopas" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar clima" }));
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("/admin/sugerencias/config", {
        clima: { enabled: true, calorUmbral: 30, frioUmbral: 10, categoriasCalor: ["Bebidas"], categoriasFrio: ["Sopas"] },
      })
    );
  });

  it("frío >= calor no se envía y se explica", async () => {
    render(<SugerenciasConfigPage />);
    await irA("Clima");
    fireEvent.change(screen.getByLabelText("Frío por debajo de"), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar clima" }));
    expect(await screen.findByText("El umbral de frío tiene que ser más bajo que el de calor")).toBeInTheDocument();
    expect(api.put).not.toHaveBeenCalled();
  });
});

describe("Sugerencias · A4 franja: días y medianoche", () => {
  it("22:00-02:00 avisa de que cruza medianoche y manda los días elegidos", async () => {
    render(<SugerenciasConfigPage />);
    await irA("Reglas fijas");
    fireEvent.click(screen.getByRole("button", { name: "+ Nueva regla" }));
    fireEvent.change(screen.getByDisplayValue("Maridaje"), { target: { value: "franja" } });
    fireEvent.click(await screen.findByRole("button", { name: "Mojito" }));
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "22:00" } });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "02:00" } });
    expect(screen.getByTestId("sug-franja-medianoche")).toHaveTextContent("cruza la medianoche");
    fireEvent.click(screen.getByRole("button", { name: "Viernes" }));
    fireEvent.click(screen.getByRole("button", { name: "Domingo" }));
    fireEvent.click(screen.getByRole("button", { name: "Crear regla" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(api.post.mock.calls[0][1]).toMatchObject({ tipo: "franja", desde: "22:00", hasta: "02:00", diasSemana: [0, 5] });
  });

  it("CONTROL · 13:00-16:00 no avisa de medianoche", async () => {
    render(<SugerenciasConfigPage />);
    await irA("Reglas fijas");
    fireEvent.click(screen.getByRole("button", { name: "+ Nueva regla" }));
    fireEvent.change(screen.getByDisplayValue("Maridaje"), { target: { value: "franja" } });
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "13:00" } });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "16:00" } });
    expect(screen.queryByTestId("sug-franja-medianoche")).toBeNull();
  });
});

describe("Sugerencias · A5 config efectiva y A7 alérgenos", () => {
  it("pinta lo que manda la API (encendido y detalle de producto marcado)", async () => {
    render(<SugerenciasConfigPage />);
    const sw = await screen.findByRole("switch", { name: "Sugerencias inteligentes" });
    await waitFor(() => expect(sw).toHaveAttribute("aria-checked", "true"));
    expect(screen.getByRole("checkbox", { name: /Detalle de producto/ })).toBeChecked();
  });

  const TXT_ALERGENOS = "Filtra los productos con los alérgenos que la mesa ha declarado o confirmado; revisa siempre la ficha de alérgenos del plato.";

  it("filtro ACTIVO ⇒ texto sin absolutos (R2-ART16); filtro APAGADO ⇒ lo dice", async () => {
    render(<SugerenciasConfigPage />);
    const desc = await screen.findByTestId("sug-alergenos-desc");
    expect(desc).toHaveTextContent(TXT_ALERGENOS);
    expect(desc).not.toHaveTextContent(/nunca/i);
    fireEvent.click(screen.getByRole("checkbox", { name: /Filtrar alérgenos/ }));
    expect(screen.getByTestId("sug-alergenos-desc")).toHaveTextContent("NO miran los alérgenos");
  });

  it("la ayuda: condicionada al filtro, sin «nunca», y habla de toda la mesa", async () => {
    render(<SugerenciasConfigPage />);
    fireEvent.click(await screen.findByTitle("Ayuda: General"));
    const body = document.querySelector(".sug-help-modal__body");
    expect(body).toHaveTextContent("Con el filtro activado");
    expect(body).toHaveTextContent(TXT_ALERGENOS);
    expect(body).toHaveTextContent("toda la mesa");
    expect(body).not.toHaveTextContent(/nunca sugerir/i);
  });
});

describe("Sugerencias · camarero IA en la carta (asistenteIA.apagadoPorDueno)", () => {
  it("sin `apagadoPorDueno` ⇒ ENCENDIDO por defecto, y guardar sin tocarlo NO lo manda", async () => {
    H.config = configEfectiva({ asistenteIA: { enabled: false, saludo: "", maxMensajesSesion: 30 } });
    render(<SugerenciasConfigPage />);
    const sw = await screen.findByRole("switch", { name: "Mostrar el camarero IA en la carta" });
    await waitFor(() => expect(sw).toHaveAttribute("aria-checked", "true"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(api.put).toHaveBeenCalled());
    expect(api.put.mock.calls[0][1]).not.toHaveProperty("asistenteIA");
  });

  it("apagarlo manda `asistenteIA: { apagadoPorDueno: true }`", async () => {
    render(<SugerenciasConfigPage />);
    const sw = await screen.findByRole("switch", { name: "Mostrar el camarero IA en la carta" });
    await waitFor(() => expect(sw).toHaveAttribute("aria-checked", "true"));
    fireEvent.click(sw);
    expect(screen.getByTestId("sug-asistente-desc")).toHaveTextContent("Oculto");
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(api.put).toHaveBeenCalled());
    expect(api.put.mock.calls[0][1].asistenteIA).toEqual({ apagadoPorDueno: true });
  });

  it("guardado apagado ⇒ se pinta apagado y encenderlo manda `apagadoPorDueno: false`", async () => {
    H.config = configEfectiva({ asistenteIA: { apagadoPorDueno: true } });
    render(<SugerenciasConfigPage />);
    const sw = await screen.findByRole("switch", { name: "Mostrar el camarero IA en la carta" });
    await waitFor(() => expect(sw).toHaveAttribute("aria-checked", "false"));
    fireEvent.click(sw);
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(api.put).toHaveBeenCalled());
    expect(api.put.mock.calls[0][1].asistenteIA).toEqual({ apagadoPorDueno: false });
  });
});

describe("Aprendizaje IA · lote D", () => {
  const learningBase = (extra = {}) => ({
    ok: true,
    totales: { sesiones: 12, mensajes: 40, mensajesPorSesion: 3.3, propuestasGeneradas: 4, propuestasAceptadas: 2, propuestasRechazadas: 1, propuestasModificadas: 1, itemsAnadidos: 5, tasaAceptacion: 50 },
    topProductos: [
      { nombre: "Bravas", categoria: "Tapas", score: 81, tasaAceptacion: 64, vecesRecomendado: 11, tendencia: "subiendo" },
      { nombre: "Croquetas", categoria: "Tapas", score: 57, tasaAceptacion: null, vecesRecomendado: 3, tendencia: "estable" },
    ],
    bottomProductos: [],
    distribucion: { excelente: 1, bueno: 1, regular: 0, bajo: 0, sinDatos: 3 },
    tendencias: { subiendo: 1, estable: 1, bajando: 0 },
    timeline: Array.from({ length: 14 }, (_, i) => ({ fecha: `2026-09-${String(16 + i).padStart(2, "0")}T00:00:00.000Z`, sesiones: i === 13 ? 4 : 0 })),
    ...extra,
  });

  it("`tasaAceptacion: null` ⇒ «Sin datos (menos de 5 veces)», nunca «null%» ni 0 %", async () => {
    H.learning = learningBase();
    render(<AprendizajeIAPage />);
    const fila = (await screen.findByText("Croquetas")).closest(".ia-learn__table-row");
    expect(fila).toHaveTextContent("Sin datos (menos de 5 veces)");
    expect(fila).not.toHaveTextContent("%");
    expect(document.body).not.toHaveTextContent("null%");
    expect((await screen.findByText("Bravas")).closest(".ia-learn__table-row")).toHaveTextContent("64%");
  });

  it("timeline: pinta los 14 días, también los de cero", async () => {
    H.learning = learningBase();
    render(<AprendizajeIAPage />);
    const chart = await screen.findByTestId("ia-learn-timeline");
    expect(chart.querySelectorAll(".ia-learn__bar-col")).toHaveLength(14);
    expect(chart.querySelectorAll(".ia-learn__bar--cero")).toHaveLength(13);
  });

  it("estado vacío de verdad: sin sesiones ni productos no hay tablas", async () => {
    H.learning = learningBase({ totales: { ...learningBase().totales, sesiones: 0 }, topProductos: [], timeline: [] });
    render(<AprendizajeIAPage />);
    expect(await screen.findByTestId("ia-learn-vacio")).toBeInTheDocument();
    expect(screen.queryByText("Producto")).toBeNull();
    expect(screen.queryByText("Distribución de scores")).toBeNull();
  });

  it("error ⇒ mensaje + «Reintentar» que vuelve a pedir y pinta los datos", async () => {
    H.learning = learningBase();
    H.fallos["GET /admin/sugerencias/learning-stats"] = [{ response: { data: { message: "Servicio no disponible" } } }];
    render(<AprendizajeIAPage />);
    expect(await screen.findByText("Servicio no disponible")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Bravas")).toBeInTheDocument();
    expect(api.get.mock.calls.filter((c) => c[0] === "/admin/sugerencias/learning-stats")).toHaveLength(2);
  });

  it("explica qué es el score y, sin propuestas, no inventa un 0 % de aceptación", async () => {
    H.learning = learningBase({ totales: { ...learningBase().totales, propuestasGeneradas: 0, tasaAceptacion: 0 } });
    render(<AprendizajeIAPage />);
    expect(await screen.findByTestId("ia-learn-explica-score")).toHaveTextContent("El score (0-100)");
    const kpi = screen.getAllByText("Aceptación").find((n) => n.classList.contains("ia-learn__kpi-label")).closest(".ia-learn__kpi");
    expect(kpi).toHaveTextContent("Sin propuestas");
    expect(screen.getByText("Excelente (75-100)")).toBeInTheDocument();
  });
});

describe("sin estilos inline ni catch mudos en las pantallas del lote", () => {
  const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  it.each([
    "pages/SugerenciasConfigPage.jsx",
    "pages/AprendizajeIAPage.jsx",
    "hooks/useSugerenciasConfig.js",
  ])("%s", (rel) => {
    const src = fs.readFileSync(path.join(RAIZ, rel), "utf8");
    expect(src).not.toMatch(/style=\{\{/);
    expect(src).not.toMatch(/catch\s*\{/);
    expect(src).not.toMatch(/(^|[^.\w])(confirm|alert)\(/m);
  });
});
