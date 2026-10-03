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

const api = (await import("../../utils/api")).default;
const nombres = ["Harina Cabodi", "Harina panera", "Agua", "Sal", "Aceite de oliva", "Aceite de girasol", "Levadura seca", "Muzzarella", "Salsa de tomate"];
const cantidades = [106.11789, 106.11789, 152.809761, 6.367073, 3.265166, 4.897749, 0.424472, 180, 100];
const ingredientes = nombres.map((nombre, i) => ({ _id: `ingrediente-${i}`, nombre, unidad: "g" }));
const producto = {
  _id: "pizza", nombre: "Pizza Muzzarella", categoria: "Pizzas", tipo: "plato",
  precios: [{ clave: "precioBase", label: "Precio", precio: 10000, coste: 0, factorStock: 1 }],
  receta: ingredientes.map((ing, i) => ({ ingrediente: ing._id, nombre: ing.nombre, cantidad: cantidades[i], unidad: "g", clavePrecio: "precioBase" })),
};
function modal(p = producto) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  return { ...render(<EditProduct product={p} onSave={onSave} onCancel={vi.fn()} />), onSave };
}
beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockImplementation(async (url) => ({ data: url === "/stock/ingredientes" ? { ingredientes, totalPages: 1 } : [] }));
});
describe("receta en el editor real, sin prop ingredientesStock", () => {
  it("carga los nueve ingredientes y muestra cantidades legibles sin cambiar la precisión al guardar", async () => {
    const entrada = { ...producto, receta: producto.receta.map(x => ({ ...x, nombre: "Nombre histórico" })) };
    const { container, onSave } = modal(entrada);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/stock/ingredientes", { params: { page: 1, limit: 50 } }));
    await waitFor(() => expect(container.querySelectorAll(".receta-nombre--crear")).toHaveLength(9));
    await waitFor(() => expect([...container.querySelectorAll(".receta-nombre--crear")].map(x => x.textContent)).toEqual(nombres));
    expect([...container.querySelectorAll(".receta-cant--crear")].map(x => x.textContent.trim())).toEqual(["106.12 g", "106.12 g", "152.81 g", "6.37 g", "3.27 g", "4.9 g", "0.42 g", "180 g", "100 g"]);
    expect(screen.queryByText("Ingrediente eliminado")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].receta).toEqual(entrada.receta);
  });
  it("resuelve un ingrediente de la segunda página y referencias pobladas", async () => {
    api.get.mockImplementation(async (url, opts) => ({ data: url !== "/stock/ingredientes" ? [] : {
      ingredientes: opts.params.page === 1 ? Array.from({ length: 50 }, (_, i) => ({ _id: `otro-${i}`, nombre: `Otro ${i}`, unidad: "g" })) : [{ _id: "tardio", nombre: "Harina página dos", unidad: "kg" }], totalPages: 2,
    } }));
    modal({ ...producto, receta: [{ ingrediente: { _id: "tardio" }, cantidad: 0.123456 }] });
    expect(await screen.findByText("Harina página dos")).toBeInTheDocument();
    expect(screen.getByText("0.12 kg")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/stock/ingredientes", { params: { page: 2, limit: 50 } });
  });
  it("un error de carga no convierte los ingredientes en eliminados y permite reintentar", async () => {
    api.get.mockImplementation(async (url) => { if (url === "/stock/ingredientes") throw new Error("offline"); return { data: [] }; });
    modal();
    expect(await screen.findByText(/No se pudieron cargar los ingredientes/)).toBeInTheDocument();
    expect(screen.getByText("Harina Cabodi")).toBeInTheDocument();
    expect(screen.queryByText("Ingrediente eliminado")).not.toBeInTheDocument();
    api.get.mockImplementation(async (url) => ({ data: url === "/stock/ingredientes" ? { ingredientes, totalPages: 1 } : [] }));
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(screen.queryByText(/No se pudieron cargar los ingredientes/)).not.toBeInTheDocument());
  });
  it("una referencia ausente sin snapshot se indica como no disponible tras completar la carga", async () => {
    modal({ ...producto, receta: [{ ingrediente: "ausente", cantidad: 1, unidad: "g" }] });
    expect(await screen.findByText("Ingrediente no disponible")).toBeInTheDocument();
  });
});
