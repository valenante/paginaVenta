/**
 * anularMotivo.test.jsx
 *
 * ⚖️ Constitución ALEF · Art. 4 (la red se pone ANTES) · Art. 4c (mata al mutante).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LA CICATRIZ QUE VIGILA
 *
 * `FacturasPage.jsx -> ejecutarAnulacion` no aceptaba parámetros y mandaba el motivo
 * HARDCODEADO a cadena vacía:
 *
 *     const ejecutarAnulacion = async () => { ... api.post(url, { motivo: "" }) }
 *
 * mientras `anularFacturaSchema` exigía `.min(1)`. **HTTP 400 siempre, durante 148 días**
 * (desde `7a2a8710`, 18-mar-2026, un día después de instalar Zabor-Fetén). Y no era que el
 * usuario dejara el campo vacío: **NO HABÍA CAMPO**. `ModalConfirmacion` sólo pinta el
 * input si recibe un `placeholder` (`ModalConfirmacion.jsx:32`, default `""` → falsy), y
 * `FacturasPage` no se lo pasaba.
 *
 * Nadie lo vio en cinco meses porque `ErrorToast` no pinta el `fields` que manda el
 * backend: el usuario leía «Algo no salió bien» y el diagnóstico exacto —«El motivo es
 * obligatorio»— se perdía en el último salto. [PENDIENTE UX ERROR FIELDS].
 *
 * ⚠️ ESTE TEST NO MONTA `FacturasPage` ENTERA. Esa página arrastra el router, contextos,
 * el cliente de API y media docena de modales: montarla haría un test lento y frágil que
 * se rompería por motivos que no son éste. Lo que se congela es **el contrato del
 * eslabón que falló**: que `ModalConfirmacion` pinta el input cuando recibe `placeholder`
 * y entrega lo tecleado a `onConfirm`. Si ese eslabón se rompe, el bug vuelve.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Las props EXACTAS con las que `FacturasPage.jsx` invoca el modal al anular. */
const propsDeAnulacion = (onConfirm) => ({
  titulo: "Confirmar anulación",
  mensaje: "Vas a anular la factura Nº 2026-0001. Esta acción no se puede deshacer.",
  placeholder: "Motivo de la anulación (opcional)",
  onConfirm,
  onClose: () => {},
});

