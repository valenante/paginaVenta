/**
 * configImpresionRestaurantePresentacion.red.test.jsx
 *
 * Constitución ALEF · Art. 4: la red se pone ANTES del arreglo. Registro P-430 (13-oct),
 * pantalla de impresión de RESTAURANTE (ConfigImpresionPage.jsx). Tres puntos de presentación:
 *
 *  (1) La alerta de éxito usa tipo="success", y AlertaMensaje.css no define esa clase.
 *      La pantalla de tienda usa tipo="exito", que sí está definida.
 *  (2) La nota de asignación promete escribir el nombre de la impresora en un <select>,
 *      que no admite texto libre.
 *  (3) «Guardando...» aparece con cualquier operación en curso (listar, prueba...), no solo
 *      mientras se guarda.
 *
 * Bloque (G): regresión. Verde hoy y tiene que seguir verde: el botón dice «Guardando...»
 * mientras se guarda la configuración o el diseño, y vuelve a su texto al terminar.
 */
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
import ConfigImpresionPage from "../pages/ConfigImpresionPage.jsx";

const IMPRESORAS = ["EPSON-TM-T20", "POS-80"];

// Tipos que AlertaMensaje.css sí estiliza (cada `.alerta-xxx` con regla propia). Se leen del
// propio CSS del componente: no hay lista copiada en la prueba que pueda divergir (Art. 6).
const CSS_ALERTA = readFileSync(join(__dirname, "../components/AlertaMensaje/AlertaMensaje.css"), "utf8");
const TIPOS_ESTILIZADOS = [
  ...new Set([...CSS_ALERTA.matchAll(/\.(alerta-[a-z]+)[\s:{]/g)].map((m) => m[1])),
];

function configCon() {
  return { impresion: { impresoras: { cocina: "", barra: "", caja: "", tickets: "" } } };
}

function aplazada() {
  let resolve;
  const promesa = new Promise((r) => {
    resolve = r;
  });
  return { promesa, resolve };
}

const arbol = () => (
  <MemoryRouter initialEntries={["/configuracion/impresion"]}>
    <Routes>
      <Route path="/configuracion/impresion" element={<ConfigImpresionPage />} />
      <Route path="/configuracion/impresion/centro" element={<p>DESTINO centro de impresión</p>} />
    </Routes>
  </MemoryRouter>
);

const renderPagina = () => render(arbol());

// Botón de guardar la configuración (barra fija). El de «Guardar diseño» vive en el modal.
const botonGuardarConfig = () => document.querySelector(".print-config-actions .btn-primario");

// Espera a que no haya carga en curso (Probar Caja se desactiva mientras carga).
const esperarQueNoCargue = () =>
  waitFor(() => expect(screen.getByRole("button", { name: "Probar Caja" })).toBeEnabled());

const notaConsejo = () => screen.getByText(/^Consejo:/).textContent;

beforeEach(() => {
  vi.clearAllMocks();
  H.ctx = { config: configCon(), refreshConfig: vi.fn(async () => {}) };
  api.get.mockImplementation(async (url) => {
    if (url === "/impresoras/listar") return { data: { impresoras: IMPRESORAS, estado: "online" } };
    throw new Error(`GET no mockeado: ${url}`);
  });
  api.post.mockImplementation(async (url) => {
    if (url === "/impresoras/test") return { data: { message: "Prueba enviada (caja)", estado: "online" } };
    if (url === "/admin/config/versions") return { data: { version: { id: "v1" } } };
    if (url === "/admin/config/versions/v1/apply") return { data: {} };
    throw new Error(`POST no mockeado: ${url}`);
  });
});

describe("(1) P-430 · la alerta de éxito usa un tipo que AlertaMensaje sí estiliza", () => {
  it("(harness) el CSS de AlertaMensaje se lee y define «alerta-exito»", () => {
    expect(TIPOS_ESTILIZADOS).toContain("alerta-exito");
  });

  it("la alerta lleva una clase que AlertaMensaje.css define", async () => {
    renderPagina();
    const alerta = (await screen.findByText(/^Se detectaron \d+ impresoras$/)).closest(".alerta-mensaje");
    const tipo = [...alerta.classList].find((c) => c.startsWith("alerta-") && c !== "alerta-mensaje");
    expect(TIPOS_ESTILIZADOS).toContain(tipo);
  });

  it("usa «alerta-exito», el mismo tipo que la pantalla de tienda", async () => {
    renderPagina();
    const alerta = (await screen.findByText(/^Se detectaron \d+ impresoras$/)).closest(".alerta-mensaje");
    expect(alerta.className).toContain("alerta-exito");
  });
});

describe("(2) P-430 · la nota describe lo que el select permite", () => {
  it("no promete escribir el nombre de la impresora", async () => {
    renderPagina();
    await esperarQueNoCargue();
    expect(notaConsejo()).not.toMatch(/escribir|teclear|texto libre/i);
  });

  it("dice que la impresora se elige en una lista", async () => {
    renderPagina();
    await esperarQueNoCargue();
    expect(notaConsejo()).toMatch(/\belige\b[^.]*\blista\b/i);
  });

  it("(lock) las cuatro estaciones son <select>, sin campo de texto", async () => {
    renderPagina();
    await esperarQueNoCargue();
    for (const id of ["imp-cocina", "imp-barra", "imp-caja", "imp-tickets"]) {
      expect(document.getElementById(id).tagName).toBe("SELECT");
    }
  });
});

describe("(3) P-430 · «Guardando...» solo mientras se guarda", () => {
  it("con la carga de impresoras en curso, el botón no dice «Guardando...»", async () => {
    api.get.mockImplementation(() => new Promise(() => {})); // listar nunca responde
    renderPagina();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/impresoras/listar"));
    expect(botonGuardarConfig().textContent).toBe("Guardar configuración");
  });

  it("con una prueba de impresión en curso, el botón no dice «Guardando...»", async () => {
    const prueba = aplazada();
    api.post.mockImplementation(async (url) => (url === "/impresoras/test" ? prueba.promesa : { data: {} }));
    renderPagina();
    await esperarQueNoCargue();
    fireEvent.click(screen.getByRole("button", { name: "Probar Caja" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/impresoras/test", { estacion: "caja" }));
    expect(botonGuardarConfig().textContent).toBe("Guardar configuración");
    prueba.resolve({ data: { message: "Prueba enviada (caja)", estado: "online" } });
    await screen.findByText("Prueba enviada (caja)");
  });
});

describe("(G) regresión · «Guardando...» sigue apareciendo mientras se guarda", () => {
  it("al guardar la configuración, dice «Guardando...» y vuelve a su texto al terminar", async () => {
    const guardado = aplazada();
    api.post.mockImplementation(async (url) => {
      if (url === "/admin/config/versions") return guardado.promesa;
      if (url === "/admin/config/versions/v1/apply") return { data: {} };
      throw new Error(`POST no mockeado: ${url}`);
    });
    renderPagina();
    await esperarQueNoCargue();
    fireEvent.change(screen.getByLabelText("Impresora Caja"), { target: { value: "POS-80" } });
    fireEvent.click(botonGuardarConfig());
    await waitFor(() => expect(botonGuardarConfig().textContent).toBe("Guardando..."));
    guardado.resolve({ data: { version: { id: "v1" } } });
    await waitFor(() => expect(botonGuardarConfig().textContent).toBe("Guardar configuración"));
    expect(api.post).toHaveBeenCalledWith("/admin/config/versions/v1/apply", expect.anything());
  });

  it("al guardar el diseño desde el modal, el botón de la barra dice «Guardando...»", async () => {
    const guardado = aplazada();
    api.post.mockImplementation(async (url) => {
      if (url === "/admin/config/versions") return guardado.promesa;
      if (url === "/admin/config/versions/v1/apply") return { data: {} };
      throw new Error(`POST no mockeado: ${url}`);
    });
    renderPagina();
    await esperarQueNoCargue();
    fireEvent.click(screen.getByRole("button", { name: "Personalizar ticket" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar diseño" }));
    await waitFor(() => expect(botonGuardarConfig().textContent).toBe("Guardando..."));
    guardado.resolve({ data: { version: { id: "v1" } } });
    await waitFor(() => expect(botonGuardarConfig().textContent).toBe("Guardar configuración"));
  });
});
