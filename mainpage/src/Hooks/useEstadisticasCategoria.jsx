// src/hooks/useEstadisticasCategoria.js
import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";

export const useEstadisticasCategoria = (products, selectedDate) => {
  const [loading, setLoading] = useState(false);
  const [ventasPorProducto, setVentasPorProducto] = useState({});
  const [productosConStats, setProductosConStats] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      if (!products || products.length === 0) {
        setVentasPorProducto({});
        setProductosConStats([]);
        return;
      }

      setLoading(true);
      try {
        // 1️⃣ Obtener TODAS las ventas del tenant
        const { data: ventasTodas } = await api.get("/ventas");

        console.log(ventasTodas);

        // 2️⃣ Filtrar ventas SOLO de los productos de esta categoría
        const idsProductos = products.map(p => String(p._id));

        const ventasCategoria = ventasTodas.filter(v =>
          idsProductos.includes(String(v.producto?._id))
        );

        // 3️⃣ Agrupar ventas por producto (correcto)
        const ventasMap = {};
        for (const p of products) {
          ventasMap[p._id] = ventasCategoria.filter(
            v => String(v.producto?._id) === String(p._id)
          );
        }

        setVentasPorProducto(ventasMap);

        // 4️⃣ Stats por producto
        const stats = products.map(p => {
          const ventas = ventasMap[p._id] || [];

          const ventasFiltradas = selectedDate
            ? ventas.filter(v =>
              new Date(v.fecha).toDateString() ===
              selectedDate.toDateString()
            )
            : ventas;

          const totalCantidad = ventasFiltradas.reduce(
            (acc, v) => acc + (v.cantidad || 0),
            0
          );

          const totalIngresos = ventasFiltradas.reduce(
            (acc, v) => acc + (v.total || 0),
            0
          );

          return {
            ...p,
            totalCantidad,
            totalIngresos,
          };
        });

        setProductosConStats(stats);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [products, selectedDate]);

  // ==== Resumen categoría ====
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

  // ==== Por mesa / hora ====
  const { estadisticasPorMesa, estadisticasPorHora, horaPunta } = useMemo(() => {
    const mesaMap = {};
    const horaMap = {};
    const todasLasVentas = Object.values(ventasPorProducto).flat();

    let maxIngresosHora = 0;
    let horaPuntaLocal = null;

    for (const venta of todasLasVentas) {
      if (!venta) continue;

      const cantidad = venta.cantidad || 0;
      const total = venta.total || 0;

      const mesaKey = venta.mesaNumero || "Sin mesa";

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

      const fecha = venta.fecha ? new Date(venta.fecha) : null;
      const hora = fecha ? fecha.getHours() : null;

      if (hora !== null) {
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
  }, [ventasPorProducto]);

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
