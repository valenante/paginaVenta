/**
 * D-85 · RED — «GESTIÓN DE IVA» NO PUEDE CANTAR ÉXITO SI NO HA CAMBIADO NADA.
 *
 * ── EL BUG ──────────────────────────────────────────────────────────────────────────────
 * `IvaPanel.guardar()` hacía:
 *
 *     await api.put("/productos/bulk-iva", { categoria, iva, tipo: tab });
 *     setToast({ ok: true, msg: `${categoria} actualizado a IVA ${iva}%` });
 *
 * La respuesta se tiraba entera. El backend SÍ devuelve el dato que lo delata
 * —`actualizados: result.modifiedCount` (`productosController.js` → `bulkAsignarIva`)— y nadie
 * lo leía. El filtro del `updateMany` es igualdad de dos strings que nadie normaliza igual: el
 * zod hace `.trim()` sobre la categoría entrante y `Producto.categoria` no declara `trim: true`,
 * y el `tipo` sale de la PESTAÑA activa, no de la fila. Si casa 0 documentos: HTTP 200,
 * `actualizados: 0`, **toast verde**, y el usuario se va convencido de haber cambiado el IVA de
 * su carta.
 *
 * Zona fiscal ⇒ Art. 5: un 0 tiene que GRITAR. Lo contrario es fail-silent.
 *
 * ⚠️ Esto NO causó el incidente del 24-ago (allí el update sí casó 2 productos). Es el fallo
 * que habría hecho invisible un fallo real.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));
vi.mock("../utils/api.js", () => ({ default: api }));

import IvaPanel from "../components/Iva/IvaPanel.jsx";

/** Una categoría de platos con 3 productos al 10 %. */
const RESUMEN = [{ categoria: "Cervezas", productos: 3, iva: 10, tipo: "plato", mixto: false }];

async function abrirYAplicar(nuevoIva = "21") {
  const user = userEvent.setup();
  render(<IvaPanel />);
  await screen.findByText("Cervezas");
  await user.click(screen.getByRole("button", { name: /cambiar|editar/i }));
  // ⚠️ Hay que MOVER el selector: sin esto se aplica el IVA que ya tenía y el test mide otra cosa.
  await user.selectOptions(await screen.findByRole("combobox"), nuevoIva);
  await user.click(await screen.findByRole("button", { name: /aplicar/i }));
  return user;
}

describe("D-85 · el panel de IVA dice la verdad sobre lo que ha cambiado", () => {
  beforeEach(() => {
    api.get.mockReset(); api.put.mockReset();
    api.get.mockResolvedValue({ data: { data: RESUMEN } });
  });

  it("R1 · si el backend cambió 0 productos, NO puede salir un toast de éxito", async () => {
    api.put.mockResolvedValue({ data: { data: { categoria: "Cervezas", iva: 21, actualizados: 0 } } });
    await abrirYAplicar();

    const toast = await waitFor(() => {
      const el = document.querySelector(".iva-toast");
      expect(el).toBeTruthy();
      return el;
    });

    expect(toast.className,
      "0 productos actualizados con un toast verde es exactamente cómo un cambio fiscal se pierde en silencio"
    ).not.toContain("iva-toast--ok");
    expect(toast.textContent, "y tiene que decir que fueron CERO").toMatch(/0|ning[uú]n/i);
  });

  it("R2 · si cambió productos de verdad, sí es éxito (no romper el camino bueno)", async () => {
    api.put.mockResolvedValue({ data: { data: { categoria: "Cervezas", iva: 21, actualizados: 3 } } });
    await abrirYAplicar();

    const toast = await waitFor(() => {
      const el = document.querySelector(".iva-toast");
      expect(el).toBeTruthy();
      return el;
    });
    expect(toast.className, "un aviso que salta también cuando todo va bien se ignora en una semana").toContain("iva-toast--ok");
    expect(toast.textContent).toMatch(/3/);
  });

  it("R3 · si el backend no informa del recuento, no se inventa un éxito rotundo", async () => {
    // Backend viejo o respuesta inesperada: no se sabe. «No lo sé» no es «está bien».
    api.put.mockResolvedValue({ data: { data: { categoria: "Cervezas", iva: 21 } } });
    await abrirYAplicar();

    const toast = await waitFor(() => {
      const el = document.querySelector(".iva-toast");
      expect(el).toBeTruthy();
      return el;
    });
    // No se afirma que hayan cambiado N productos cuando el backend no lo ha dicho.
    expect(toast.className,
      "sin recuento no hay confirmacion rotunda: «no lo se» no es «esta bien»"
    ).not.toContain("iva-toast--ok");
  });
});
