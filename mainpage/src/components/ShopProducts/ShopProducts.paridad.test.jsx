/**
 * ShopProducts.paridad.test.jsx — Gestor de productos de TIENDA frente a la Carta de RESTAURANTE.
 *
 * Referencia de restaurante (lo que la tienda tiene que parecer y comportarse igual):
 *   - cabecera y página:  pages/ProductsMenu.jsx ("Gestor de productos")
 *   - lista y productos:  components/Categories/CategoriasPanel.jsx (catpanel-*)
 *   - modales de producto: components/Categories/CrearProducto.jsx y EditProducts.jsx
 *   - errores en modal:   components/AlertaMensaje + clase catmodal-error
 *
 * Dos bloques, a propósito:
 *   - CONTRATO (verde hoy): el cuerpo que sale hacia la API de tienda NO cambia. Es la red que
 *     obliga a que la paridad sea de presentación y de estados, nunca de datos.
 *   - PARIDAD (rojo hoy): textos, clases y estados que hoy no coinciden con la carta, o fallos
 *     reales (estado inventado, errores tragados, categorías que no se refrescan).
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "../../utils/api";
import { ShopCategoriasProvider } from "../../context/ShopCategoriasContext";
import ProductosPageShop from "../../pages/ProductosPageShop";

vi.mock("../../utils/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock("../../hooks/useLocale", () => ({
  useLocale: () => ({
    formatMoney: (n) => `${Number(n).toFixed(2)} €`,
    currencySymbol: "€",
  }),
}));

vi.mock("../../context/TenantContext.jsx", () => ({
  useTenant: () => ({ tenantId: "molo" }),
}));

const CATEGORIAS_URL = "/shop/productos/categorias";
const PRODUCTOS_URL = "/shop/productos";

const producto = (over = {}) => ({
  _id: "p1",
  nombre: "Detergente 1L",
  categoria: "limpieza",
  itemType: "producto",
  activo: true,
  sku: "LIM-DET-001",
  barcode: "8412345678901",
  precios: { venta: 3.5, oferta: null, coste: null },
  inventario: {
    gestionaStock: true,
    stock: 30,
    stockMinimo: 10,
    stockCritico: 3,
    stockMaximo: 100,
    unidadMedida: "ud",
    permiteDecimal: false,
  },
  ...over,
});

// Respuestas de la API de tienda. Cada test puede sustituir una de ellas.
function catalogo({
  categorias = ["limpieza"],
  productos = [producto()],
  getCategorias,
  getProductos,
} = {}) {
  api.get.mockImplementation(async (url, cfg = {}) => {
    if (url === CATEGORIAS_URL) {
      if (getCategorias) return getCategorias();
      return { data: { categories: categorias } };
    }
    if (url === PRODUCTOS_URL) {
      if (getProductos) return getProductos();
      const cat = cfg?.params?.category;
      return { data: { products: productos.filter((p) => p.categoria === cat) } };
    }
    throw new Error(`GET no esperado: ${url}`);
  });
}

function renderPantalla() {
  return render(
    <ShopCategoriasProvider>
      <ProductosPageShop />
    </ShopCategoriasProvider>
  );
}

// Entra en una categoría desde la lista. La fila es el botón con el nombre de la categoría.
async function abrirCategoria(nombre) {
  const user = userEvent.setup();
  const fila = await screen.findByRole("button", { name: new RegExp(nombre) });
  await user.click(fila);
  return user;
}

const botonSubmit = () => document.querySelector("form button[type='submit']");

// Rellena el formulario de alta/edición con los campos obligatorios.
async function rellenarAlta(user, { nombre, categoria, precio }) {
  await user.type(document.querySelector("input[name='nombre']"), nombre);
  await user.type(document.querySelector("input[name='categoria']"), categoria);
  await user.type(document.querySelector("input[name='precio']"), precio);
}

beforeEach(() => {
  vi.resetAllMocks();
});

/* =====================================================================
   CONTRATO · verde hoy, tiene que seguir verde
   ===================================================================== */
