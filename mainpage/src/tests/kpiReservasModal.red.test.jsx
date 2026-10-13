/**
 * Modal del KPI "Reservas" del panel operativo (pedido de Valen, 13-oct): al abrirse debe
 * enseñar TODOS los datos de la reserva, no sólo hora, nombre, personas y estado crudo.
 * Red ROJA contra `ae548c9`.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../hooks/useAdminDashboard", () => ({
  useAdminDashboard: () => ({
    loading: false, error: null, refresh: () => {},
    data: {
      resumen: { reservasHoy: 1 }, caja: {}, topProductos: [], staff: [], eliminaciones: [],
      reservas: [{
        _id: "r1", nombre: "Gonzalo", personas: 4, telefono: "611222333", email: "g@x.es",
        hora: new Date().toISOString(), estado: "no-show", mesaAsignada: "12",
        mensaje: "Venimos con un carrito de bebé", alergias: "Frutos secos",
      }],
    },
  }),
}));
vi.mock("../hooks/useFeature", () => ({ useFeature: () => false }));
vi.mock("../context/ConfigContext", () => ({ useConfig: () => ({ config: {} }) }));
vi.mock("../hooks/useLocale", () => ({ useLocale: () => ({ currencySymbol: "€", locale: "es-ES" }) }));
vi.mock("../components/Panel/AnalyticsFase2", () => ({ ComparativaCard: () => null, RatioTipoCard: () => null, VentasPorHoraCard: () => null }));
vi.mock("../components/Panel/AnalyticsFase3", () => ({ CorrelacionCard: () => null, AlertasCard: () => null }));
vi.mock("../components/Panel/TiemposCocinaCard", () => ({ default: () => null }));
vi.mock("../components/Estadisticas/UpsellEstadisticasPro", () => ({ default: () => null }));

import AdminDashboard from "../components/Panel/AdminDashboard.jsx";

describe("KPI Reservas → modal con todos los datos", () => {
  it("enseña teléfono, mesa, email, mensaje, alergias y el estado en español", () => {
    render(<AdminDashboard />);
    fireEvent.click(screen.getByText("Reservas").closest("button"));
    expect(screen.getByText("611222333")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("g@x.es")).toBeInTheDocument();
    expect(screen.getByText("Venimos con un carrito de bebé")).toBeInTheDocument();
    expect(screen.getByText("Frutos secos")).toBeInTheDocument();
    expect(screen.getByText("No vino")).toBeInTheDocument();
    expect(screen.queryAllByText("no-show")).toHaveLength(0);
  });

  it("con sólo email no aparece un \"—\" suelto (H8)", async () => {
    const mod = await import("../hooks/useAdminDashboard");
    vi.spyOn(mod, "useAdminDashboard").mockReturnValue({
      loading: false, error: null, refresh: () => {},
      data: { resumen: { reservasHoy: 1 }, caja: {}, topProductos: [], staff: [], eliminaciones: [],
        reservas: [{ _id: "r2", nombre: "Solo Email", personas: 2, telefono: "6", email: "s@x.es", hora: new Date().toISOString(), estado: "confirmada" }] },
    });
    render(<AdminDashboard />);
    fireEvent.click(screen.getByText("Reservas").closest("button"));
    const extra = document.querySelector(".adm__reserva-extra");
    expect(extra).not.toBeNull();
    expect(extra.textContent).toBe("s@x.es");
  });
});
