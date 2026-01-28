import React, { useState, useEffect, useMemo, useRef } from "react";
import { obtenerCajasPorRango } from "./ObtenerCajasPorRango";
import UpsellEstadisticasPro from "../../components/Estadisticas/UpsellEstadisticasPro";
import { useAuth } from "../../context/AuthContext.jsx";
import { generarPDFCaja } from "./pdfs/pdfCajaUltraPro";
import { useTenant } from "../../context/TenantContext";
import HeatmapSemana from "./HeatMapSemana";
import CajaIngresosChart from "./CajaIngresosChart";
import DiasPeriodo from "./DiaDetalleModal/DiasPeriodo";
import "./CajaDiariaUltraPro.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const toISODateKey = (value) => {
  if (!value) return "";

  // Date object
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const s = String(value).trim();

  // "YYYY-MM-DD..." (ISO o similar)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // "DD/MM/YYYY"
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  // Último intento
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  return "";
};

const safeDateObjFromISO = (iso) => {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatFechaUI = (iso) => {
  const d = safeDateObjFromISO(iso);
  return d ? d.toLocaleDateString("es-ES") : "—";
};


export default function CajaDiariaUltraPro() {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [datos, setDatos] = useState([]); // datos horario (fecha + hora)
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const { user } = useAuth();
  const { tenant } = useTenant();
  const tipoNegocio = tenant?.tipoNegocio || "restaurante";
  const isPlanEsencial =
    tipoNegocio === "restaurante" &&
    (user?.plan === "esencial" || user?.plan === "tpv-esencial");

  /* 🌅 Fechas iniciales al abrir */
  useEffect(() => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);

    setFechaInicio(primerDiaMes.toISOString().split("T")[0]);
    setFechaFin(mañana.toISOString().split("T")[0]);
  }, []);

  /* 🔄 Cargar datos desde el backend */
  const cargarDatos = async () => {
    try {
      const cajas = await obtenerCajasPorRango(fechaInicio, fechaFin, tipoNegocio);

      setDatos(Array.isArray(cajas) ? cajas : []);
      setError(null);
    } catch (err) {
      console.error("[CAJA] ERROR:", err?.response?.status, err?.response?.data || err);
      setDatos([]);
      setError("Error al cargar datos.");
    }
  };


  useEffect(() => {
    if (fechaInicio && fechaFin) cargarDatos();
  }, [fechaInicio, fechaFin]);

  /* =========================================================================
      📌 AGREGACIÓN POR DÍA PARA KPIs, LISTA Y GRÁFICAS
     ========================================================================= */

  const datosDiarios = useMemo(() => {
    const map = {};

    datos.forEach((d) => {
      const fechaKey = toISODateKey(d.fecha);
      if (!fechaKey) return;

      if (!map[fechaKey]) {
        map[fechaKey] = {
          fecha: fechaKey,
          total: 0,
          numTickets: 0,
          mensajeCierre: d.mensajeCierre || null
        };
      }

      map[fechaKey].total += Number(d.total || 0);
      map[fechaKey].numTickets += Number(d.numTickets || 0);
    });

    return Object.values(map).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }, [datos]);

  /* KPI */
  const totalIngresos = useMemo(
    () => datosDiarios.reduce((acc, d) => acc + d.total, 0),
    [datosDiarios]
  );

  const totalTickets = useMemo(
    () => datosDiarios.reduce((acc, d) => acc + d.numTickets, 0),
    [datosDiarios]
  );

  const ticketMedio = totalTickets > 0 ? totalIngresos / totalTickets : 0;

  const diaMasFuerte = datosDiarios.length
    ? datosDiarios.reduce((a, b) => (a.total > b.total ? a : b))
    : null;

  const diaMasDebil = datosDiarios.length
    ? datosDiarios.reduce((a, b) => (a.total < b.total ? a : b))
    : null;

  /* =========================================================================
      📅 VARIACIONES DÍA A DÍA
     ========================================================================= */

  const variaciones = useMemo(() => {
    return datosDiarios.map((d, i) => {
      if (i === 0) return { ...d, variacion: 0 };
      const anterior = datosDiarios[i - 1].total;
      const diff = d.total - anterior;
      const pct = anterior > 0 ? (diff / anterior) * 100 : 0;
      return { ...d, variacion: pct };
    });
  }, [datosDiarios]);

  /* =========================================================================
      🧾 GENERAR PDF
     ========================================================================= */

  const handlePDF = () => {
    const el = document.querySelector("#heatmap-canvas");

    const heatmapImg =
      el && typeof el.toDataURL === "function"
        ? el.toDataURL("image/png")
        : null;

    const chartImg =
      chartRef?.current?.toBase64Image?.() ?? null;

    generarPDFCaja({
      datos: datosDiarios,
      fechaInicio,
      fechaFin,
      heatmapDataURL: heatmapImg,
      chartDataURL: chartImg,
      brand: {
        nombre: tenant?.nombre || "Alef",
        primary: "#60b5ff",
        accent: "#ff9149",
      },
    });
  };

  /* =========================================================================
      🖥️ RENDER
     ========================================================================= */

  return (
    <div className="caja-ultra-root">

      {/* HEADER */}
      <header className="caja-ultra-header">
        <div>
          <h1 className="caja-ultra-titulo">📊 Caja Diaria</h1>
          <p className="caja-ultra-sub">
            Control financiero del restaurante.
          </p>
        </div>

        <div className="caja-ultra-filtros">
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          {error && <div style={{ padding: 10, background: "#300", color: "#fff" }}>{error}</div>}
          {!error && datos.length === 0 && <div style={{ padding: 10 }}>No hay datos en este rango.</div>}

          <button onClick={cargarDatos}>Actualizar</button>

          {!isPlanEsencial && (
            <button className="pdf-btn" onClick={handlePDF}>Descargar PDF</button>
          )}
        </div>
      </header>

      {/* =====================================================
         GRAFICO → SIEMPRE VISIBLE PARA TODOS LOS PLANES
       ===================================================== */}
      <CajaIngresosChart
        ref={chartRef}
        datosDiarios={datosDiarios}
      />

      {/* =====================================================
         SI PLAN ESENCIAL → MOSTRAR SOLO EL UPSELL
       ===================================================== */}
      {isPlanEsencial && (
        <UpsellEstadisticasPro />
      )}

      {/* =====================================================
         SI PLAN PRO → MOSTRAR TODO LO DEMÁS
       ===================================================== */}
      {!isPlanEsencial && (
        <>
          {/* KPI */}
          <section className="caja-ultra-kpi">
            <div className="kpi-card">
              <span>Ingresos totales</span>
              <strong>{totalIngresos.toFixed(2)} €</strong>
            </div>

            <div className="kpi-card">
              <span>Total tickets</span>
              <strong>{totalTickets}</strong>
            </div>

            <div className="kpi-card">
              <span>Ticket medio</span>
              <strong>{ticketMedio.toFixed(2)} €</strong>
            </div>

            {diaMasFuerte && (
              <div className="kpi-card highlight">
                <span>Mejor día</span>
                <strong>{formatFechaUI(diaMasFuerte.fecha)}</strong>
                <small>{diaMasFuerte.total.toFixed(2)} €</small>
              </div>
            )}

            {diaMasDebil && (
              <div className="kpi-card worst">
                <span>Peor día</span>
                <strong>{formatFechaUI(diaMasDebil.fecha)}</strong>
                <small>{diaMasDebil.total.toFixed(2)} €</small>
              </div>
            )}
          </section>

          <DiasPeriodo dias={variaciones} />

          {/* HEATMAP */}
          <HeatmapSemana datos={datos} />
        </>
      )}
    </div>
  );
}
