import React, { forwardRef, useMemo } from "react";
import { Line } from "react-chartjs-2";
import "./CajaIngresosChart.css";

const CajaIngresosChart = forwardRef(({ datosDiarios }, ref) => {
  const isMobile = window.innerWidth < 768;

  /* =====================================================
     DATOS (mobile vs desktop)
     ===================================================== */

  const datosGrafico = useMemo(() => {
    return isMobile ? datosDiarios.slice(-7) : datosDiarios;
  }, [datosDiarios, isMobile]);

  /* =====================================================
     DATASET
     ===================================================== */

  const chartData = useMemo(() => {
    return {
      labels: datosGrafico.map((d) =>
        new Date(d.fecha).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
        })
      ),
      datasets: [
        {
          label: isMobile ? undefined : "Ingresos (€)",
          data: datosGrafico.map((d) => d.total),
          borderColor: "#6a0dad",
          backgroundColor: "rgba(106, 13, 173, 0.25)",
          tension: 0.35,
          borderWidth: 3,
          pointRadius: isMobile ? 0 : 5,
          pointHoverRadius: 6,
          fill: true,
        },
      ],
    };
  }, [datosGrafico, isMobile]);

  /* =====================================================
     OPCIONES
     ===================================================== */

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: !isMobile,
          labels: {
            color: "#e5e7eb",
            font: {
              size: 12,
              weight: "600",
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(20,20,35,0.95)",
          titleColor: "#fff",
          bodyColor: "#e5e7eb",
          borderColor: "rgba(255,255,255,0.15)",
          borderWidth: 1,
          padding: 10,
        },
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: isMobile ? 5 : 12,
            color: "#cbd5e1",
            font: {
              size: 11,
            },
          },
          grid: {
            display: false,
          },
        },
        y: {
          ticks: {
            color: "#cbd5e1",
            font: { size: 11 },
            callback: (value) => `${Number(value).toFixed(2)} €`,
          },
          grid: {
            color: "rgba(255,255,255,0.08)",
          },
        },
      },
    };
  }, [isMobile]);

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <section className={`caja-ingresos-chart ${isMobile ? "mobile" : ""}`}>
      <header className="chart-header">
        <h3>Ingresos diarios</h3>
        {!isMobile && <span>Evolución del periodo seleccionado</span>}
        {isMobile && <span>Últimos 7 días</span>}
      </header>

      <div className="chart-wrapper">
        <Line ref={ref} data={chartData} options={chartOptions} />
      </div>
    </section>
  );
});

export default CajaIngresosChart;
