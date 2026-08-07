// src/hooks/useCostes.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../utils/api";
import { toNum } from "../utils/numeroInput";

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
  // Guarda el TEXTO tal cual escribe el usuario (incluido "" o "1." a medio
  // teclear). Convertir aquí impedía borrar el campo y mataba el punto decimal:
  // al llegar "" se borraba el dirty, el input volvía al coste guardado y React
  // reescribía ese valor en el DOM. La conversión se hace al GUARDAR.
  const setCosteLocal = useCallback((productoId, clavePrecio, valor) => {
    setDirty((prev) => {
      const prod = { ...(prev[productoId] || {}) };
      prod[clavePrecio] = valor == null ? "" : String(valor);
      return { ...prev, [productoId]: prod };
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
    const raw = dirty[productoId];
    if (!raw || Object.keys(raw).length === 0) return null;

    // dirty guarda texto → aquí se convierte a número. Campo vacío = coste 0
    // (es la misma convención que ya usa la pantalla: un coste 0 se ve vacío).
    const costes = {};
    for (const [clave, val] of Object.entries(raw)) {
      costes[clave] = Math.max(0, toNum(val, 0));
    }

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
  // Valor NUMÉRICO efectivo (para márgenes, filtros y cálculos).
  const getCosteActual = useCallback((producto, clave) => {
    const d = dirty[producto._id]?.[clave];
    if (d !== undefined) return toNum(d, 0);
    const entry = (producto.precios || []).find((p) => p.clave === clave);
    return toNum(entry?.coste, 0);
  }, [dirty]);

  // TEXTO para el input: respeta lo que el usuario está escribiendo ("" incluido).
  const getCosteTexto = useCallback((producto, clave) => {
    const d = dirty[producto._id]?.[clave];
    if (d !== undefined) return d;
    const entry = (producto.precios || []).find((p) => p.clave === clave);
    const n = toNum(entry?.coste, 0);
    return n === 0 ? "" : String(n);
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
    getCosteTexto,
    // save
    saveProducto,
    saveAll,
  };
}
