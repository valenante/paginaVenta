/**
 * Listado de reservas del panel (pedido de Valen, 13-oct, con la lista real de Bodegón delante):
 *  1. Paginación: con 27 reservas la pantalla quedaba larguísima → 20 por página.
 *  2. Próximas primero: hoy y lo que viene arriba; lo pasado al final, lo más reciente antes.
 *  3. Se ve lo que escribió el cliente (mensaje) y sus alergias. El servidor ya las devolvía
 *     (`reservas.service.js` → `Reserva.find(...).lean()`), sólo faltaba pintarlas.
 *  4. Botones en español: nada de "Check-in" ni "No-show".
 *  5. La tarjeta de móvil enseñaba el estado crudo ("no-show") en vez de su etiqueta.
 *
 * Red ROJA contra `ae548c9` (lo que hay en producción).
 */
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";

vi.mock("../utils/api", () => ({ default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock("../hooks/useFeature", () => ({ useFeature: () => true }));
vi.mock("../components/Reservas/FiltroFechaReservas", () => ({ default: () => null }));
vi.mock("../components/Reservas/ModalNuevaReserva.jsx", () => ({ default: () => null }));
vi.mock("../components/Reservas/ReservasAjustesPage.jsx", () => ({ default: () => null }));

import api from "../utils/api";
import ReservasConfigPage from "../pages/ReservasConfigPage.jsx";

const DIA = 24 * 3600 * 1000;
const ahora = Date.now();

function reserva(i, offsetDias, extra = {}) {
  return {
    _id: `r${i}`, nombre: `Cliente ${i}`, personas: 2, telefono: `600${i}`,
    email: `c${i}@x.es`, hora: new Date(ahora + offsetDias * DIA).toISOString(),
    estado: "no-show", ...extra,
  };
}

function servir(lista) {
  api.get.mockImplementation(async (url) => {
    if (url === "/reservas/fechasReserva") return { data: { fechas: [] } };
    return { data: lista };
  });
}

const filasEscritorio = () => {
  const tabla = screen.getByRole("table");
  return within(tabla).getAllByRole("row").slice(1); // sin la cabecera
};

beforeEach(() => { vi.clearAllMocks(); });

describe("Listado de reservas", () => {
  it("pagina de 20 en 20", async () => {
    servir(Array.from({ length: 27 }, (_, i) => reserva(i, -i - 1)));
    render(<ReservasConfigPage />);
    await waitFor(() => expect(filasEscritorio()).toHaveLength(20));
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    await waitFor(() => expect(filasEscritorio()).toHaveLength(7));
  });

  it("próximas primero (ascendente) y luego las pasadas (la más reciente antes)", async () => {
    servir([
      reserva("pasadaVieja", -10),
      reserva("futuraLejana", 5, { estado: "confirmada" }),
      reserva("pasadaReciente", -1),
      reserva("futuraCerca", 1, { estado: "confirmada" }),
    ]);
    render(<ReservasConfigPage />);
    await waitFor(() => expect(filasEscritorio()).toHaveLength(4));
    const nombres = filasEscritorio().map((tr) => tr.querySelector("strong").textContent);
    expect(nombres).toEqual(["Cliente futuraCerca", "Cliente futuraLejana", "Cliente pasadaReciente", "Cliente pasadaVieja"]);
  });

  it("enseña el mensaje del cliente y las alergias", async () => {
    servir([reserva(1, 1, { estado: "confirmada", mensaje: "Mesa en la terraza, es un cumple", alergias: "Celíaco" })]);
    render(<ReservasConfigPage />);
    await waitFor(() => expect(filasEscritorio()).toHaveLength(1));
    // En la TABLA (escritorio) y en la TARJETA (móvil): las dos se pintan en el DOM.
    const tabla = screen.getByRole("table");
    expect(within(tabla).getByText("Mesa en la terraza, es un cumple")).toBeInTheDocument();
    expect(within(tabla).getByText("Celíaco")).toBeInTheDocument();
    const tarjeta = document.querySelector(".rc-mcards");
    expect(within(tarjeta).getByText("Mesa en la terraza, es un cumple")).toBeInTheDocument();
    expect(within(tarjeta).getByText("Celíaco")).toBeInTheDocument();
  });

  it("los botones están en español", async () => {
    servir([reserva(1, 1, { estado: "confirmada" })]);
    render(<ReservasConfigPage />);
    await waitFor(() => expect(filasEscritorio()).toHaveLength(1));
    expect(screen.queryAllByText("Check-in")).toHaveLength(0);
    expect(screen.queryAllByText("No-show")).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: "Ha llegado" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "No vino" }).length).toBeGreaterThan(0);
  });

  it("la tarjeta de móvil usa la etiqueta, no el estado crudo", async () => {
    servir([reserva(1, -1, { estado: "no-show" })]);
    render(<ReservasConfigPage />);
    await waitFor(() => expect(filasEscritorio()).toHaveLength(1));
    expect(screen.queryAllByText("no-show")).toHaveLength(0);
  });

  it("cambiar el filtro vuelve a la página 1", async () => {
    servir(Array.from({ length: 27 }, (_, i) => reserva(i, -i - 1)));
    render(<ReservasConfigPage />);
    await waitFor(() => expect(filasEscritorio()).toHaveLength(20));
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    await waitFor(() => expect(filasEscritorio()).toHaveLength(7));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "no-show" } });
    await waitFor(() => expect(filasEscritorio()).toHaveLength(20));
  });

  it("si la lista encoge, no se queda en una página vacía", async () => {
    servir(Array.from({ length: 27 }, (_, i) => reserva(i, -i - 1)));
    render(<ReservasConfigPage />);
    await waitFor(() => expect(filasEscritorio()).toHaveLength(20));
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    await waitFor(() => expect(filasEscritorio()).toHaveLength(7));
    servir(Array.from({ length: 5 }, (_, i) => reserva(i, -i - 1)));
    fireEvent.click(screen.getByRole("button", { name: "Refrescar" }));
    await waitFor(() => expect(filasEscritorio()).toHaveLength(5));
  });

  it("una reserva de HOY ya pasada sigue arriba (el corte es a las 00:00, no ahora)", async () => {
    const hoy0 = new Date(); hoy0.setHours(0, 0, 0, 1);
    servir([
      reserva("manana", 1, { estado: "confirmada" }),
      { ...reserva("hoyTemprano", 0, { estado: "confirmada" }), hora: hoy0.toISOString() },
      reserva("ayer", -1),
    ]);
    render(<ReservasConfigPage />);
    await waitFor(() => expect(filasEscritorio()).toHaveLength(3));
    const nombres = filasEscritorio().map((tr) => tr.querySelector("strong").textContent);
    expect(nombres).toEqual(["Cliente hoyTemprano", "Cliente manana", "Cliente ayer"]);
  });

  it("una hora ilegible va al final y no rompe el orden", async () => {
    servir([
      { ...reserva("rota", 0), hora: "no-es-fecha" },
      reserva("ayer", -1),
      reserva("manana", 1, { estado: "confirmada" }),
    ]);
    render(<ReservasConfigPage />);
    await waitFor(() => expect(filasEscritorio()).toHaveLength(3));
    const nombres = filasEscritorio().map((tr) => tr.querySelector("strong").textContent);
    expect(nombres).toEqual(["Cliente manana", "Cliente ayer", "Cliente rota"]);
  });
});
