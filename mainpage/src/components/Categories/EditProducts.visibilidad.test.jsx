// EditProducts.visibilidad.test.jsx
//
// REGRESSION-LOCK del toggle "Visible en carta" del modal de editar producto.
//
// Historia del bug (2026-08-02): el commit cb1def2 (2026-07-01) migró el toggle
// del vocabulario legacy `estado:"habilitado"|"deshabilitado"` al campo real de
// visibilidad `activo` (boolean)… pero solo en el binding del checkbox. El objeto
// `payload` de handleSubmit se construye clave a clave y se quedó SIN `activo`.
// Resultado, durante un mes en producción (Zabor-Fetén y Bodegón Argentino):
// desmarcabas "Visible en carta", el modal decía "Oculto", guardabas, salía 200 OK
// … y el producto seguía apareciendo en la carta, porque el campo nunca viajaba.
//
// El backend no puede protegerse de esto: si el campo no llega, no llega. La única
// red posible es esta — comprobar que lo que el modal ENTREGA al guardar incluye
// de verdad la decisión de visibilidad del dueño.
//
// Por eso el test afirma sobre el payload que recibe `onSave`, no sobre el estado
// interno del componente: es exactamente el eslabón que se rompió.

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/* ---------- mocks de contexto/infra: el test aísla el modal ---------- */
vi.mock("../../hooks/useLocale", () => ({
  useLocale: () => ({ currencySymbol: "€" }),
}));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { rol: "admin" } }),
}));
vi.mock("../../context/CategoriasContext", () => ({
  useCategorias: () => ({ categoryObjectsByTipo: {}, fetchCategoryObjects: vi.fn() }),
}));
vi.mock("../../context/FeaturesPlanContext", () => ({
  useFeaturesPlan: () => ({ hasFeature: () => true }),
}));
vi.mock("../../context/ProductosContext", () => ({
  ProductosContext: React.createContext({ productos: [], cargarProductos: vi.fn() }),
}));
vi.mock("../../hooks/useImageUpload", () => ({
  useImageUpload: () => ({
    dragging: false,
    onDragOver: vi.fn(),
    onDragLeave: vi.fn(),
    onDrop: vi.fn(),
    onFileChange: vi.fn(),
  }),
}));
vi.mock("../../utils/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

/* ---------- stubs de subcomponentes pesados e irrelevantes aquí ---------- */
vi.mock("./PreciosHelpModal", () => ({ default: () => null }));
// ⚠️ MERGE main + fix/inputs-numericos: estos dos módulos ya no exportan solo el
// componente — exportan además los normalizadores (`normalizarAdicionales`,
// `normalizarComponentes`, `normalizarSeleccionables`) que EditProducts llama en
// handleSubmit. Si el mock los borra, el submit revienta con "is not a function"
// y este regression-lock se cae por una razón que no es la que vigila.
// Por eso se conserva el módulo real y solo se stubea el componente pesado.
vi.mock("./AdicionalesEditor", async (importOriginal) => ({
  ...(await importOriginal()),
  default: () => null,
}));
vi.mock("./CompuestosEditor", async (importOriginal) => ({
  ...(await importOriginal()),
  default: () => null,
}));
vi.mock("./AlergenosSelector", () => ({ default: () => null }));
vi.mock("../AlefSelect/AlefSelect", () => ({ default: () => null }));
vi.mock("../AlertaMensaje/AlertaMensaje", () => ({ default: () => null }));

const EditProduct = (await import("./EditProducts")).default;

const PRODUCTO_BASE = {
  _id: "665f000000000000000000aa",
  nombre: "Pincho de pluma",
  descripcion: "",
  categoria: "Carnes",
  tipo: "plato",
  activo: true,
  estado: "habilitado",
  canales: ["sala", "takeaway", "delivery"],
  precios: [{ clave: "precioBase", label: "Precio", precio: 14, coste: 4, orden: 0 }],
  traducciones: {},
  adicionales: [],
  aliases: [],
  alergenos: [],
};

/** El label de visibilidad del PRODUCTO (hay otros toggles y otro "Visible en carta" en precios). */
function toggleVisibilidad(container) {
  const label = Array.from(container.querySelectorAll("label")).find((l) =>
    l.textContent.trim().startsWith("Visible en carta:")
  );
  if (!label) throw new Error('No se encontró el label "Visible en carta:" del producto');
  return within(label).getByRole("checkbox");
}

async function guardar(user) {
  await user.click(screen.getByRole("button", { name: /guardar cambios/i }));
}

function renderModal(producto = PRODUCTO_BASE) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const utils = render(
    <EditProduct product={producto} onSave={onSave} onCancel={vi.fn()} />
  );
  return { onSave, ...utils };
}

describe('modal editar producto — toggle "Visible en carta"', () => {
  beforeEach(() => vi.clearAllMocks());

  it("EL BUG: al ocultar, el payload guardado incluye activo:false", async () => {
    const user = userEvent.setup();
    const { onSave, container } = renderModal();

    const toggle = toggleVisibilidad(container);
    expect(toggle).toBeChecked();

    await user.click(toggle);
    expect(toggle).not.toBeChecked();

    await guardar(user);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const payload = onSave.mock.calls[0][0];

    // El eslabón que se rompió: la clave tiene que EXISTIR y valer false.
    expect(payload).toHaveProperty("activo", false);
  });

  it("al volver a mostrarlo, el payload incluye activo:true", async () => {
    const user = userEvent.setup();
    const { onSave, container } = renderModal({ ...PRODUCTO_BASE, activo: false });

    const toggle = toggleVisibilidad(container);
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    await guardar(user);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toHaveProperty("activo", true);
  });

  it("si no se toca el toggle, se conserva la visibilidad que tenía el producto", async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal({ ...PRODUCTO_BASE, activo: false });

    await guardar(user);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    // Guardar cualquier otro campo NO debe re-publicar un producto oculto.
    expect(onSave.mock.calls[0][0]).toHaveProperty("activo", false);
  });

  it("el toggle refleja el estado inicial del producto (lee el mismo campo que escribe)", async () => {
    // El bug original tenía init y submit desalineados; que lean/escriban el
    // mismo campo es lo que hace que reabrir el modal muestre la verdad.
    const { container, unmount } = renderModal({ ...PRODUCTO_BASE, activo: false });
    expect(toggleVisibilidad(container)).not.toBeChecked();
    unmount();

    const { container: c2 } = renderModal({ ...PRODUCTO_BASE, activo: true });
    expect(toggleVisibilidad(c2)).toBeChecked();
  });

  it("la visibilidad NO se manda por el campo `estado` (eso es stock, no decisión del dueño)", async () => {
    const user = userEvent.setup();
    const { onSave, container } = renderModal();

    await user.click(toggleVisibilidad(container));
    await guardar(user);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const payload = onSave.mock.calls[0][0];

    // `estado` solo admite 'habilitado'|'agotado'. Si alguien vuelve a colar
    // "deshabilitado" aquí, el enum de Mongoose lo rechaza y el guardado peta.
    expect(payload.estado).not.toBe("deshabilitado");
  });

  it("ocultar un producto agotado no le cambia el estado de stock", async () => {
    const user = userEvent.setup();
    const { onSave, container } = renderModal({ ...PRODUCTO_BASE, estado: "agotado" });

    await user.click(toggleVisibilidad(container));
    await guardar(user);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const payload = onSave.mock.calls[0][0];

    expect(payload.activo).toBe(false);
    expect(payload.estado).toBe("agotado");
  });
});
