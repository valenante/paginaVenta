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
  const [promediosDia, setPromediosDia] = useState(null);
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
        if (!Number.isNaN(d.getTime())) {
          // Usar formato local YYYY-MM-DD sin conversión UTC (evita desfase de día)
          params.desde = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        }
      }
      if (endDate) {
        const d = endDate instanceof Date ? endDate : new Date(endDate);
        if (!Number.isNaN(d.getTime())) {
          params.hasta = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        }
      }

      const [res, resPromedios] = await Promise.all([
        api.get("/reportes/estadisticas-categoria", { params, signal: controller.signal }),
        api.get("/reportes/promedios-dia-semana", { params: { productoIds }, signal: controller.signal }),
      ]);

      if (controller.signal.aborted) return;

      setData(res.data || null);
      setPromediosDia(resPromedios?.data?.data || resPromedios?.data || null);
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
        ingresosBase: stats?.ingresosBase ?? null,
        ingresosAdicionales: stats?.ingresosAdicionales ?? 0,
        tieneDesglose: !!stats?.tieneDesglose,
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

  /* =====================================================
   * Promedios por día de la semana
   * MongoDB $dayOfWeek: 1=Dom, 2=Lun, 3=Mar, 4=Mié, 5=Jue, 6=Vie, 7=Sáb
   * ===================================================== */
  const promedioDiaSemana = useMemo(() => {
    if (!promediosDia || !products) return null;

    const porProductoYDia = promediosDia.porProductoYDia || [];
    const diasActivos = promediosDia.diasActivosPorSemana || {};

    // Agrupar por producto
    const porProducto = {};
    for (const row of porProductoYDia) {
      const pid = String(row.productoId);
      if (!porProducto[pid]) porProducto[pid] = {};
      porProducto[pid][String(row.dia)] = row.totalCantidad;
    }

    const productosConPromedio = products.map((p) => {
      const pid = String(p._id);
      const diasData = porProducto[pid] || {};
      const promedios = {}; // { "1": avg, ..., "7": avg }
      let totalSemana = 0;
      for (let dia = 1; dia <= 7; dia++) {
        const total = diasData[String(dia)] || 0;
        const denom = diasActivos[String(dia)] || 0;
        const avg = denom > 0 ? total / denom : 0;
        promedios[String(dia)] = avg;
        totalSemana += avg;
      }
      return {
        productoId: pid,
        nombre: p.nombre,
        promedios,
        totalSemana,
      };
    });

    return {
      productos: productosConPromedio,
      diasActivos,
    };
  }, [promediosDia, products]);

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
    promedioDiaSemana,
  };
};
