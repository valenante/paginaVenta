import React, { useMemo } from "react";
import "./HeatMapSemana.css";

/**
 * Espera datos en formato:
 * [
 *   {
 *     createdAt: "2025-02-10T21:30:00.000Z",
 *     total: 120.50,
 *     numTickets: 4
 *   },
 *   ...
 * ]
 */

const HeatmapSemana = ({ datos }) => {
  // Generar mapa [dia][hora] = ingresos
  const mapa = useMemo(() => {
    const estructura = {};

    datos.forEach((d) => {
      const fecha = new Date(d.createdAt);
      const dia = fecha.getDay();     // 0-6 (domingo-sábado)
      const hora = fecha.getHours();  // 0-23

      if (!estructura[dia]) estructura[dia] = {};
      if (!estructura[dia][hora]) estructura[dia][hora] = 0;

      estructura[dia][hora] += d.total;
    });

    return estructura;
  }, [datos]);

  // Buscar valor máximo para escalar colores
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
              const intensidad =
                maxValor > 0 ? (valor / maxValor) : 0;

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