describe("ModalConfirmacion · el eslabón que rompió «Anular»", () => {
  it("⭐ CON `placeholder` PINTA el input — sin esto no hay dónde escribir el motivo", () => {
    render(<ModalConfirmacion {...propsDeAnulacion(vi.fn())} />);
    expect(screen.getByPlaceholderText("Motivo de la anulación (opcional)")).toBeInTheDocument();
  });

  it("⚠️ CONTROL · SIN `placeholder` NO pinta ningún input — así estaba y así nació el bug", () => {
    const { container } = render(
      <ModalConfirmacion titulo="x" mensaje="y" onConfirm={vi.fn()} onClose={() => {}} />
    );
    expect(container.querySelector("input")).toBeNull();
  });

  it("⭐ entrega a `onConfirm` LO QUE EL USUARIO ESCRIBE, no una cadena vacía", () => {
    const onConfirm = vi.fn();
    render(<ModalConfirmacion {...propsDeAnulacion(onConfirm)} />);

    fireEvent.change(screen.getByPlaceholderText("Motivo de la anulación (opcional)"), {
      target: { value: "Factura duplicada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));

    expect(onConfirm).toHaveBeenCalledWith("Factura duplicada");
    // El mutante a matar: volver a mandar "" ignorando lo tecleado.
    expect(onConfirm).not.toHaveBeenCalledWith("");
  });

  it("recorta los espacios: el motivo no se guarda con bordes sucios", () => {
    const onConfirm = vi.fn();
    render(<ModalConfirmacion {...propsDeAnulacion(onConfirm)} />);
    fireEvent.change(screen.getByPlaceholderText("Motivo de la anulación (opcional)"), {
      target: { value: "  Error al emitir  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(onConfirm).toHaveBeenCalledWith("Error al emitir");
  });

  it("⚠️ dejarlo vacío SIGUE siendo válido — el motivo es opcional (Art. 7: no se prohíbe nada)", () => {
    const onConfirm = vi.fn();
    render(<ModalConfirmacion {...propsDeAnulacion(onConfirm)} />);
    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(onConfirm).toHaveBeenCalledWith("");
  });
});

/* ════════════════════════════════════════════════════════════════════════════════════
 * EL CABLEADO DE LA PÁGINA
 *
 * ⚠️ HONESTIDAD SOBRE QUÉ ES ESTO (Art. 9). Los tests de arriba congelan el modal, que es
 * donde estaba el eslabón roto. Pero al mutar `FacturasPage.jsx` para que volviera a
 * hardcodear `motivo: ""` —el bug ORIGINAL, tal cual— **la suite entera seguía verde**
 * (23/23). O sea: había un piso sin red, justo el que falló durante 148 días.
 *
 * Montar `FacturasPage` entera arrastraría router, contextos, cliente de API y media
 * docena de modales: un test lento y frágil que se rompería por motivos ajenos a éste.
 * Así que esto es una comprobación ESTRUCTURAL sobre el fuente.
 *
 * ⚠️ LO QUE ESTA COMPROBACIÓN **NO** PUEDE HACER: no ejecuta nada, así que no detecta que
 * el valor se pierda por el camino (p. ej. que se pase al modal pero el handler correcto
 * sea otro). Es una red de segundo orden, puesta a propósito porque la de primer orden
 * costaría más de lo que vale. Si algún día se monta la página de verdad, esto sobra.
 * ════════════════════════════════════════════════════════════════════════════════════ */
describe("FacturasPage · el cableado del motivo (comprobación estructural)", () => {
  const fuente = fs.readFileSync(path.join(RAIZ, "pages/FacturasPage.jsx"), "utf8");

  it("⭐ `ejecutarAnulacion` DECLARA un parámetro — el bug era que no aceptaba ninguno", () => {
    const m = fuente.match(/const\s+ejecutarAnulacion\s*=\s*async\s*\(([^)]*)\)/);
    expect(m, "no se encuentra `ejecutarAnulacion`").toBeTruthy();
    expect(m[1].trim(), "vuelve a no aceptar el motivo (el bug de los 148 días)").not.toBe("");
  });

  it("⭐ el body de la petición NO manda un literal vacío", () => {
    // Captura la llamada de anular completa, con su objeto de body.
    const m = fuente.match(/api\.post\(\s*`\/facturas\/anular\/[^`]*`\s*,\s*\{([\s\S]{0,220}?)\}\s*\)/);
    expect(m, "no se encuentra la llamada de anular").toBeTruthy();
    const body = m[1];
    expect(body).toMatch(/motivo/);
    // El mutante exacto: `motivo: ""` o `motivo: ''`.
    expect(body, "vuelve a hardcodear el motivo vacío").not.toMatch(/motivo\s*:\s*(""|'')/);
  });

  it("⭐ el modal de anulación recibe `placeholder` — sin él no se pinta el input", () => {
    // Se ancla en el modal de ANULACIÓN (por su `titulo`) y se lee hasta su cierre, sin
    // ventana fija: los comentarios de dentro del JSX pueden crecer.
    const i = fuente.indexOf('titulo="Confirmar anulación"');
    expect(i, "no se encuentra el modal de anulación").toBeGreaterThan(-1);
    const bloque = fuente.slice(i, fuente.indexOf("/>", i) + 2);
    expect(bloque, "sin placeholder el modal no pinta input y el motivo vuelve a ser inalcanzable")
      .toMatch(/placeholder\s*=/);
    expect(bloque, "el modal debe entregar el valor a ejecutarAnulacion")
      .toMatch(/onConfirm\s*=\s*\{\s*ejecutarAnulacion\s*\}/);
  });
});
