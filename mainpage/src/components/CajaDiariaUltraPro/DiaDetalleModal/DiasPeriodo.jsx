import React, { useState } from "react";
import DiaDetalleModal from "./DiaDetalleModal";
import "./DiasPeriodo.css";

const formatFechaUI = (iso) => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("es-ES");
};

export default function DiasPeriodo({ dias }) {
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  return (
    <section className="caja-ultra-lista">
      <h3>Días del periodo</h3>

      <ul className="dias-periodo-list">
        {dias.map((d) => (
          <li key={d.fecha} className="dia-item">
            {/* =========================
               FECHA (siempre visible)
            ========================== */}
            <strong className="dia-fecha">
              {formatFechaUI(d.fecha)}
            </strong>

            {/* =========================
               DESKTOP
            ========================== */}
            <div className="dia-desktop">
              <span className="dia-total">
                {d.total.toFixed(2)} €
              </span>

              <small className="dia-tickets">
                {d.numTickets} tickets
              </small>

              <div className="dia-mensaje-col">
                {d.mensajeCierre && (
                  <div className="mensaje-cierre" title={d.mensajeCierre}>
                    📝 {d.mensajeCierre}
                  </div>
                )}
              </div>

              <span
                className={
                  "variacion " + (d.variacion >= 0 ? "up" : "down")
                }
              >
                {d.variacion >= 0 ? "+" : ""}
                {d.variacion.toFixed(1)}%
              </span>
            </div>

            {/* =========================
               MOBILE
            ========================== */}
            <div className="dia-mobile">
              <button
                className="btn-ver-dia"
                onClick={() => setDiaSeleccionado(d)}
              >
                Ver más
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* =========================
         MODAL DETALLE DÍA
      ========================== */}
      {diaSeleccionado && (
        <DiaDetalleModal
          dia={diaSeleccionado}
          onClose={() => setDiaSeleccionado(null)}
        />
      )}
    </section>
  );
}
