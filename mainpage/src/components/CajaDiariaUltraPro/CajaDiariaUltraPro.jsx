import React, { useState, useEffect, useMemo, useRef } from "react";
import { Line } from "react-chartjs-2";
import { obtenerCajasPorRango } from "./ObtenerCajasPorRango";
import { generarPDFCaja } from "./pdfs/pdfCajaUltraPro";
import HeatmapSemana from "./HeatMapSemana";
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

export default function CajaDiariaUltraPro() {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [datos, setDatos] = useState([]); // datos horario (fecha + hora)
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

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
      const cajas = await obtenerCajasPorRango(fechaInicio, fechaFin);
      setDatos(cajas || []);
      setError(null);
    } catch (err) {
      console.error(err);
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
      if (!map[d.fecha]) {
        map[d.fecha] = {
          fecha: d.fecha,
          total: 0,
          numTickets: 0,
        };
      }
      map[d.fecha].total += d.total;
      map[d.fecha].numTickets += d.numTickets;
    });

    // Convertimos a array ordenado por fecha
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
      📈 GRÁFICO
     ========================================================================= */

  const chartData = {
    labels: datosDiarios.map((d) =>
      new Date(d.fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
      })
    ),
    datasets: [
      {
        label: "Ingresos (€)",
        data: datosDiarios.map((d) => d.total),
        borderColor: "#6a0dad",
        backgroundColor: "rgba(106, 13, 173, 0.25)",
        tension: 0.3,
        borderWidth: 3,
        pointRadius: 5,
      },
    ],
  };

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
    const heatmapImg = document
      .querySelector("#heatmap-canvas")
      ?.toDataURL("image/png");

    const chartImg = chartRef?.current?.toBase64Image() ?? null;

    generarPDFCaja({
      datos: datosDiarios,
      fechaInicio,
      fechaFin,
      heatmapDataURL: heatmapImg,
      chartDataURL: chartImg,
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
          <p className="caja-ultra-sub">Control financiero completo del restaurante.</p>
        </div>

        <div className="caja-ultra-filtros">
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />

          <button onClick={cargarDatos}>Actualizar</button>
          <button className="pdf-btn" onClick={handlePDF}>Descargar PDF</button>
        </div>
      </header>

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
            <strong>{new Date(diaMasFuerte.fecha).toLocaleDateString()}</strong>
            <small>{diaMasFuerte.total.toFixed(2)} €</small>
          </div>
        )}

        {diaMasDebil && (
          <div className="kpi-card worst">
            <span>Peor día</span>
            <strong>{new Date(diaMasDebil.fecha).toLocaleDateString()}</strong>
            <small>{diaMasDebil.total.toFixed(2)} €</small>
          </div>
        )}
      </section>

      {/* GRÁFICO */}
      <section className="caja-ultra-chart">
        <Line ref={chartRef} data={chartData} />
      </section>

      {/* LISTA DIARIA */}
      <section className="caja-ultra-lista">
        <h3>Días del periodo</h3>
        <ul>
          {variaciones.map((d) => (
            <li key={d.fecha} className="dia-item">
              <strong>{new Date(d.fecha).toLocaleDateString()}</strong>
              <span>{d.total.toFixed(2)} €</span>
              <small>{d.numTickets} tickets</small>
              <span className={"variacion " + (d.variacion >= 0 ? "up" : "down")}>
                {d.variacion >= 0 ? "+" : ""}
                {d.variacion.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* HEATMAP */}
      <HeatmapSemana datos={datos} />
    </div>
  );
}
