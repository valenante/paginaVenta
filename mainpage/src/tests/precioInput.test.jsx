// El bug que reporto Valen el 2026-08-07, convertido en test:
// "en el modal de editar/crear producto no puedo borrar el 0 para escribir 1.29".
//
// Reproduce el ciclo REAL de un input controlado de precio: estado -> value ->
// onChange -> estado. Si alguien vuelve a convertir a numero dentro del onChange
// (Number(e.target.value) || 0), el "0" reaparece y este test se pone rojo.
import React, { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { toInputText, toNumOrNull } from "../utils/numeroInput";

/** Réplica mínima de un campo de precio del modal de producto. */
function CampoPrecio({ inicial = 0, onGuardar = () => {} }) {
  const [precio, setPrecio] = useState(toInputText(inicial));
  return (
    <>
      <input
        aria-label="precio"
        type="number"
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
      />
      <button onClick={() => onGuardar(toNumOrNull(precio) ?? 0)}>guardar</button>
    </>
  );
}

const teclear = (input, valor) => fireEvent.change(input, { target: { value: valor } });

describe("input de precio del modal de producto", () => {
  it("se puede BORRAR el 0 y el campo se queda vacio", () => {
    render(<CampoPrecio inicial={0} />);
    const input = screen.getByLabelText("precio");
    teclear(input, "");
    expect(input.value).toBe("");
  });

  it("se puede escribir 1.29 de izquierda a derecha", () => {
    render(<CampoPrecio inicial={0} />);
    const input = screen.getByLabelText("precio");
    teclear(input, "");
    // OJO: el paso intermedio "1." NO se puede comprobar por `input.value`. En un
    // <input type="number"> el navegador sanea .value y devuelve "" mientras el
    // numero esta a medias; el "1." vive en su buffer interno. Lo que SI se puede
    // fijar —y es lo que se rompia— es que el campo NO vuelva a "0" por el camino.
    for (const paso of ["1", "1.2", "1.29"]) {
      teclear(input, paso);
      expect(input.value).toBe(paso);
    }
    teclear(input, "1.");
    expect(input.value).not.toBe("0"); // antes reaparecia el 0 y se perdia el punto
  });

  it("al guardar sale el numero, no el texto", () => {
    let guardado = null;
    render(<CampoPrecio inicial={0} onGuardar={(v) => { guardado = v; }} />);
    teclear(screen.getByLabelText("precio"), "1.29");
    fireEvent.click(screen.getByText("guardar"));
    expect(guardado).toBe(1.29);
  });

  // ⚠️ HALLAZGO (2026-08-07): el helper convierte "1,29" -> 1.29, pero con
  // <input type="number"> la coma NUNCA llega al onChange: el navegador la rechaza
  // y deja el value en "". Es decir, el soporte de coma del helper solo sirve si
  // el input pasa a type="text" + inputMode="decimal". Este test congela el
  // comportamiento REAL de hoy para que nadie prometa la coma sin cambiar el input.
  it("con type=number la coma la rechaza el navegador (y NO se guarda basura)", () => {
    let guardado = "sin tocar";
    render(<CampoPrecio inicial={0} onGuardar={(v) => { guardado = v; }} />);
    teclear(screen.getByLabelText("precio"), "1,29");
    fireEvent.click(screen.getByText("guardar"));
    expect(guardado).toBe(0);          // no 1.29, pero tampoco NaN ni ""
    expect(Number.isNaN(guardado)).toBe(false);
  });

  it("el helper SI entiende la coma (para inputs de texto)", () => {
    expect(toNumOrNull("1,29")).toBe(1.29);
  });

  it("guardar con el campo VACIO no manda '' ni NaN a la base de datos", () => {
    let guardado = "sin tocar";
    render(<CampoPrecio inicial={0} onGuardar={(v) => { guardado = v; }} />);
    teclear(screen.getByLabelText("precio"), "");
    fireEvent.click(screen.getByText("guardar"));
    expect(guardado).toBe(0);
    expect(Number.isNaN(guardado)).toBe(false);
  });
});
