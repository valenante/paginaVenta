// src/Hooks/useEstadisticasCategoria.jsx
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import api from "../utils/api";

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

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

  // Label map: productoId → clavePrecio → label humano
  const labelMap = useMemo(() => {
    const map = {};
    for (const p of products || []) {
      const pid = String(p._id);
      map[pid] = {};
      for (const pr of p.precios || []) {
        if (pr.clave) map[pid][pr.clave] = pr.label || capitalize(pr.clave);
      }
    }
    return map;
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
        api.get("/reportes/promedios-dia-semana", { params, signal: controller.signal }),
      ]);

      if (controller.signal.aborted) return;

      setData(res.data || null);
      setPromediosDia(resPromedios?.data || null);
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

  const productosConStats = useMemo(() => {
    if (!data?.porProducto) return [];

    return data.porProducto.map((s) => {
      const pid = String(s.productoId);
      const clave = s.clavePrecio || "precioBase";
      const isPrecioBase = clave === "precioBase";
      const variantLabel = labelMap[pid]?.[clave] || capitalize(clave);

      return {
        _id: isPrecioBase ? pid : `${pid}_${clave}`,
        productoId: s.productoId,
        clavePrecio: clave,
        nombre: isPrecioBase ? s.nombre : `${s.nombre} (${variantLabel})`,
        categoria: s.categoria,
        tipo: s.tipo,
        totalCantidad: s.totalCantidad || 0,
        totalIngresos: s.totalIngresos || 0,
        ingresosBase: s.ingresosBase ?? null,
        ingresosAdicionales: s.ingresosAdicionales ?? 0,
        tieneDesglose: !!s.tieneDesglose,
      };
    });
  }, [data, labelMap]);

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
    if (!promediosDia) return null;

    const porProductoYDia = promediosDia.porProductoYDia || [];
    const diasActivos = promediosDia.diasActivosPorSemana || {};

    const porProducto = {};
    for (const row of porProductoYDia) {
      const clave = row.clavePrecio || "precioBase";
      const isPrecioBase = clave === "precioBase";
      const key = isPrecioBase ? String(row.productoId) : `${row.productoId}_${clave}`;
      if (!porProducto[key]) porProducto[key] = {};
      porProducto[key][String(row.dia)] = row.totalCantidad;
    }

    const nameMap = {};
    for (const p of productosConStats) {
      nameMap[p._id] = p.nombre;
    }

    const productosConPromedio = Object.entries(porProducto).map(([key, diasData]) => {
      const promedios = {};
      let totalSemana = 0;
      for (let dia = 1; dia <= 7; dia++) {
        const total = diasData[String(dia)] || 0;
        const denom = diasActivos[String(dia)] || 0;
        const avg = denom > 0 ? total / denom : 0;
        promedios[String(dia)] = avg;
        totalSemana += avg;
      }
      return {
        productoId: key,
        nombre: nameMap[key] || key,
        promedios,
        totalSemana,
      };
    });

    return {
      productos: productosConPromedio,
      diasActivos,
    };
  }, [promediosDia, productosConStats]);

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
