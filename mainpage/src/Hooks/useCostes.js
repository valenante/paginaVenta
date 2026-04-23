// src/hooks/useCostes.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../utils/api";

/**
 * Hook para la pantalla de Gestión de Costes.
 *
 * Carga todos los productos con sus precios/costes y expone helpers para:
 *  - Marcar cambios locales (dirty state) sin guardar todavía
 *  - Guardar un producto (PATCH /productos/:id/costes)
 *  - Guardar todos los productos con cambios en lote
 */
export default function useCostes({ tipo } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Cambios pendientes: { [productoId]: { [clavePrecio]: number } }
  const [dirty, setDirty] = useState({});

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchCostes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (tipo) params.tipo = tipo;
      const { data } = await api.get("/productos/costes", { params });
      if (!mountedRef.current) return;
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err?.response?.data?.message || "No se pudieron cargar los costes.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [tipo]);

  useEffect(() => { fetchCostes(); }, [fetchCostes]);

  /* =====================================================
   * Dirty tracking
   * ===================================================== */
  const setCosteLocal = useCallback((productoId, clavePrecio, valor) => {
    setDirty((prev) => {
      const prod = { ...(prev[productoId] || {}) };
      const num = valor === "" || valor === null || valor === undefined
        ? undefined
        : Number(valor);
      if (num === undefined || Number.isNaN(num)) {
        delete prod[clavePrecio];
      } else {
        prod[clavePrecio] = num;
      }
      const next = { ...prev, [productoId]: prod };
      if (Object.keys(prod).length === 0) delete next[productoId];
      return next;
    });
  }, []);

  const discardChanges = useCallback((productoId) => {
    if (!productoId) { setDirty({}); return; }
    setDirty((prev) => {
      const n = { ...prev };
      delete n[productoId];
      return n;
    });
  }, []);

  const hasChanges = useMemo(() => Object.keys(dirty).length > 0, [dirty]);
  const dirtyCount = useMemo(() => {
    return Object.values(dirty).reduce((acc, m) => acc + Object.keys(m || {}).length, 0);
  }, [dirty]);

  /* =====================================================
   * Guardado
   * ===================================================== */
  const saveProducto = useCallback(async (productoId, nota = "") => {
    const costes = dirty[productoId];
    if (!costes || Object.keys(costes).length === 0) return null;

    setSaving(true);
    setError(null);
    try {
      const { data } = await api.patch(`/productos/${productoId}/costes`, {
        costes,
        nota,
      });
      const updated = data?.producto;
      if (updated && mountedRef.current) {
        setItems((prev) => prev.map((p) => (p._id === productoId ? { ...p, ...updated } : p)));
        discardChanges(productoId);
      }
      return updated;
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.response?.data?.message || "No se pudieron guardar los costes.");
      }
      throw err;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [dirty, discardChanges]);

  const saveAll = useCallback(async (nota = "") => {
    const ids = Object.keys(dirty);
    if (ids.length === 0) return { ok: 0, fail: 0 };
    setSaving(true);
    let ok = 0, fail = 0;
    for (const id of ids) {
      try {
        await saveProducto(id, nota);
        ok++;
      } catch {
        fail++;
      }
    }
    setSaving(false);
    return { ok, fail };
  }, [dirty, saveProducto]);

  /* =====================================================
   * Helper: calcular valor efectivo (dirty || original)
   * ===================================================== */
  const getCosteActual = useCallback((producto, clave) => {
    const d = dirty[producto._id]?.[clave];
    if (d !== undefined) return d;
    const entry = (producto.precios || []).find((p) => p.clave === clave);
    return Number(entry?.coste || 0);
  }, [dirty]);

  return {
    items,
    loading,
    error,
    saving,
    refresh: fetchCostes,
    // dirty
    dirty,
    hasChanges,
    dirtyCount,
    setCosteLocal,
    discardChanges,
    getCosteActual,
    // save
    saveProducto,
    saveAll,
  };
}
