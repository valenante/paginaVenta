/**
 * CategoriasPanel.modales.test.jsx — los confirmatorios usan el componente COMPARTIDO.
 *
 * ⚖️ Art. 6 (una sola fuente de verdad) · Art. 4 (una red que sepa ponerse roja).
 *
 * `CategoriasPanel` era el ÚNICO de los ~30 confirmatorios del panel que se pintaba su
 * propio modal a mano (`catconfirm-card`, `catmodal-btn`…). Se veía distinto al de borrar
 * un extra, un proveedor o una imagen de la carta, que sí usan `ModalConfirmacion`.
 * Lo detectó Valen mirando la pantalla, no un test — por eso ahora hay uno.
 *
 * ⚠️ Lo que este fichero protege de verdad NO es el aspecto: es que al migrar el modal
 * **no se pierda el mensaje de error del backend**. Ese texto es el 409 CATEGORIA_EN_USO
 * («No se puede eliminar: N producto(s) usan esta categoría»), que es lo único que le dice
 * al dueño POR QUÉ no puede borrar. Vive ahora en el slot `children`.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ModalConfirmacion from "../Modal/ModalConfirmacion";

const CLASES_PROPIAS = ["catconfirm-card", "catconfirm-title", "catconfirm-msg", "catmodal-actions", "catmodal-btn"];

describe("CategoriasPanel · los confirmatorios ya no van por libre", () => {
  it("🔴 el fichero NO vuelve a pintar su propio modal de confirmación", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/Categories/CategoriasPanel.jsx"), "utf8");

    // Se miran las clases del CONFIRMATORIO. `catmodal-error` y `catmodal-overlay` NO están
    // en la lista: la primera sigue usándose para el error dentro del modal compartido, y la
    // segunda la usan los modales de FORMULARIO (CategoriaFormModal, ExtraFormModal), que no
    // son confirmaciones y no se tocan.
    // Se busca el MARCADO real (`className="..."`), no una mención: el comentario que
    // explica por qué se migró nombra esas clases a propósito, y perder esa explicación por
    // una regex demasiado ancha sería cambiar documentación por verde.
    for (const clase of CLASES_PROPIAS) {
      const usoReal = new RegExp(`className=["\`][^"\`]*\\b${clase}\\b`);
      expect(usoReal.test(src), `sigue habiendo modal a mano: ${clase}`).toBe(false);
    }
    // Y los DOS confirmatorios —categoría y producto— pasan por el compartido.
    expect((src.match(/<ModalConfirmacion/g) || []).length).toBe(2);
  });

  it("🔴 el modal compartido cuelga de `body`, no del panel que lo abre", () => {
    // MEDIDO en staging el 31-ago: sin portal, un ancestro con `overflow: hidden`
    // (`SECTION.products-content-card--productos`) RECORTA el overlay `position: fixed`.
    // El de «Eliminar extra» salía en `top 238 · left 27 · 1852×379` sobre un viewport de
    // 1920×941: descolocado y cortado. Ninguno de los ~29 consumidores lo envolvía en Portal,
    // así que el arreglo vive dentro del componente y este caso vigila que siga ahí.
    const { container } = render(
      <div style={{ overflow: "hidden" }}>
        <ModalConfirmacion titulo="T" mensaje="M" onConfirm={vi.fn()} onClose={vi.fn()} />
      </div>
    );
    // Si NO se portaliza, el overlay estaría dentro de `container` (el div que lo recorta).
    expect(container.querySelector(".modal-overlay--modalconfirmacion"),
      "el overlay no puede quedarse dentro del contenedor que lo recorta").toBeNull();
    const overlay = document.body.querySelector(".modal-overlay--modalconfirmacion");
    expect(overlay, "tiene que existir, colgando de body").toBeTruthy();
    expect(overlay.parentElement, "y su padre directo es body").toBe(document.body);
  });

  it("🪤 CEPO · el modal compartido SÍ pinta el error del backend que se le pasa", () => {
    // Si `ModalConfirmacion` dejara de renderizar `children`, el 409 desaparecería de la
    // pantalla y el dueño volvería a ver un modal que no explica nada. Es exactamente el
    // eslabón que la migración podía romper en silencio.
    render(
      <ModalConfirmacion
        titulo="Eliminar categoría"
        mensaje="¿Seguro?"
        textoConfirmar="Eliminar"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      >
        <div className="catmodal-error">No se puede eliminar: 8 producto(s) usan esta categoría.</div>
      </ModalConfirmacion>
    );
    expect(screen.getByText(/8 producto\(s\) usan esta categoría/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeTruthy();
  });
});
