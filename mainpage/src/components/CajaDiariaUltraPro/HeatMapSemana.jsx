import React, { useMemo, useState, useEffect, useCallback } from "react";
import "./HeatMapSemana.css";

/**
 * Espera datos en formato:
 * [
 *   { fecha: "2025-12-08", hora: 23, total: 14.40, numTickets: 1, diaSemana?: 1..6 }
 * ]
 */

const HeatmapSemana = ({ datos = [] }) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 700);
  const [showFullMobile, setShowFullMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Si pasas a desktop, no hace falta “modo expandido”
  useEffect(() => {
    if (!isMobile) setShowFullMobile(false);
  }, [isMobile]);

  // Construir estructura [dia][hora] = totalIngresos
  const mapa = useMemo(() => {
    const estructura = {};

    datos.forEach((d) => {
      const dia = Number.isFinite(d.diaSemana)
        ? d.diaSemana
        : new Date(`${d.fecha}T00:00:00`).getDay();

      const hora = Number(d.hora);
      if (!Number.isFinite(dia) || !Number.isFinite(hora)) return;

      if (!estructura[dia]) estructura[dia] = {};
      if (!estructura[dia][hora]) estructura[dia][hora] = 0;

      estructura[dia][hora] += Number(d.total || 0);
    });

    return estructura;
  }, [datos]);

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
        horas.push({ dia: Number(dia), hora: Number(hora), total });
      });
    });

    horas.sort((a, b) => b.total - a.total);

    return {
      topHoras: horas.slice(0, 3),
      mejorDia: horas[0]?.dia,
    };
  }, [mapa]);

  const renderGrid = useCallback(
    (extraClass = "") => (
      <div className={`heatmap-grid ${extraClass}`}>
        {/* Cabecera días */}
        <div className="heatmap-label-col" />
        {diasSemana.map((d) => (
          <div key={d} className="heatmap-label">
            {d}
          </div>
        ))}

        {/* Filas por hora */}
        {[...Array(24)].map((_, hora) => (
          <React.Fragment key={hora}>
            <div className="heatmap-hour-label">
              {hora.toString().padStart(2, "0")}:00
            </div>

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
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    ),
    [diasSemana, mapa, maxValor]
  );

  return (
    <section className="heatmap-root">
      <header className="heatmap-header">
        <h3>Mapa de calor (ventas por hora)</h3>
        <p>Identifica los patrones fuertes durante la semana.</p>
      </header>

      {/* ===============================
        📱 MÓVIL
       =============================== */}
      {isMobile ? (
        <>
          {!showFullMobile ? (
            <div className="heatmap-mobile-summary">
              <div className="heatmap-insight">
                🔥 <strong>Horas más fuertes</strong>
              </div>

              {resumenMovil.topHoras.map((h, i) => (
                <div key={i} className="heatmap-mobile-row">
                  <span>
                    {diasSemana[h.dia]} · {h.hora.toString().padStart(2, "0")}:00
                  </span>
                  <strong>{h.total.toFixed(2)} €</strong>
                </div>
              ))}

              <button
                className="heatmap-expand-btn"
                onClick={() => setShowFullMobile(true)}
                type="button"
              >
                Ver mapa completo
              </button>
            </div>
          ) : (
            <div className="heatmap-mobile-full">
              <div className="heatmap-mobile-full-head">
                <div className="heatmap-insight">🗓️ Mapa completo</div>

                <button
                  type="button"
                  className="heatmap-close-btn"
                  onClick={() => setShowFullMobile(false)}
                >
                  Cerrar
                </button>
              </div>

              {renderGrid("heatmap-grid--mobile")}
            </div>
          )}
        </>
      ) : (
        /* ===============================
           🖥️ DESKTOP — GRID COMPLETO
         =============================== */
        renderGrid("")
      )}
    </section>
  );
};

export default HeatmapSemana;
