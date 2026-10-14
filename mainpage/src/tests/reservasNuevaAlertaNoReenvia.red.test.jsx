/**
 * reservasNuevaAlertaNoReenvia.red.test.jsx — D-1331 en lote/panel-reservas-estilo (14-oct)
 *
 * En producción (fbd0c40): tras crear una reserva desde el panel, el aviso «Reserva creada» se
 * queda 900 ms DENTRO del <form> de ModalNuevaReserva (`:157,286`) y su «×» no llevaba `type` ⇒
 * un <button> sin `type` dentro de un <form> ENVÍA el form ⇒ tocar la × manda OTRO POST /reservas.
 * Arreglo de raíz en el componente compartido (AlertaMensaje.jsx: `type="button"`), IDÉNTICO al de
 * lote/molo-panel-servicios (que lo protege con su propia red, con un ayudante que esta base no
 * tiene; por eso esta red va en otro fichero y no choca al juntar).
 * Censo Art. 3 en esta base: 33 usos de <AlertaMensaje en 32 ficheros, sólo 1 dentro de un <form>
 * (este). Nace ROJA contra AlertaMensaje.jsx sin `type="button"`.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("../utils/api", () => ({ default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), put: vi.fn() } }));

import api from "../utils/api";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ModalNuevaReserva from "../components/Reservas/ModalNuevaReserva.jsx";

beforeEach(() => { vi.clearAllMocks(); });

describe("D-1331 · la «×» de un aviso no envía el formulario", () => {
  it("AlertaMensaje dentro de un <form>: la × cierra y NO envía", () => {
    const enviar = vi.fn((e) => e.preventDefault());
    const cerrar = vi.fn();
    render(
      <form onSubmit={enviar}>
        <AlertaMensaje tipo="error" mensaje="No se pudo guardar." autoCerrar={false} onClose={cerrar} />
        <button type="submit">Guardar</button>
      </form>,
    );
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    expect(cerrar).toHaveBeenCalledTimes(1);
    expect(enviar).not.toHaveBeenCalled();
  });

  it("ModalNuevaReserva: tocar la × del aviso de éxito antes de que se cierre NO crea otra reserva", async () => {
    api.post.mockResolvedValue({ data: { mensaje: "Reserva creada correctamente." } });
    const { container } = render(<ModalNuevaReserva onClose={vi.fn()} onCreated={vi.fn()} />);
    const poner = (n, v) => fireEvent.change(container.querySelector(`[name="${n}"]`), { target: { value: v } });
    poner("nombre", "Ana");
    poner("email", "a@b.es");
    poner("telefono", "600000000");
    poner("hora", "2026-10-20T21:00");
    fireEvent.submit(container.querySelector("form"));
    expect(await screen.findByText(/Reserva creada/)).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(api.post).toHaveBeenCalledTimes(1);
  });
});