describe("CONTRATO · lo que sale hacia la API de tienda no cambia", () => {
  it("consulta de categorías y de productos: mismos parámetros", async () => {
    catalogo();
    renderPantalla();
    const user = await abrirCategoria("limpieza");
    await screen.findByText("Detergente 1L");

    expect(api.get).toHaveBeenCalledWith(CATEGORIAS_URL, { params: {} });
    expect(api.get).toHaveBeenCalledWith(
      PRODUCTOS_URL,
      expect.objectContaining({
        params: expect.objectContaining({ type: "producto", category: "limpieza" }),
      })
    );
    expect(user).toBeTruthy();
  });

  it("alta desde la cabecera: POST /shop/productos con el mismo cuerpo", async () => {
    catalogo({ categorias: ["limpieza"] });
    api.post.mockResolvedValue({ data: {} });
    renderPantalla();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /Nuevo producto/ }));
    await rellenarAlta(user, { nombre: "Pilas AA", categoria: "bebidas", precio: "1.2" });
    await user.type(document.querySelector("input[name='stockActual']"), "5");
    await user.type(document.querySelector("input[name='stockMinimo']"), "2");
    await user.type(document.querySelector("input[name='stockCritico']"), "1");
    await user.click(botonSubmit());

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(api.post).toHaveBeenCalledWith("/shop/productos", {
      nombre: "Pilas AA",
      categoria: "bebidas",
      sku: "",
      barcode: "",
      itemType: "producto",
      precios: { venta: 1.2, oferta: null, coste: null },
      inventario: {
        gestionaStock: true,
        stock: 5,
        stockMinimo: 2,
        stockCritico: 1,
        stockMaximo: null,
        unidadMedida: "ud",
        permiteDecimal: false,
      },
    });
  });

  it("edición de un producto: PUT /shop/productos/:id con el mismo cuerpo", async () => {
    catalogo();
    api.put.mockResolvedValue({ data: {} });
    renderPantalla();
    const user = await abrirCategoria("limpieza");

    await user.click(await screen.findByRole("button", { name: "Editar" }));
    await user.click(botonSubmit());

    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
    expect(api.put).toHaveBeenCalledWith("/shop/productos/p1", {
      _id: "p1",
      nombre: "Detergente 1L",
      categoria: "limpieza",
      sku: "LIM-DET-001",
      barcode: "8412345678901",
      codigoBarras: "8412345678901",
      precios: { venta: 3.5, oferta: null, coste: null },
      inventario: {
        gestionaStock: true,
        stock: 30,
        stockMinimo: 10,
        stockCritico: 3,
        stockMaximo: 100,
        unidadMedida: "ud",
        permiteDecimal: false,
      },
    });
  });

  it("edición de un servicio: el cuerpo NO lleva inventario", async () => {
    catalogo({
      categorias: ["servicios"],
      productos: [producto({ _id: "s1", nombre: "Corte", categoria: "servicios", itemType: "servicio", inventario: undefined })],
    });
    api.put.mockResolvedValue({ data: {} });
    renderPantalla();
    const user = await abrirCategoria("servicios");

    await user.click(await screen.findByRole("button", { name: "Editar" }));
    await user.click(botonSubmit());

    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
    expect(api.put.mock.calls[0][0]).toBe("/shop/productos/s1");
    expect(api.put.mock.calls[0][1]).not.toHaveProperty("inventario");
  });
});

/* =====================================================================
   PARIDAD · cabecera de página
   ===================================================================== */
describe("PARIDAD · cabecera de página (como ProductsMenu de restaurante)", () => {
  it("el título de página es 'Gestor de productos'", async () => {
    catalogo();
    renderPantalla();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Gestor de productos" })
    ).toBeTruthy();
  });

  it("no muestra la línea de tenant: es un dato de depuración que la carta no tiene", async () => {
    catalogo();
    renderPantalla();
    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByText(/Tenant:/)).toBeNull();
  });

  it("el botón de alta es '+ Nuevo producto' con la clase de los botones de la carta", async () => {
    catalogo();
    renderPantalla();
    const boton = await screen.findByRole("button", { name: "+ Nuevo producto" });
    expect(boton).toHaveClass("catpanel-btn-new");
  });
});

/* =====================================================================
   PARIDAD · categorías (listado, carga, vacío, error)
   ===================================================================== */
