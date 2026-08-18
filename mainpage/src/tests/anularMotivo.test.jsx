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
const fuenteFacturas = fs.readFileSync(path.join(RAIZ, "pages/FacturasPage.jsx"), "utf8");

/** Las props EXACTAS con las que `FacturasPage.jsx` invoca el modal al anular. */
const propsDeAnulacion = (onConfirm) => ({
  titulo: "Confirmar anulación",
  mensaje: "Vas a anular la factura Nº 2026-0001. Esta acción no se puede deshacer.",
  placeholder: "Motivo de la anulación",
  onConfirm,
  onClose: () => {},
});

describe("ModalConfirmacion · el eslabón que rompió «Anular»", () => {
  it("⭐ CON `placeholder` PINTA el input — sin esto no hay dónde escribir el motivo", () => {
    render(<ModalConfirmacion {...propsDeAnulacion(vi.fn())} />);
    expect(screen.getByPlaceholderText("Motivo de la anulación")).toBeInTheDocument();
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

    fireEvent.change(screen.getByPlaceholderText("Motivo de la anulación"), {
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
    fireEvent.change(screen.getByPlaceholderText("Motivo de la anulación"), {
      target: { value: "  Error al emitir  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(onConfirm).toHaveBeenCalledWith("Error al emitir");
  });

  it("sin `valorRequerido` dejarlo vacío SIGUE siendo válido — los otros 27 consumidores", () => {
    const onConfirm = vi.fn();
    render(<ModalConfirmacion {...propsDeAnulacion(onConfirm)} />);
    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(onConfirm).toHaveBeenCalledWith("");
  });
});

/* ════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ Art. 7 · EL ENFORCEMENT — SÍ→NO, autorizado por Valen el 2026-08-13
 *
 * ANTES se podía confirmar la anulación con el motivo vacío; AHORA no. Es un cambio que
 * EMPIEZA A DECIR QUE NO, y por eso lleva prop OPT-IN con default `false`: el modal tiene
 * 28 consumidores y 27 no deben enterarse de nada (Art. 3).
 *
 * ⚠️ EL BACKEND SIGUE ACEPTANDO EL VACÍO, y no debe cambiarse: `alefShops` llama sin body
 * y la app móvil puede mandar "". La obligación es de PRODUCTO, no de contrato.
 * ════════════════════════════════════════════════════════════════════════════════════ */
describe("ModalConfirmacion · valorRequerido (el enforcement)", () => {
  const conRequerido = (onConfirm) => ({ ...propsDeAnulacion(onConfirm), valorRequerido: true });

  it("⭐ con el campo VACÍO el botón está deshabilitado", () => {
    render(<ModalConfirmacion {...conRequerido(vi.fn())} />);
    expect(screen.getByRole("button", { name: "Aceptar" })).toBeDisabled();
  });

  it("⭐ con el campo vacío, hacer clic NO confirma", () => {
    const onConfirm = vi.fn();
    render(<ModalConfirmacion {...conRequerido(onConfirm)} />);
    const boton = screen.getByRole("button", { name: "Aceptar" });

    // Se intenta incluso quitando el atributo a mano, como haría alguien desde las devtools.
    boton.removeAttribute("disabled");
    fireEvent.click(boton);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  /**
   * ⚠️⚠️ MUTANTE QUE SOBREVIVE, DECLARADO (Art. 9 · Art. 4c).
   *
   * `manejarConfirmacion` lleva un `if (bloqueado) return;` además del `disabled` del
   * botón. **Ese guard NO está cubierto por ningún test, y no se puede cubrir desde el
   * DOM**: React no despacha eventos sobre elementos cuyas props dice que están
   * `disabled`, aunque se quite el atributo del DOM a mano. El clic nunca llega al
   * handler, así que borrar el `if` deja esta suite en verde. MEDIDO, no supuesto.
   *
   * Se CONSERVA igualmente porque protege del refactor probable: el día que alguien quite
   * el `disabled` del botón —por diseño, por accesibilidad o por descuido— el guard es lo
   * único que impide confirmar una anulación sin motivo. Es cinturón, no tirantes.
   *
   * Para cubrirlo haría falta un test de integración con navegador real (Playwright), que
   * este repo no tiene. Queda anotado en vez de fingir que está protegido.
   */
  it.skip("[NO CUBIERTO] el guard del handler por sí solo — React no deja llegar el clic", () => {});

  it("⭐ al escribir un motivo se habilita y confirma", () => {
    const onConfirm = vi.fn();
    render(<ModalConfirmacion {...conRequerido(onConfirm)} />);
    const input = screen.getByPlaceholderText("Motivo de la anulación");
    fireEvent.change(input, { target: { value: "Factura duplicada" } });
    expect(screen.getByRole("button", { name: "Aceptar" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(onConfirm).toHaveBeenCalledWith("Factura duplicada");
  });

  it("⚠️ SOLO espacios NO cuenta como motivo — misma idea de «vacío» que el backend", () => {
    const onConfirm = vi.fn();
    render(<ModalConfirmacion {...conRequerido(onConfirm)} />);
    fireEvent.change(screen.getByPlaceholderText("Motivo de la anulación"), {
      target: { value: "     " },
    });
    expect(screen.getByRole("button", { name: "Aceptar" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("⚠️ CONTROL · el default es `false`: sin la prop, los otros 27 consumidores siguen igual", () => {
    render(<ModalConfirmacion titulo="x" mensaje="y" onConfirm={vi.fn()} onClose={() => {}} />);
    expect(screen.getByRole("button", { name: "Aceptar" })).toBeEnabled();
  });

  it("⭐ FacturasPage ACTIVA el enforcement en el modal de anulación", () => {
    const i = fuenteFacturas.indexOf('titulo="Confirmar anulación"');
    const bloque = fuenteFacturas.slice(i, fuenteFacturas.indexOf("/>", i) + 2);
    expect(bloque, "se perdió el enforcement autorizado").toMatch(/valorRequerido/);
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
