/**
 * ⚖️ D-443 · EL MODAL LE ROBA EL FOCO AL CAMPO — en táctil eso es «no puedo escribir».
 *
 * ── EL SÍNTOMA, tal y como lo vio Valen en staging ─────────────────────────────────────
 * «En nuevo ítem de stock, en pantalla táctil, aprieto en el input de nombre y el teclado se
 * abre, se cierra, y no puedo escribir.»
 *
 * ── LA CAUSA, medida en el código ──────────────────────────────────────────────────────
 * `ModalBase.jsx` hace dos cosas que se pisan:
 *   (1) al abrir, un `setTimeout(…, 0)` mueve el foco al **botón de cerrar** — no al primer
 *       campo — aunque el campo tenga `autoFocus`. El campo coge el foco, el temporizador se lo
 *       quita: en escritorio es un parpadeo invisible; **en táctil el teclado se cierra**.
 *   (2) el efecto lleva `onClose` en sus dependencias, y los nueve consumidores lo pasan como
 *       función anónima (`onClose={() => setModal(null)}`), que es **nueva en cada render del
 *       padre**. Así que el efecto se desmonta y se rehace una y otra vez, y con él el robo.
 *
 * ── POR QUÉ ESTA RED Y NO OTRA ─────────────────────────────────────────────────────────
 * ⭐ No comprueba «el temporizador existe» ni «las dependencias son estas»: eso sería vigilar
 * la FORMA del arreglo. Comprueba **la garantía que el usuario necesita** — *después de abrir un
 * modal, el foco está en el primer campo que se puede escribir, y SIGUE ahí cuando el padre se
 * repinta*. Cualquier arreglo que la cumpla vale; el que no, no.
 *
 * ⚠️ NACEN ROJAS F1 y F2 con el código de hoy.
 */
import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import ModalBase from "../components/MapaEditor/ModalBase";

/** Un modal como los nueve reales: un campo de texto y un `onClose` anónimo. */
function ModalDePrueba({ onClose }) {
  return (
    <ModalBase open title="Nuevo ítem de stock" onClose={onClose} footer={null}>
      <input aria-label="Nombre" autoFocus />
    </ModalBase>
  );
}

/** El padre, que se repinta por su cuenta — como StockPage al recibir un flash o un refresco. */
function PadreQueSeRepinta() {
  const [, setTic] = useState(0);
  return (
    <>
      <button onClick={() => setTic((n) => n + 1)}>repintar</button>
      {/* ⚠️ funcion anonima A PROPOSITO: es exactamente como la pasan los 9 consumidores */}
      <ModalDePrueba onClose={() => {}} />
    </>
  );
}

describe("D-443 · un modal no le roba el foco al primer campo", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  // ═════════════════════════════════════════════════════════════════════════════════════
  // F1 · AL ABRIR — el foco tiene que acabar en el campo, no en la ✕.
  // ═════════════════════════════════════════════════════════════════════════════════════
  it("F1 · al abrir, el foco queda en el primer campo escribible", async () => {
    render(<ModalDePrueba onClose={() => {}} />);
    await act(async () => { vi.advanceTimersByTime(50); });

    const campo = screen.getByLabelText("Nombre");
    expect(
      document.activeElement,
      `el foco acabo en <${document.activeElement?.tagName?.toLowerCase()}` +
      `${document.activeElement?.getAttribute?.("aria-label") ? ` aria-label="${document.activeElement.getAttribute("aria-label")}"` : ""}>` +
      " en vez de en el campo: en tactil eso cierra el teclado",
    ).toBe(campo);
  });

  // ═════════════════════════════════════════════════════════════════════════════════════
  // F3 · SIN `autoFocus` — aqui es donde trabaja de verdad la eleccion del campo escribible.
  //      ⚠️ Este caso existe porque F1 y F2 NO atraviesan esa rama: con `autoFocus`, el campo
  //      ya tiene el foco y el arreglo sale antes de elegir nada. Sin este caso, elegir el
  //      campo escribible seria codigo que ninguna red mira (verificado: borrando el
  //      temporizador entero, F1 y F2 seguian verdes).
  // ═════════════════════════════════════════════════════════════════════════════════════
  it("F3 · sin autoFocus, el modal enfoca el primer campo escribible", async () => {
    render(
      <ModalBase open title="Sin autoFocus" onClose={() => {}} footer={null}>
        <input aria-label="Nombre" />
      </ModalBase>
    );
    await act(async () => { vi.advanceTimersByTime(50); });

    expect(
      document.activeElement,
      `enfoco <${document.activeElement?.getAttribute?.("aria-label") || document.activeElement?.tagName}>` +
      " en vez del campo: en tactil el usuario tiene que tocar dos veces para escribir",
    ).toBe(screen.getByLabelText("Nombre"));
  });

  // ═════════════════════════════════════════════════════════════════════════════════════
  // C0 · CONTROL · un modal SIN campos (confirmar/eliminar) debe seguir enfocando la ✕.
  //      Sin esto, «no robes el foco» podria cumplirse dejando el foco en ningun sitio,
  //      que rompe el teclado fisico y la accesibilidad.
  // ═════════════════════════════════════════════════════════════════════════════════════
  it("C0 · CONTROL · un modal sin campos enfoca el boton de cerrar", async () => {
    render(
      <ModalBase open title="Eliminar mesa" onClose={() => {}} footer={null}>
        <p>¿Seguro que quieres eliminarla?</p>
      </ModalBase>
    );
    await act(async () => { vi.advanceTimersByTime(50); });

    expect(
      document.activeElement?.getAttribute?.("aria-label"),
      "un modal sin campos ha dejado el foco fuera de si mismo",
    ).toBe("Cerrar");
  });

  // ═════════════════════════════════════════════════════════════════════════════════════
  // F2 · Y SIGUE AHI cuando el padre se repinta. Es la mitad que hace que se repita
  //      cada vez que tocas, no solo al abrir.
  // ═════════════════════════════════════════════════════════════════════════════════════
  it("F2 · el foco sobrevive a un repintado del padre", async () => {
    render(<PadreQueSeRepinta />);
    await act(async () => { vi.advanceTimersByTime(50); });

    const campo = screen.getByLabelText("Nombre");
    campo.focus();
    expect(document.activeElement, "CONTROL: el campo no llego a tener el foco").toBe(campo);

    // el padre se repinta -> `onClose` cambia de identidad -> el efecto se rehace.
    // ⚠️ Y hay que DEJAR CORRER EL TEMPORIZADOR despues del repintado: la primera version de
    // este caso comprobaba antes de que saltara y salia VERDE sin medir nada. Diagnosticado:
    // tras el repintado el efecto SI se rehace y el foco acaba en "Cerrar".
    await act(async () => { screen.getByText("repintar").click(); });
    await act(async () => { vi.advanceTimersByTime(200); });

    expect(
      document.activeElement,
      "un repintado del padre le quita el foco al campo: en tactil el teclado se cierra solo mientras escribes",
    ).toBe(campo);
  });
});
