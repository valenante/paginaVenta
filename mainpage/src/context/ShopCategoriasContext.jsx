// src/context/ShopCategoriasContext.js
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import api from "../utils/api";

/**
 * SHOP CATEGORIAS CONTEXT
 * - categories: lista de categorías para "producto" o "servicio"
 * - products: productos/servicios de la categoría seleccionada
 * - fetchCategories(type)
 * - fetchProducts({ type, category })
 * - createProduct(payload)
 * - updateProduct(payload)
 * - deleteProduct(id)
 *
 * ⚠️ Ajusta estas rutas si tu backend usa otras:
 * - GET    /shop/categorias?type=producto|servicio
 * - GET    /shop/productos?type=producto|servicio&category=...
 * - POST   /shop/productos
 * - PUT    /shop/productos/:id
 * - DELETE /shop/productos/:id
 */

const ShopCategoriasContext = createContext(null);

export function ShopCategoriasProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [errorCategories, setErrorCategories] = useState(null);
  const [errorProducts, setErrorProducts] = useState(null);

  const fetchCategories = useCallback(async (type) => {
    setLoadingCategories(true);
    setErrorCategories(null);

    try {
      const { data } = await api.get("/shop/productos/categorias", {
        params: type ? { type } : {}, // ✅ type opcional
      });

      const list =
        data?.categories ||
        data?.categorias ||
        data?.data ||
        (Array.isArray(data) ? data : []);

      setCategories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("fetchCategories (shop) error:", err);
      setErrorCategories("No se pudieron cargar las categorías.");
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchProducts = useCallback(async ({ type, category, search = "", page, limit } = {}) => {
    setLoadingProducts(true);
    setErrorProducts(null);
    try {
      const { data } = await api.get("/shop/productos", {
        params: {
          type,
          category,
          search,
          page,
          limit,
        },
      });

      // Acepta varios formatos posibles
      const list =
        data?.products ||
        data?.productos ||
        data?.items ||
        data?.data ||
        (Array.isArray(data) ? data : []);

      setProducts(Array.isArray(list) ? list : []);
      return data; // por si quieres usar paginación desde el componente
    } catch (err) {
      console.error("fetchProducts (shop) error:", err);
      setErrorProducts("No se pudieron cargar los productos.");
      setProducts([]);
      return null;
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const createProduct = useCallback(async (payload) => {
    // payload típico shop:
    // { type: "producto"|"servicio", nombre, categoria, sku, barcode, precio, iva, stockActual, ... }
    const { data } = await api.post("/shop/productos", payload);
    return data;
  }, []);

  const updateProduct = useCallback(async (payload) => {
    if (!payload?._id && !payload?.id) {
      throw new Error("updateProduct: falta _id/id");
    }
    const id = payload._id || payload.id;
    const { data } = await api.put(`/shop/productos/${id}`, payload);
    return data;
  }, []);

  const deleteProduct = useCallback(async (id) => {
    if (!id) throw new Error("deleteProduct: falta id");
    const { data } = await api.delete(`/shop/productos/productos/${id}`);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      categories,
      products,

      loadingCategories,
      loadingProducts,

      errorCategories,
      errorProducts,

      fetchCategories,
      fetchProducts,
      createProduct,
      updateProduct,
      deleteProduct,

      // helpers por si quieres resetear en UI
      setCategories,
      setProducts,
    }),
    [
      categories,
      products,
      loadingCategories,
      loadingProducts,
      errorCategories,
      errorProducts,
      fetchCategories,
      fetchProducts,
      createProduct,
      updateProduct,
      deleteProduct,
    ]
  );

  return (
    <ShopCategoriasContext.Provider value={value}>
      {children}
    </ShopCategoriasContext.Provider>
  );
}

export function useShopCategorias() {
  const ctx = useContext(ShopCategoriasContext);
  if (!ctx) {
    throw new Error("useShopCategorias debe usarse dentro de <ShopCategoriasProvider />");
  }
  return ctx;
}
