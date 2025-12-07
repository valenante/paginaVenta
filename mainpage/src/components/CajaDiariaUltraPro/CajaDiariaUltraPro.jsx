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
  const [datos, setDatos] = useState([]);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  /* 🌅 Fechas iniciales */
  useEffect(() => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    setFechaInicio(primerDiaMes.toISOString().split("T")[0]);
    setFechaFin(manana.toISOString().split("T")[0]);
  }, []);

  /* 🔄 Cargar datos */
  const cargarDatos = async () => {
    try {
      const cajas = await obtenerCajasPorRango(fechaInicio, fechaFin);
      setDatos(cajas || []);
      setError(null);
    } catch (err) {
      setDatos([]);
      setError("Error al cargar datos.");
    }
  };

  useEffect(() => {
    if (fechaInicio && fechaFin) cargarDatos();
  }, [fechaInicio, fechaFin]);

  /* =============================
     📊 Cálculos derivados
  ============================= */
  const totalIngresos = useMemo(
    () => datos.reduce((acc, d) => acc + (d.total || 0), 0),
    [datos]
  );

  const totalTickets = useMemo(
    () => datos.reduce((acc, d) => acc + (d.numTickets || 0), 0),
    [datos]
  );

  const ticketMedio = totalTickets > 0 ? totalIngresos / totalTickets : 0;

  const diaMasFuerte = useMemo(() => {
    if (!datos.length) return null;
    return datos.reduce((a, b) => (a.total > b.total ? a : b));
  }, [datos]);

  const diaMasDebil = useMemo(() => {
    if (!datos.length) return null;
    return datos.reduce((a, b) => (a.total < b.total ? a : b));
  }, [datos]);

  /* =============================
     📈 Gráfico principal
  ============================= */
  const chartData = {
    labels: datos.map((d) =>
      new Date(d.createdAt).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
      })
    ),
    datasets: [
      {
        label: "Ingresos (€)",
        data: datos.map((d) => d.total),
        borderColor: "#6a0dad",
        backgroundColor: "rgba(106, 13, 173, 0.25)",
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  };

  /* =============================
     📅 Variación día a día
  ============================= */
  const variaciones = useMemo(() => {
    return datos.map((d, i) => {
      if (i === 0) return { ...d, variacion: 0 };
      const anterior = datos[i - 1].total;
      const diff = d.total - anterior;
      const pct = anterior > 0 ? (diff / anterior) * 100 : 0;
      return { ...d, variacion: pct };
    });
  }, [datos]);

  /* =============================
     🧾 Descargar PDF
  ============================= */
  const handlePDF = () => {
    const heatmapImg = document
      .querySelector("#heatmap-canvas")
      ?.toDataURL("image/png");

    const chartImg = chartRef?.current?.toBase64Image() ?? null;

    generarPDFCaja({
      datos,
      fechaInicio,
      fechaFin,
      heatmapDataURL: heatmapImg,
      chartDataURL: chartImg,
    });
  };
  return (
    <div className="caja-ultra-root">

      {/* ====== HEADER ====== */}
      <header className="caja-ultra-header">
        <div>
          <h1 className="caja-ultra-titulo">📊 Caja Diaria</h1>
          <p className="caja-ultra-sub">
            Control financiero completo del restaurante.
          </p>
        </div>

        <div className="caja-ultra-filtros">
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />

          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />

          <button onClick={cargarDatos}>Actualizar</button>
          <button className="pdf-btn" onClick={handlePDF}>
            Descargar PDF
          </button>
        </div>
      </header>

      {/* ====== RESUMEN KPI ====== */}
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
            <strong>
              {new Date(diaMasFuerte.createdAt).toLocaleDateString()}
            </strong>
            <small>{diaMasFuerte.total.toFixed(2)} €</small>
          </div>
        )}

        {diaMasDebil && (
          <div className="kpi-card worst">
            <span>Peor día</span>
            <strong>
              {new Date(diaMasDebil.createdAt).toLocaleDateString()}
            </strong>
            <small>{diaMasDebil.total.toFixed(2)} €</small>
          </div>
        )}
      </section>

      {/* ====== GRÁFICO ====== */}
      <section className="caja-ultra-chart">
        <Line ref={chartRef} data={chartData} />
      </section>

      {/* ====== LISTADO DIARIO ====== */}
      <section className="caja-ultra-lista">
        <h3>Días del periodo</h3>
        <ul>
          {variaciones.map((d) => (
            <li key={d._id} className="dia-item">
              <strong>
                {new Date(d.createdAt).toLocaleDateString()}
              </strong>

              <span>{d.total.toFixed(2)} €</span>

              <small>{d.numTickets} tickets</small>

              <span
                className={
                  "variacion " + (d.variacion >= 0 ? "up" : "down")
                }
              >
                {d.variacion >= 0 ? "+" : ""}
                {d.variacion.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ====== HEATMAP ====== */}
      <HeatmapSemana datos={datos} />
    </div>
  );
}
