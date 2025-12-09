import React, { useMemo } from "react";
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

  return (
    <section className="heatmap-root">
      <header className="heatmap-header">
        <h3>Mapa de calor (ventas por hora)</h3>
        <p>Identifica los patrones fuertes durante la semana.</p>
      </header>

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
                    backgroundColor: `rgba(106, 13, 173, ${0.08 + intensidad * 0.9})`,
                    boxShadow:
                      intensidad > 0.8
                        ? "0 0 8px rgba(255, 103, 0, 0.4)"
                        : "none",
                  }}
                  title={`${diasSemana[diaIndex]} ${hora}:00 — ${valor.toFixed(2)} €`}
                ></div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default HeatmapSemana;
