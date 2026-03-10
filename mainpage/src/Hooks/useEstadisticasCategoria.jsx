// src/Hooks/useEstadisticasCategoria.jsx
import { useEffect, useMemo, useState } from "react";
import { useTenant } from "../context/TenantContext";
import api from "../utils/api";

/* =====================================================
   Helpers de rango
===================================================== */
const normalizarInicioDia = (date) => {
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
};

const normalizarFinDia = (date) => {
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
};

const estaDentroDelRango = (fechaVenta, startDate, endDate) => {
  const fecha = new Date(fechaVenta);
  const inicio = normalizarInicioDia(startDate);
  const fin = normalizarFinDia(endDate);
  if (inicio && fecha < inicio) return false;
  if (fin && fecha > fin) return false;
  return true;
};

/* =====================================================
   Hook
===================================================== */

/**
 * Carga ventas para los productos dados y calcula estadísticas agregadas.
 *
 * @param {Array}  products            - Productos de la categoría activa
 * @param {object} filters             - { startDate?: Date, endDate?: Date }
 *   Todos los casos son válidos:
 *     {}                  → sin filtro de fecha
 *     { startDate }       → desde startDate
 *     { endDate }         → hasta endDate
 *     { startDate, endDate } → rango completo
 */
export const useEstadisticasCategoria = (products, filters = {}) => {
  const { startDate, endDate } = filters || {};

  const [loading, setLoading] = useState(false);
  // Mapa sin filtrar: { productoId: [venta, venta, ...] }
  // Solo se recalcula cuando cambian los productos o el tipo de negocio.
  const [ventasPorProducto, setVentasPorProducto] = useState({});

  const { tenant } = useTenant();
  const tipoNegocio = tenant?.tipoNegocio || "restaurante";

  /* =====================================================
   * Fetch — solo cuando cambian los productos o tipoNegocio.
   * Las fechas NO están en las dependencias a propósito:
   * el filtrado se hace en useMemo client-side sin re-fetch.
   * ===================================================== */
  useEffect(() => {
    const cargar = async () => {
      if (!products || products.length === 0) {
        setVentasPorProducto({});
        return;
      }

      setLoading(true);
      try {
        const endpoint =
          tipoNegocio === "shop" ? "/shop/estadisticas/ventas" : "/ventas";

        const { data } = await api.get(endpoint);

        const ventasTodas = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.ventas)
              ? data.ventas
              : [];

        const idsProductos = new Set(products.map((p) => String(p._id)));

        const ventasCategoria = ventasTodas.filter((v) =>
          idsProductos.has(String(v.producto?._id || v.producto))
        );

        const ventasMap = {};
        for (const p of products) {
          const id = String(p._id);
          ventasMap[id] = ventasCategoria.filter(
            (v) => String(v.producto?._id || v.producto) === id
          );
        }

        setVentasPorProducto(ventasMap);
      } finally {
        setLoading(false);
      }
    };

    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, tipoNegocio]);

  /* =====================================================
   * productosConStats — filtrado client-side por fechas.
   * Se recalcula instantáneamente al cambiar fechas, sin re-fetch.
   * ===================================================== */
  const productosConStats = useMemo(() => {
    if (!products || products.length === 0) return [];

    return products.map((p) => {
      const ventas = ventasPorProducto[String(p._id)] || [];
      const ventasFiltradas = ventas.filter((v) =>
        estaDentroDelRango(v.fecha, startDate, endDate)
      );

      const totalCantidad = ventasFiltradas.reduce(
        (acc, v) => acc + (v.cantidad || 0),
        0
      );
      const totalIngresos = ventasFiltradas.reduce(
        (acc, v) => acc + (v.total || 0),
        0
      );

      return { ...p, totalCantidad, totalIngresos };
    });
  }, [ventasPorProducto, products, startDate, endDate]);

  /* =====================================================
   * resumenCategoria
   * ===================================================== */
  const resumenCategoria = useMemo(() => {
    const totalCantidad = productosConStats.reduce(
      (acc, p) => acc + (p.totalCantidad || 0),
      0
    );
    const totalIngresos = productosConStats.reduce(
      (acc, p) => acc + (p.totalIngresos || 0),
      0
    );
    const precioMedioUnidad =
      totalCantidad > 0 ? totalIngresos / totalCantidad : 0;

    return { totalCantidad, totalIngresos, precioMedioUnidad };
  }, [productosConStats]);

  /* =====================================================
   * estadisticasPorMesa, estadisticasPorHora, horaPunta
   * ===================================================== */
  const { estadisticasPorMesa, estadisticasPorHora, horaPunta } = useMemo(() => {
    const mesaMap = {};
    const horaMap = {};

    const todasLasVentas = Object.values(ventasPorProducto)
      .flat()
      .filter((venta) => estaDentroDelRango(venta.fecha, startDate, endDate));

    let maxIngresosHora = 0;
    let horaPuntaLocal = null;

    for (const venta of todasLasVentas) {
      const cantidad = venta.cantidad || 0;
      const total = venta.total || 0;
      const mesaKey = venta.mesaNumero ?? "Sin mesa";

      if (!mesaMap[mesaKey]) {
        mesaMap[mesaKey] = {
          mesa: mesaKey,
          totalCantidad: 0,
          totalIngresos: 0,
          numTickets: 0,
        };
      }
      mesaMap[mesaKey].totalCantidad += cantidad;
      mesaMap[mesaKey].totalIngresos += total;
      mesaMap[mesaKey].numTickets += 1;

      const hora = new Date(venta.fecha).getHours();
      if (!horaMap[hora]) {
        horaMap[hora] = { hour: hora, totalCantidad: 0, totalIngresos: 0 };
      }
      horaMap[hora].totalCantidad += cantidad;
      horaMap[hora].totalIngresos += total;

      if (horaMap[hora].totalIngresos > maxIngresosHora) {
        maxIngresosHora = horaMap[hora].totalIngresos;
        horaPuntaLocal = hora;
      }
    }

    return {
      estadisticasPorMesa: Object.values(mesaMap).sort(
        (a, b) => b.totalIngresos - a.totalIngresos
      ),
      estadisticasPorHora: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        totalCantidad: horaMap[hour]?.totalCantidad || 0,
        totalIngresos: horaMap[hour]?.totalIngresos || 0,
      })),
      horaPunta: horaPuntaLocal,
    };
  }, [ventasPorProducto, startDate, endDate]);

  /* =====================================================
   * topProductos
   * ===================================================== */
  const topProductos = useMemo(
    () =>
      [...productosConStats]
        .sort((a, b) => b.totalIngresos - a.totalIngresos)
        .slice(0, 5),
    [productosConStats]
  );

  return {
    loading,
    productosConStats,
    resumenCategoria,
    estadisticasPorMesa,
    estadisticasPorHora,
    topProductos,
    horaPunta,
  };
};
