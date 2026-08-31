// EditProducts.iva.test.jsx
//
// FR-01 · IVA POR PRODUCTO — la mitad de panel que faltaba.
//
// El backend soporta `Producto.iva` DESDE SIEMPRE (`Producto.schema.js:222`, `default: 10`,
// y el zod de edición lo acepta en `productos.schemas.js:75` y `:129`). Pero el panel sólo
// dejaba tocarlo EN BLOQUE por categoría (`components/Iva/IvaPanel.jsx`): si un producto
// necesitaba un IVA distinto al de sus hermanos —una botella de vino dentro de una categoría
// de comida, por ejemplo— no había forma de arreglarlo desde la ficha.
//
// ⚠️ POR QUÉ ESTE TEST AFIRMA SOBRE EL PAYLOAD Y NO SOBRE EL ESTADO INTERNO
// Porque el eslabón que se rompe es ése. `handleSubmit` construye el `payload` CLAVE A CLAVE
// y en 2026-07 se quedó sin `activo`: el dueño ocultaba un producto, salía 200 OK y seguía en
// la carta durante un mes en los dos clientes de pago. Es la cicatriz de
// `EditProducts.visibilidad.test.jsx`, y añadir un campo nuevo corre exactamente el mismo
// riesgo. Este fichero copia ese arnés a propósito.

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


const PRODUCTO_IVA21 = { ...PRODUCTO_BASE, _id: "665f000000000000000000bb", nombre: "Vino de la casa", iva: 21 };
const PRODUCTO_SIN_IVA = { ...PRODUCTO_BASE, _id: "665f000000000000000000cc", nombre: "Plato antiguo" };

const selectIva = () => screen.getByLabelText(/IVA aplicable/i);

async function guardar(user) {
  await user.click(screen.getByRole("button", { name: /guardar cambios/i }));
}

function renderModal(producto = PRODUCTO_BASE) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const utils = render(<EditProduct product={producto} onSave={onSave} onCancel={vi.fn()} />);
  return { onSave, ...utils };
}

/**
 * D-114 · claves de React duplicadas en el selector de variante.
 * Vive en este fichero, y no en uno propio, porque comparte el MISMO arnés de mocks (60
 * líneas) y el mismo componente. Duplicar el arnés sólo para un caso es la clase de copia
 * que acaba divergiendo (Art. 6).
 */
describe("modal editar producto — D-114 · claves duplicadas", () => {
  it("🔴 dos variantes SIN clave no pueden compartir key de React", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Dos variantes recién añadidas: `normalizePrecios` deja `clave: ""` en las dos.
    renderModal({
      ...PRODUCTO_BASE,
      precios: [
        { clave: "", label: "", precio: 10, orden: 0 },
        { clave: "", label: "", precio: 12, orden: 1 },
      ],
    });
    const duplicadas = spy.mock.calls
      .map((c) => String(c[0] ?? ""))
      .filter((m) => /same key|misma key|two children with the same/i.test(m));
    spy.mockRestore();
    expect(duplicadas, `React avisó de keys duplicadas: ${duplicadas[0] ?? ""}`).toHaveLength(0);
  });
});

describe("modal editar producto — IVA por producto", () => {
  beforeEach(() => vi.clearAllMocks());

  it("🔴 IVA-1 · el selector existe y muestra el IVA que YA tiene el producto", () => {
    renderModal(PRODUCTO_IVA21);
    expect(selectIva(), "sin este campo el dueño no puede corregir un IVA suelto").toBeTruthy();
    expect(selectIva().value).toBe("21");
  });

  it("🔴 IVA-2 · al cambiarlo, el payload guardado lleva el IVA nuevo", async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal(PRODUCTO_BASE);

    await user.selectOptions(selectIva(), "21");
    await guardar(user);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const payload = onSave.mock.calls[0][0];
    // El eslabón que se rompió con `activo`: la clave tiene que EXISTIR y ser un número.
    expect(payload).toHaveProperty("iva", 21);
    expect(typeof payload.iva, "el backend valida `z.coerce.number()` sobre [0,4,10,21]").toBe("number");
  });

  it("IVA-3 · un producto SIN `iva` usa el default del schema (10) y viaja como 10", async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal(PRODUCTO_SIN_IVA);
    expect(selectIva().value, "el default es el mismo que `Producto.schema.js:222`").toBe("10");

    await guardar(user);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toHaveProperty("iva", 10);
  });

  it("🪤 CEPO · añadir el IVA no puede haberse cargado la visibilidad", async () => {
    // El payload se construye clave a clave: tocar ese objeto es justo donde se pierden campos.
    // Sin este cepo, un merge desafortunado podría reintroducir el bug de 2026-07 sin avisar.
    const user = userEvent.setup();
    const { onSave } = renderModal(PRODUCTO_BASE);
    await guardar(user);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const payload = onSave.mock.calls[0][0];
    expect(payload).toHaveProperty("activo", true);
    expect(payload).toHaveProperty("precios");
    expect(payload).toHaveProperty("iva");
  });

  it("🪤 CEPO · sólo se ofrecen los 4 tipos que el backend acepta", () => {
    renderModal(PRODUCTO_BASE);
    const valores = Array.from(selectIva().querySelectorAll("option")).map((o) => o.value);
    // `productos.schemas.js:75` rechaza con 400 cualquier otro valor. Ofrecer un 5º tipo sería
    // enseñarle al dueño una opción que revienta al guardar.
    expect(valores.sort()).toEqual(["0", "10", "21", "4"]);
  });
});