describe("PARIDAD · categorías (como la lista de la carta)", () => {
  it("cada categoría es una fila de la carta (catpanel-item) y no hay 'Categorías disponibles'", async () => {
    catalogo({ categorias: ["limpieza", "bebidas"], productos: [] });
    renderPantalla();
    const filas = await screen.findAllByRole("button", { name: /limpieza|bebidas/ });
    expect(filas).toHaveLength(2);
    for (const fila of filas) {
      expect(fila).toHaveClass("catpanel-item");
    }
    expect(screen.queryByText("Categorías disponibles")).toBeNull();
  });

  it("mientras carga las categorías enseña 'Cargando categorías…' y NO el aviso de vacío", async () => {
    catalogo({ getCategorias: () => new Promise(() => {}) });
    renderPantalla();
    expect(await screen.findByText("Cargando categorías…")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Crear primer producto/ })).toBeNull();
  });

  it("sin categorías muestra el estado vacío de la carta (catpanel-empty) con su CTA", async () => {
    catalogo({ categorias: [] });
    renderPantalla();
    expect(await screen.findByText("No hay productos todavía.")).toBeTruthy();
    expect(document.querySelector(".catpanel-empty")).toBeTruthy();
    const cta = screen.getByRole("button", { name: "+ Crear primer producto" });
    expect(cta).toHaveClass("catpanel-btn-new", "catpanel-btn-new--small");
  });

  it("si falla la carga de categorías lo dice en pantalla", async () => {
    catalogo({
      getCategorias: () => {
        throw new Error("red caída");
      },
    });
    renderPantalla();
    expect(await screen.findByText("No se pudieron cargar las categorías.")).toBeTruthy();
  });
});

/* =====================================================================
   PARIDAD · productos de la categoría (listado, estado, carga, vacío, error)
   ===================================================================== */
describe("PARIDAD · productos de la categoría (como las filas de la carta)", () => {
  it("cada producto es una fila de la carta (catpanel-product) con su estado Visible", async () => {
    catalogo();
    renderPantalla();
    await abrirCategoria("limpieza");
    const fila = (await screen.findByText("Detergente 1L")).closest(".catpanel-product");
    expect(fila).not.toBeNull();
    expect(within(fila).getByText("Visible")).toBeTruthy();
  });

  it("el estado sale de 'activo': un producto desactivado se ve como Oculto", async () => {
    catalogo({ productos: [producto({ activo: false })] });
    renderPantalla();
    await abrirCategoria("limpieza");
    expect(await screen.findByText("Oculto")).toBeTruthy();
    // 'habilitado' era un valor inventado: la tienda no tiene campo 'estado'.
    expect(screen.queryByText("habilitado")).toBeNull();
  });

  it("mientras carga los productos enseña 'Cargando productos…'", async () => {
    catalogo({ getProductos: () => new Promise(() => {}) });
    renderPantalla();
    await abrirCategoria("limpieza");
    expect(await screen.findByText("Cargando productos…")).toBeTruthy();
  });

  it("una categoría sin productos dice 'Sin productos en esta categoría.'", async () => {
    catalogo({ productos: [] });
    renderPantalla();
    await abrirCategoria("limpieza");
    expect(await screen.findByText("Sin productos en esta categoría.")).toBeTruthy();
  });

  it("si falla la carga de productos lo dice en pantalla", async () => {
    catalogo({
      getProductos: () => {
        throw new Error("red caída");
      },
    });
    renderPantalla();
    await abrirCategoria("limpieza");
    expect(await screen.findByText("No se pudieron cargar los productos.")).toBeTruthy();
  });
});

/* =====================================================================
   PARIDAD · alta y edición (modales de la carta)
   ===================================================================== */
