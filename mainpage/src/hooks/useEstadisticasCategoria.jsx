// src/Hooks/useEstadisticasCategoria.jsx
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import api from "../utils/api";

/**
 * Carga estadísticas agregadas SERVER-SIDE via GET /reportes/estadisticas-categoria.
 * Un solo request con $facet en MongoDB — no carga ventas individuales.
 *
 * @param {Array}  products  — Productos de la categoría activa (necesitamos sus _id)
 * @param {object} filters   — { startDate?: Date, endDate?: Date }
 */
export const useEstadisticasCategoria = (products, filters = {}) => {
  const { startDate, endDate } = filters || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const controllerRef = useRef(null);

  // IDs de productos como string estable para deps
  const productoIds = useMemo(() => {
    if (!products || products.length === 0) return "";
    return products.map((p) => p._id).join(",");
  }, [products]);

  const fetchStats = useCallback(async () => {
    if (!productoIds) {
      setData(null);
      setLoading(false);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = { productoIds };

      if (startDate) {
        const d = startDate instanceof Date ? startDate : new Date(startDate);
        if (!Number.isNaN(d.getTime())) params.desde = d.toISOString().slice(0, 10);
      }
      if (endDate) {
        const d = endDate instanceof Date ? endDate : new Date(endDate);
        if (!Number.isNaN(d.getTime())) params.hasta = d.toISOString().slice(0, 10);
      }

      const res = await api.get("/reportes/estadisticas-categoria", {
        params,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      setData(res.data || null);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setError("No se pudieron cargar las estadísticas.");
      setData(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [productoIds, startDate, endDate]);

  useEffect(() => {
    fetchStats();
    return () => controllerRef.current?.abort();
  }, [fetchStats]);

  /* =====================================================
   * Derivar datos del response del backend
   * ===================================================== */

  const resumenCategoria = useMemo(() => {
    if (!data?.resumen) return { totalCantidad: 0, totalIngresos: 0, precioMedioUnidad: 0 };
    return data.resumen;
  }, [data]);

  // porProducto ya viene con nombre, productoId, totalCantidad, totalIngresos
  const productosConStats = useMemo(() => {
    if (!data?.porProducto || !products) return [];

    // Mapear datos del backend a los productos originales (mantener campos extra del producto)
    const statsMap = {};
    for (const s of data.porProducto) {
      statsMap[String(s.productoId)] = s;
    }

    return products.map((p) => {
      const stats = statsMap[String(p._id)];
      return {
        ...p,
        totalCantidad: stats?.totalCantidad || 0,
        totalIngresos: stats?.totalIngresos || 0,
      };
    });
  }, [data, products]);

  const topProductos = useMemo(
    () => [...productosConStats].sort((a, b) => b.totalIngresos - a.totalIngresos).slice(0, 5),
    [productosConStats]
  );

  // porHora: backend devuelve solo horas con datos, rellenar las 24
  const estadisticasPorHora = useMemo(() => {
    const horaMap = {};
    for (const h of data?.porHora || []) {
      horaMap[h.hour] = h;
    }
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      totalCantidad: horaMap[hour]?.totalCantidad || 0,
      totalIngresos: horaMap[hour]?.totalIngresos || 0,
    }));
  }, [data]);

  const horaPunta = useMemo(() => {
    if (!data?.porHora || data.porHora.length === 0) return null;
    return data.porHora.reduce((best, h) =>
      h.totalIngresos > (best?.totalIngresos || 0) ? h : best
    , null)?.hour ?? null;
  }, [data]);

  const estadisticasPorMes = useMemo(() => data?.porMes || [], [data]);

  return {
    loading,
    error,
    refetch: fetchStats,
    productosConStats,
    resumenCategoria,
    estadisticasPorMes,
    estadisticasPorHora,
    topProductos,
    horaPunta,
  };
};
