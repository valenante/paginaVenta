// src/utils/numeroInput.test.js
//
// Regression-lock del bug "no puedo borrar el 0 del precio" (2026-08).
// Ver el porqué del contrato en numeroInput.js.
//
// Runner: el panel todavía NO tiene vitest cableado en package.json.
// Estos tests se ejecutan con la config de vitest+jsdom del banco de pruebas.

import { describe, it, expect } from "vitest";
import {
  toInputText,
  toNumOrNull,
  toNum,
  hasNum,
  clampNumOrNull,
  clampNum,
  clampIntNum,
} from "./numeroInput";

describe("toInputText — sembrar el input", () => {
  it("un campo sin valor nace VACÍO, no con un 0 que pelear", () => {
    expect(toInputText(null)).toBe("");
    expect(toInputText(undefined)).toBe("");
    expect(toInputText("")).toBe("");
  });

  it("respeta el 0 explícito y el texto a medio teclear", () => {
    expect(toInputText(0)).toBe("0");
    expect(toInputText(1.29)).toBe("1.29");
    expect(toInputText("1.")).toBe("1.");
  });
});

describe("toNumOrNull — el vacío es null, NUNCA 0 ni NaN", () => {
  it("el campo vacío NO vale 0 (ese era el bug: Number('') === 0)", () => {
    expect(toNumOrNull("")).toBeNull();
    expect(toNumOrNull(null)).toBeNull();
    expect(toNumOrNull(undefined)).toBeNull();
  });

  it("los estados intermedios del tecleo no revientan", () => {
    expect(toNumOrNull(".")).toBeNull();
    expect(toNumOrNull("-")).toBeNull();
    expect(toNumOrNull("1.")).toBe(1);
    expect(toNumOrNull(".5")).toBe(0.5);
  });

  it("acepta coma decimal (teclado es-ES)", () => {
    expect(toNumOrNull("1,29")).toBe(1.29);
    expect(toNumOrNull(",5")).toBe(0.5);
  });

  it("nunca devuelve NaN", () => {
    expect(toNumOrNull("abc")).toBeNull();
    expect(toNumOrNull(NaN)).toBeNull();
    expect(toNumOrNull("1.2.3")).toBeNull();
  });

  it("lee el precio real del bug de Valen", () => {
    expect(toNumOrNull("1.29")).toBe(1.29);
    expect(toNumOrNull("0.5")).toBe(0.5);
    expect(toNumOrNull(0)).toBe(0);
  });
});

describe("toNum / hasNum — conversión en el submit", () => {
  it("el fallback sólo entra cuando NO hay número", () => {
    expect(toNum("", 0)).toBe(0);
    expect(toNum("", 10)).toBe(10);
    expect(toNum("1,29", 0)).toBe(1.29);
    expect(toNum(0, 10)).toBe(0); // un 0 escrito a propósito es un 0
  });

  it("hasNum distingue 'vacío' de 'cero'", () => {
    expect(hasNum("")).toBe(false);
    expect(hasNum("0")).toBe(true);
    expect(hasNum("abc")).toBe(false);
  });
});

describe("clamps — respetan el vacío y aplican límites", () => {
  it("clampNumOrNull: null entra, null sale", () => {
    expect(clampNumOrNull("", 1, 60)).toBeNull();
    expect(clampNumOrNull("80", 50, 99)).toBe(80);
    expect(clampNumOrNull("120", 50, 99)).toBe(99);
    expect(clampNumOrNull("10", 50, 99)).toBe(50);
  });

  it("clampNum usa el fallback pedido, no el mínimo, cuando está vacío", () => {
    expect(clampNum("", 1, 60, 10)).toBe(10);
    expect(clampNum("5", 1, 60, 10)).toBe(5);
  });

  it("clampIntNum trunca y respeta el fallback", () => {
    expect(clampIntNum("", 1, 200, 5)).toBe(5);
    expect(clampIntNum("7.9", 1, 200, 5)).toBe(7);
    expect(clampIntNum("300", 1, 200, 5)).toBe(200);
  });
});