describe("PARIDAD · alta y edición (como CrearProducto / EditProducts)", () => {
  it("el título del modal de alta es 'Crear producto' (sin el sufijo '(Shop)')", async () => {
    catalogo();
    renderPantalla();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /Nuevo producto/ }));
    expect(await screen.findByRole("heading", { level: 2, name: "Crear producto" })).toBeTruthy();
  });

  it("el alta muestra el error del servidor dentro del modal y el modal sigue abierto", async () => {
    catalogo({ categorias: ["limpieza"] });
    api.post.mockRejectedValue({
      response: { data: { message: "Ya existe un producto con ese SKU" } },
    });
    renderPantalla();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /Nuevo producto/ }));
    await rellenarAlta(user, { nombre: "Pilas AA", categoria: "bebidas", precio: "1.2" });
    await user.click(botonSubmit());

    expect(await screen.findByText("Ya existe un producto con ese SKU")).toBeTruthy();
    expect(document.querySelector("form")).toBeTruthy();
  });

  it("tras crear un producto, la lista de categorías se vuelve a pedir", async () => {
    catalogo({ categorias: ["limpieza"] });
    api.post.mockResolvedValue({ data: {} });
    renderPantalla();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /Nuevo producto/ }));
    await rellenarAlta(user, { nombre: "Pilas AA", categoria: "bebidas", precio: "1.2" });
    await user.click(botonSubmit());

    await waitFor(() => {
      const pedidasCategorias = api.get.mock.calls.filter((c) => c[0] === CATEGORIAS_URL).length;
      expect(pedidasCategorias).toBeGreaterThanOrEqual(2);
    });
  });

  it("editar: el título es 'Editar producto' y el botón 'Guardar cambios' (como en restaurante)", async () => {
    catalogo();
    renderPantalla();
    const user = await abrirCategoria("limpieza");
    await user.click(await screen.findByRole("button", { name: "Editar" }));
    expect(await screen.findByRole("heading", { level: 2, name: "Editar producto" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeTruthy();
  });

  it("la edición muestra el error del servidor dentro del modal", async () => {
    catalogo();
    api.put.mockRejectedValue({
      response: { data: { message: "El stock mínimo no puede superar el stock máximo" } },
    });
    renderPantalla();
    const user = await abrirCategoria("limpieza");
    await user.click(await screen.findByRole("button", { name: "Editar" }));
    await user.click(botonSubmit());

    expect(
      await screen.findByText("El stock mínimo no puede superar el stock máximo")
    ).toBeTruthy();
  });
});

/* =====================================================================
   PARIDAD · eliminar (confirmación de la carta)
   ===================================================================== */
describe("PARIDAD · eliminar (como la confirmación de la carta)", () => {
  it("pide confirmación con el texto de la carta y el botón 'Eliminar'", async () => {
    catalogo();
    renderPantalla();
    const user = await abrirCategoria("limpieza");
    await user.click(await screen.findByRole("button", { name: "Eliminar" }));

    expect(await screen.findByRole("heading", { name: "Eliminar producto" })).toBeTruthy();
    const modal = document.querySelector(".modal-contenido--modalconfirmacion");
    expect(modal).toBeTruthy();
    expect(within(modal).getByText(/Esta acción no se puede deshacer/)).toBeTruthy();
    expect(within(modal).getByRole("button", { name: "Eliminar" })).toBeTruthy();
  });

  it("si el servidor rechaza el borrado, el motivo se ve dentro del modal y el modal sigue abierto", async () => {
    catalogo();
    api.delete.mockRejectedValue({
      response: { data: { message: "No se puede eliminar: tiene pedidos abiertos" } },
    });
    renderPantalla();
    const user = await abrirCategoria("limpieza");
    await user.click(await screen.findByRole("button", { name: "Eliminar" }));
    // Se confirma por la clase del modal compartido, para que este test mire solo el error y
    // no el texto del botón (ese lo cubre el test de arriba).
    await user.click(document.querySelector(".boton-aceptar--modalconfirmacion"));

    expect(await screen.findByText("No se puede eliminar: tiene pedidos abiertos")).toBeTruthy();
    expect(document.querySelector(".modal-contenido--modalconfirmacion")).toBeTruthy();
  });
});

/* =====================================================================
   HIGIENE · sin estilos inline ni clases muertas en la pantalla de tienda
   ===================================================================== */
describe("HIGIENE · la pantalla de tienda usa clases vivas y CSS por clases", () => {
  // Rutas relativas a ESTE fichero de test (src/components/ShopProducts/).
  const FICHEROS = [
    "../../pages/ProductosPageShop.jsx",
    "./ShopProducts.jsx",
    "../ShopCategories/ShopCategories.jsx",
    "../ShopProductsModals/CrearProductoShop.jsx",
    "../ShopProductsModals/EditProductShop.jsx",
  ];

  it("ningún fichero de la pantalla usa style={{...}} (regla del panel: CSS por clases)", async () => {
    const fs = await import("node:fs");
    for (const f of FICHEROS) {
      const src = fs.readFileSync(new URL(f, import.meta.url), "utf8");
      expect(/style=\{\{/.test(src), `hay style={{...}} en ${f}`).toBe(false);
    }
  });

  it("no usa las clases de Products.css: ese fichero no se importa y en el build no existen", async () => {
    const fs = await import("node:fs");
    const CLASES_MUERTAS = [
      "products--products",
      "products-header--products",
      "boton-crear--products",
      "categories-wrapper--products",
      "no-categories-card--products",
      "categories-card--products",
      "category-pill--products",
      "category-panel--products",
    ];
    for (const f of ["./ShopProducts.jsx", "../ShopCategories/ShopCategories.jsx"]) {
      const src = fs.readFileSync(new URL(f, import.meta.url), "utf8");
      for (const clase of CLASES_MUERTAS) {
        expect(src.includes(clase), `${f} sigue usando ${clase}`).toBe(false);
      }
    }
  });
});
