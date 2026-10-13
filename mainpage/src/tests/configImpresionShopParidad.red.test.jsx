/**
 * configImpresionShopParidad.red.test.jsx
 *
 * Constitución ALEF · Art. 4 (la red se pone ANTES) · Art. 10 (un fix no está probado
 * hasta ver la pantalla llamando a la API real).
 *
 * Lote PANEL-IMPRESION-TIENDA. ConfigImpresionShopPage (tienda) quedó atrás frente a
 * ConfigImpresionPage (restaurante). Dos grupos:
 *
 *  G · CONTRATO DE API que la tienda ya usa HOY. Verdes hoy; tienen que seguir verdes:
 *      GET /impresoras/listar · POST /impresoras/configurar { impresoras: { caja, tickets } }
 *      POST /impresoras/test { impresora } · la tienda nunca toca /admin/config/*.
 *
 *  R · PARIDAD Y BUGS. Rojos hoy, cada uno por la razón que dice su título.
 */
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const H = vi.hoisted(() => ({ ctx: null }));

vi.mock("../context/ConfigContext.jsx", () => ({
  useConfig: () => H.ctx,
  ConfigContext: React.createContext(null),
}));

vi.mock("../utils/api", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

import api from "../utils/api";
import ConfigImpresionShopPage from "../pages/ConfigImpresionShopPage.jsx";

const IMPRESORAS = ["EPSON-TM-T20", "POS-80"];

function configCon({ caja = "", tickets = "" } = {}) {
  return { impresion: { impresoras: { caja, tickets } } };
}

// Forma exacta que deja api.js (interceptor) en error._server: normalizeApiError la lee de ahí.
function errorDelAgente(message = "El agente de impresión no responde (offline).") {
  const err = new Error(message);
  err._server = {
    status: 502,
    code: "PRINT_AGENT_OFFLINE",
    message,
    requestId: "req-print-1",
    action: "RETRY",
    retryAfter: 5,
    fields: { estado: "offline" },
  };
  return err;
}

function aplazada() {
  let resolve;
  const promesa = new Promise((r) => {
    resolve = r;
  });
  return { promesa, resolve };
}

const arbol = () => (
  <MemoryRouter initialEntries={["/configuracion/impresion-shop"]}>
    <Routes>
      <Route path="/configuracion/impresion-shop" element={<ConfigImpresionShopPage />} />
      <Route path="/configuracion/impresion/centro" element={<p>DESTINO centro de impresión</p>} />
    </Routes>
  </MemoryRouter>
);

const renderPagina = () => render(arbol());

// Los dos selectores, en orden de DOM: Caja primero, Tickets después (sin depender de la etiqueta).
const selectCaja = () => screen.getAllByRole("combobox")[0];

// Espera a que no haya carga en curso (el botón Listar se desactiva mientras carga).
const esperarQueNoCargue = () =>
  waitFor(() => expect(screen.getByRole("button", { name: "Listar impresoras" })).toBeEnabled());

// Lista las impresoras y espera a que aparezcan como opciones (en AMBOS selectores: hay dos).
async function listarYEsperar() {
  await esperarQueNoCargue();
  fireEvent.click(screen.getByRole("button", { name: "Listar impresoras" }));
  await waitFor(() => expect(screen.getAllByRole("option", { name: "POS-80" }).length).toBeGreaterThan(0));
}

beforeEach(() => {
  vi.clearAllMocks();
  H.ctx = { config: configCon(), refreshConfig: vi.fn(async () => H.ctx.config) };
  api.get.mockImplementation(async (url) => {
    if (url === "/impresoras/listar") return { data: { impresoras: IMPRESORAS, estado: "online" } };
    throw new Error(`GET no mockeado: ${url}`);
  });
  api.post.mockImplementation(async (url) => {
    if (url === "/impresoras/configurar") {
      return { data: { message: "Impresoras guardadas correctamente", impresoras: {} } };
    }
    if (url === "/impresoras/test") return { data: { message: "Prueba enviada correctamente", estado: "online" } };
    throw new Error(`POST no mockeado: ${url}`);
  });
});

/* ================================================================
   G · contrato de API que la tienda ya usa (verde hoy)
   ================================================================ */
describe("G · contrato de API que la tienda ya usa (verde hoy; no debe romperse)", () => {
  it("G1 · Listar impresoras llama a GET /impresoras/listar y pinta las detectadas", async () => {
    renderPagina();
    await esperarQueNoCargue();
    fireEvent.click(screen.getByRole("button", { name: "Listar impresoras" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/impresoras/listar"));
    await waitFor(() => expect(screen.getAllByRole("option", { name: "POS-80" }).length).toBeGreaterThan(0));
  });

  it("G2 · Guardar envía exactamente { impresoras: { caja, tickets } } a POST /impresoras/configurar", async () => {
    renderPagina();
    await listarYEsperar();
    fireEvent.change(selectCaja(), { target: { value: "POS-80" } });
    fireEvent.click(screen.getByRole("button", { name: /^guardar/i }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/impresoras/configurar", {
        impresoras: { caja: "POS-80", tickets: "" },
      })
    );
  });

  it("G3 · Probar Caja sin asignar envía { impresora: \"\" } (la predeterminada del sistema)", async () => {
    renderPagina();
    await esperarQueNoCargue();
    fireEvent.click(screen.getByRole("button", { name: "Probar Caja" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/impresoras/test", { impresora: "" }));
  });

  it("G4 · Probar Caja usa la impresora en pantalla aunque aún no esté guardada", async () => {
    renderPagina();
    await listarYEsperar();
    fireEvent.change(selectCaja(), { target: { value: "POS-80" } });
    fireEvent.click(screen.getByRole("button", { name: "Probar Caja" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/impresoras/test", { impresora: "POS-80" }));
  });

  it("G5 · el aviso de guardado usa la variante alerta-exito (la que tiene estilo en AlertaMensaje.css)", async () => {
    renderPagina();
    await listarYEsperar();
    fireEvent.change(selectCaja(), { target: { value: "POS-80" } });
    fireEvent.click(screen.getByRole("button", { name: /^guardar/i }));
    await waitFor(() => expect(document.querySelector(".alerta-exito")).not.toBeNull());
  });

  it("G6 · la tienda no ofrece 'Revertir último cambio' y no guarda por /admin/config/*", async () => {
    renderPagina();
    await listarYEsperar();
    expect(screen.queryByRole("button", { name: /revertir/i })).toBeNull();
    fireEvent.change(selectCaja(), { target: { value: "POS-80" } });
    fireEvent.click(screen.getByRole("button", { name: /^guardar/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/impresoras/configurar", expect.anything()));
    const urls = api.post.mock.calls.map(([url]) => url);
    expect(urls.some((u) => u.startsWith("/admin/config"))).toBe(false);
  });

  it("G7 · mientras lista impresoras, Guardar no dice 'Guardando...' (ese texto es solo para guardar)", async () => {
    let liberar;
    api.get.mockImplementation(
      () => new Promise((resolve) => {
        liberar = () => resolve({ data: { impresoras: IMPRESORAS, estado: "online" } });
      })
    );
    renderPagina();
    expect(await screen.findByRole("button", { name: /^guardar/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardando..." })).toBeNull();
    liberar?.();
  });
});

/* ================================================================
   R · paridad con ConfigImpresionPage y bugs de la tienda (rojo hoy)
   ================================================================ */
describe("R · paridad con la pantalla de restaurante (rojo hoy)", () => {
  it("R1 · al abrir lista las impresoras sin pulsar nada (hoy no: solo con el botón)", async () => {
    renderPagina();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/impresoras/listar"));
  });

  it("R2 · el estado del agente es una píldora 'Agente online' (hoy: texto crudo 'online')", async () => {
    renderPagina();
    await listarYEsperar();
    expect((await screen.findAllByText("Agente online")).length).toBeGreaterThan(0);
  });

  it("R3 · una impresora guardada que el agente no detecta sigue visible en Caja (hoy el select queda vacío)", async () => {
    H.ctx = { config: configCon({ caja: "IMPRESORA-APAGADA" }), refreshConfig: vi.fn() };
    renderPagina();
    await listarYEsperar();
    expect(selectCaja()).toHaveValue("IMPRESORA-APAGADA");
  });

  it("R4 · un error del agente muestra el mensaje del servidor (hoy se sustituye por un genérico)", async () => {
    api.get.mockImplementation(async () => {
      throw errorDelAgente();
    });
    renderPagina();
    await esperarQueNoCargue();
    fireEvent.click(screen.getByRole("button", { name: "Listar impresoras" }));
    expect(await screen.findByText("El agente de impresión no responde (offline).")).toBeInTheDocument();
  });

  it("R5 · tras un error de agente: píldora 'Agente offline' y botón Reintentar (hoy: nada de eso)", async () => {
    api.get.mockImplementation(async () => {
      throw errorDelAgente();
    });
    renderPagina();
    await esperarQueNoCargue();
    fireEvent.click(screen.getByRole("button", { name: "Listar impresoras" }));
    expect((await screen.findAllByText("Agente offline")).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });

  it("R6 · 'Guardar configuración' va desactivado sin cambios y lo explica (hoy siempre activo)", async () => {
    renderPagina();
    await esperarQueNoCargue();
    const guardar = screen.getByRole("button", { name: /^guardar/i });
    expect(guardar).toBeDisabled();
    expect(guardar).toHaveAttribute("title", "No hay cambios para guardar");
  });

  it("R7 · tras guardar refresca la configuración (refreshConfig) y el botón vuelve a desactivarse (hoy no)", async () => {
    let rerender;
    const refresh = vi.fn(async () => {
      H.ctx = { config: configCon({ caja: "POS-80" }), refreshConfig: refresh };
      rerender(arbol());
      return H.ctx.config;
    });
    H.ctx = { config: configCon(), refreshConfig: refresh };
    ({ rerender } = renderPagina());
    await listarYEsperar();
    fireEvent.change(selectCaja(), { target: { value: "POS-80" } });
    fireEvent.click(screen.getByRole("button", { name: /^guardar/i }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("button", { name: /^guardar/i })).toBeDisabled());
  });

  it("R8 · un refresco de configuración no pisa la selección en curso (hoy se re-siembra)", async () => {
    H.ctx = { config: configCon(), refreshConfig: vi.fn() };
    const { rerender } = renderPagina();
    await listarYEsperar();
    fireEvent.change(selectCaja(), { target: { value: "EPSON-TM-T20" } });
    // Otra pantalla refresca la config: objeto nuevo con el mismo contenido guardado (caja vacía).
    H.ctx = { config: configCon(), refreshConfig: H.ctx.refreshConfig };
    rerender(arbol());
    expect(selectCaja()).toHaveValue("EPSON-TM-T20");
  });

  it("R9 · 'Centro de impresión' lleva a /configuracion/impresion/centro (hoy no hay botón)", async () => {
    renderPagina();
    await esperarQueNoCargue();
    fireEvent.click(screen.getByRole("button", { name: "Centro de impresión" }));
    expect(await screen.findByText("DESTINO centro de impresión")).toBeInTheDocument();
  });

  it("R10 · tres secciones con los títulos de restaurante (hoy no hay encabezados de sección)", () => {
    renderPagina();
    for (const titulo of ["Agente y herramientas", "Asignación por estación", "Pruebas por estación"]) {
      expect(screen.getByRole("heading", { name: titulo })).toBeInTheDocument();
    }
  });

  it("R11 · 'Guardar configuración' vive en la barra de acciones fija (hoy va suelto en la tarjeta)", () => {
    const { container } = renderPagina();
    const barra = container.querySelector(".cfg-actions-bar");
    expect(barra).not.toBeNull();
    expect(within(barra).getByRole("button", { name: /^guardar/i })).toBeInTheDocument();
  });

  it("R12 · mientras guarda: el botón dice 'Guardando...' y los selectores se desactivan (hoy no)", async () => {
    const { promesa, resolve } = aplazada();
    api.post.mockImplementation(async (url) => (url === "/impresoras/configurar" ? promesa : { data: {} }));
    renderPagina();
    await listarYEsperar();
    fireEvent.change(selectCaja(), { target: { value: "POS-80" } });
    fireEvent.click(screen.getByRole("button", { name: /^guardar/i }));
    expect(await screen.findByRole("button", { name: "Guardando..." })).toBeDisabled();
    expect(selectCaja()).toBeDisabled();
    resolve({ data: { message: "ok" } });
  });

  it("R13 · cada selector tiene su etiqueta asociada: Impresora Caja / Impresora Tickets (hoy no)", () => {
    renderPagina();
    expect(screen.getByLabelText("Impresora Caja")).toBeInTheDocument();
    expect(screen.getByLabelText("Impresora Tickets")).toBeInTheDocument();
  });

  it("R14 · un fallo al probar muestra el mensaje del servidor y pone el estado (hoy: texto genérico)", async () => {
    api.post.mockImplementation(async (url) => {
      if (url === "/impresoras/test") throw errorDelAgente();
      return { data: {} };
    });
    renderPagina();
    await esperarQueNoCargue();
    fireEvent.click(screen.getByRole("button", { name: "Probar Caja" }));
    expect(await screen.findByText("El agente de impresión no responde (offline).")).toBeInTheDocument();
    expect((await screen.findAllByText("Agente offline")).length).toBeGreaterThan(0);
  });

  it("R15 · la sección Agente muestra impresoras detectadas y 'Estaciones configuradas' n / 2 (hoy no)", async () => {
    H.ctx = { config: configCon({ caja: "POS-80" }), refreshConfig: vi.fn() };
    renderPagina();
    await listarYEsperar();
    expect(screen.getByText("Impresoras detectadas")).toBeInTheDocument();
    expect(screen.getByText("Estaciones configuradas")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });
});
