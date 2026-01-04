import React, { useMemo, useState, useEffect } from "react";
import "./HeatMapSemana.css";

/**
 * Espera datos en formato:
 * [
 *   {
 *     fecha: "2025-12-08",
 *     hora: 23,
 *     total: 14.40,
 *     numTickets: 1
 *   },
 *   ...
 * ]
 */

const HeatmapSemana = ({ datos }) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 700);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 700);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Construir estructura [dia][hora] = totalIngresos
  const mapa = useMemo(() => {
    const estructura = {};

    datos.forEach((d) => {
      // Convertimos la fecha a Date
      const fechaObj = new Date(`${d.fecha}T${d.hora}:00:00`);
      const dia = fechaObj.getDay();   // 0-6 → Domingo-Sábado
      const hora = d.hora;            // 0–23

      if (!estructura[dia]) estructura[dia] = {};
      if (!estructura[dia][hora]) estructura[dia][hora] = 0;

      estructura[dia][hora] += d.total;
    });

    return estructura;
  }, [datos]);

  // Valor máximo para escalar intensidad del color
  const maxValor = useMemo(() => {
    let max = 0;
    Object.values(mapa).forEach((horas) => {
      Object.values(horas).forEach((v) => {
        if (v > max) max = v;
      });
    });
    return max;
  }, [mapa]);

  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const resumenMovil = useMemo(() => {
    const horas = [];

    Object.entries(mapa).forEach(([dia, horasDia]) => {
      Object.entries(horasDia).forEach(([hora, total]) => {
        horas.push({
          dia: Number(dia),
          hora: Number(hora),
          total,
        });
      });
    });

    horas.sort((a, b) => b.total - a.total);

    return {
      topHoras: horas.slice(0, 3),
      mejorDia: horas[0]?.dia,
    };
  }, [mapa]);

  return (
    <section className="heatmap-root">
      <header className="heatmap-header">
        <h3>Mapa de calor (ventas por hora)</h3>
        <p>Identifica los patrones fuertes durante la semana.</p>
      </header>

      {/* ===============================
        📱 MODO MÓVIL — RESUMEN PRO
       =============================== */}
      {isMobile ? (
        <div className="heatmap-mobile-summary">
          <div className="heatmap-insight">
            🔥 <strong>Horas más fuertes</strong>
          </div>

          {resumenMovil.topHoras.map((h, i) => (
            <div key={i} className="heatmap-mobile-row">
              <span>
                {diasSemana[h.dia]} ·{" "}
                {h.hora.toString().padStart(2, "0")}:00
              </span>
              <strong>{h.total.toFixed(2)} €</strong>
            </div>
          ))}

          <button
            className="heatmap-expand-btn"
            onClick={() => {
              // FUTURO: abrir modal fullscreen
              console.log("Abrir heatmap completo");
            }}
          >
            Ver mapa completo
          </button>
        </div>
      ) : (
        /* ===============================
            🖥️ DESKTOP — GRID COMPLETO
           =============================== */
        <div className="heatmap-grid">
          {/* Cabecera días */}
          <div className="heatmap-label-col"></div>
          {diasSemana.map((d) => (
            <div key={d} className="heatmap-label">
              {d}
            </div>
          ))}

          {/* Filas por hora */}
          {[...Array(24)].map((_, hora) => (
            <React.Fragment key={hora}>
              {/* Etiqueta hora */}
              <div className="heatmap-hour-label">
                {hora.toString().padStart(2, "0")}:00
              </div>

              {/* Celdas por día */}
              {diasSemana.map((_, diaIndex) => {
                const valor = mapa[diaIndex]?.[hora] || 0;
                const intensidad = maxValor > 0 ? valor / maxValor : 0;

                return (
                  <div
                    key={`${diaIndex}-${hora}`}
                    className="heatmap-cell"
                    style={{
                      backgroundColor: `rgba(106, 13, 173, ${0.08 + intensidad * 0.9
                        })`,
                      boxShadow:
                        intensidad > 0.8
                          ? "0 0 8px rgba(255, 103, 0, 0.4)"
                          : "none",
                    }}
                    title={`${diasSemana[diaIndex]} ${hora}:00 — ${valor.toFixed(
                      2
                    )} €`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      )}
    </section>
  );
};

export default HeatmapSemana;
