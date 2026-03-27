import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../utils/api";
import * as logger from "../utils/logger";

/* =====================================================
   Context
===================================================== */
export const CategoriasContext = createContext(null);

/* =====================================================
   Utils
===================================================== */
const keyOf = (tipo, categoria) => `${tipo}::${categoria}`;

/* =====================================================
   Provider
===================================================== */
export const CategoriasProvider = ({ children }) => {
  /**
   * Cache de categorías por tipo
   * { plato: [...], bebida: [...] }
   */
  const [categoriesByTipo, setCategoriesByTipo] = useState({});

  /**
   * Cache de productos por tipo+categoría
   * { "plato::Entrantes": [...], "bebida::Refrescos": [...] }
   */
  const [productsByKey, setProductsByKey] = useState({});

  /**
   * Estados de carga reales
   */
  const [loading, setLoading] = useState({
    categories: false,
    products: false,
  });

  /**
   * Estados de error reales
   */
  const [error, setError] = useState({
    categories: null,
    products: null,
  });

  /**
   * Requests en vuelo (para abortar correctamente)
   */
  const inFlight = useRef(new Map());

  /* =====================================================
     Fetch categorías por tipo
  ===================================================== */
  const fetchCategories = useCallback(
    async (tipo, { force = false } = {}) => {
      if (!tipo) return [];

      // Cache hit
      if (!force && Array.isArray(categoriesByTipo[tipo])) {
        return categoriesByTipo[tipo];
      }

      setLoading((s) => ({ ...s, categories: true }));
      setError((e) => ({ ...e, categories: null }));

      try {
        const res = await api.get(`/productos/categories/${tipo}`);

        /**
         * Backend devuelve:
         * { ok: true, data: [...] }
         */
        const raw = res?.data ?? [];

        const categorias = raw
          .filter((c) => typeof c === "string" && c.trim().length > 0)
          .sort((a, b) => a.localeCompare(b));

        setCategoriesByTipo((prev) => ({
          ...prev,
          [tipo]: categorias,
        }));

        return categorias;
      } catch (err) {
        logger.error("[CategoriasContext] Error al obtener categorías", err);
        setError((e) => ({ ...e, categories: err }));
        return [];
      } finally {
        setLoading((s) => ({ ...s, categories: false }));
      }
    },
    [categoriesByTipo]
  );

  /* =====================================================
     Fetch productos por tipo + categoría
  ===================================================== */
  const fetchProducts = useCallback(
    async ({ tipo, categoria }, { force = false } = {}) => {
      if (!tipo || !categoria) return [];

      const key = keyOf(tipo, categoria);

      // Cache hit
      if (!force && Array.isArray(productsByKey[key])) {
        return productsByKey[key];
      }

      // Abort request anterior de esta key
      if (inFlight.current.has(key)) {
        inFlight.current.get(key).abort();
      }

      const controller = new AbortController();
      inFlight.current.set(key, controller);

      setLoading((s) => ({ ...s, products: true }));
      setError((e) => ({ ...e, products: null }));

      try {
        const res = await api.get(
          `/productos/category/${encodeURIComponent(categoria)}?tipo=${encodeURIComponent(tipo)}`,
          { signal: controller.signal }
        );

        /**
         * Backend devuelve:
         * { ok: true, data: [...] }
         */
        const productos = res?.data ?? [];

        setProductsByKey((prev) => ({
          ...prev,
          [key]: productos,
        }));

        return productos;
      } catch (err) {
        // Abort no es error real
        if (err?.name === "CanceledError" || err?.name === "AbortError") {
          return [];
        }

        logger.error("[CategoriasContext] Error al obtener productos", err);
        setError((e) => ({ ...e, products: err }));
        return [];
      } finally {
        inFlight.current.delete(key);
        setLoading((s) => ({ ...s, products: false }));
      }
    },
    [productsByKey]
  );

  // Dentro de CategoriasProvider (debajo de fetchProducts)

  const updateProduct = useCallback(async (productOrId, maybePayload) => {
    let id;
    let payload;

    if (typeof productOrId === "string") {
      id = productOrId;
      payload = maybePayload;
    } else {
      id = productOrId?._id || productOrId?.id;
      payload = productOrId;
    }

    if (!id) throw new Error("ID requerido para updateProduct");

    const isFormData =
      typeof FormData !== "undefined" && payload instanceof FormData;

    const res = await api.put(`/productos/${id}`, payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
      withCredentials: true,
    });

    return res.data;
  }, []);

  const deleteProduct = useCallback(async (id) => {
    if (!id) throw new Error("ID requerido para deleteProduct");

    const res = await api.delete(`/productos/${id}`, { withCredentials: true });
    return res.data;
  }, []);

  /* =====================================================
     CRUD Categorías (objetos con descripcion, icono, etc.)
  ===================================================== */

  /**
   * Cache de objetos categoría por tipo
   * { plato: [{ _id, nombre, descripcion, icono, orden }], bebida: [...] }
   */
  const [categoryObjectsByTipo, setCategoryObjectsByTipo] = useState({});

  const fetchCategoryObjects = useCallback(
    async (tipo, { force = false } = {}) => {
      if (!tipo) return [];

      if (!force && Array.isArray(categoryObjectsByTipo[tipo])) {
        return categoryObjectsByTipo[tipo];
      }

      try {
        const res = await api.get(`/categorias`, { params: { tipo } });
        const data = res?.data ?? [];

        setCategoryObjectsByTipo((prev) => ({
          ...prev,
          [tipo]: data,
        }));

        return data;
      } catch (err) {
        logger.error("[CategoriasContext] Error al obtener objetos categoría", err);
        return [];
      }
    },
    [categoryObjectsByTipo]
  );

  const createCategoryObject = useCallback(async (data) => {
    const res = await api.post("/categorias", data, { withCredentials: true });
    const cat = res?.data;
    if (cat) {
      setCategoryObjectsByTipo((prev) => ({
        ...prev,
        [cat.tipo]: [...(prev[cat.tipo] || []), cat],
      }));
    }
    return cat;
  }, []);

  const updateCategoryObject = useCallback(async (id, data) => {
    const res = await api.put(`/categorias/${id}`, data, { withCredentials: true });
    const cat = res?.data;
    if (cat) {
      setCategoryObjectsByTipo((prev) => {
        const list = (prev[cat.tipo] || []).map((c) =>
          c._id === cat._id ? cat : c
        );
        return { ...prev, [cat.tipo]: list };
      });
    }
    return cat;
  }, []);

  const deleteCategoryObject = useCallback(async (id, tipo) => {
    await api.delete(`/categorias/${id}`, { withCredentials: true });
    setCategoryObjectsByTipo((prev) => ({
      ...prev,
      [tipo]: (prev[tipo] || []).filter((c) => c._id !== id),
    }));
  }, []);

  /* =====================================================
     Valor del contexto (memoizado)
  ===================================================== */
  const value = useMemo(
    () => ({
      categoriesByTipo,
      productsByKey,
      loading,
      error,
      fetchCategories,
      fetchProducts,
      updateProduct,
      deleteProduct,
      // Categorías como objetos
      categoryObjectsByTipo,
      fetchCategoryObjects,
      createCategoryObject,
      updateCategoryObject,
      deleteCategoryObject,
    }),
    [
      categoriesByTipo, productsByKey, loading, error,
      fetchCategories, fetchProducts, updateProduct, deleteProduct,
      categoryObjectsByTipo, fetchCategoryObjects, createCategoryObject,
      updateCategoryObject, deleteCategoryObject,
    ]
  );

  return (
    <CategoriasContext.Provider value={value}>
      {children}
    </CategoriasContext.Provider>
  );
};

/* =====================================================
   Hook
===================================================== */
export const useCategorias = () => {
  const ctx = useContext(CategoriasContext);
  if (!ctx) {
    throw new Error(
      "useCategorias debe usarse dentro de <CategoriasProvider>"
    );
  }
  return ctx;
};
