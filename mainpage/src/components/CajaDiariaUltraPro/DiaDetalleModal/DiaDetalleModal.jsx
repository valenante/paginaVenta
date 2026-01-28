import React from "react";
import "./DiaDetalleModal.css";

const formatFechaUI = (iso) => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("es-ES");
};

export default function DiaDetalleModal({ dia, onClose }) {
  if (!dia) return null;

  return (
    <div className="diaModal-overlay" onClick={onClose}>
      <div
        className="diaModal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* HEADER */}
        <header className="diaModal-header">
          <div className="diaModal-header-text">
            <h2>Resumen del día</h2>
            <span>{formatFechaUI(dia.fecha)}</span>
          </div>

          <button
            className="diaModal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        {/* BODY */}
        <div className="diaModal-body">
          {/* KPIs */}
          <section className="diaModal-kpis">
            <div className="diaModal-kpi">
              <span>Total</span>
              <strong>{dia.total.toFixed(2)} €</strong>
            </div>

            <div className="diaModal-kpi">
              <span>Tickets</span>
              <strong>{dia.numTickets}</strong>
            </div>

            <div className="diaModal-kpi">
              <span>Variación</span>
              <strong className={dia.variacion >= 0 ? "up" : "down"}>
                {dia.variacion >= 0 ? "+" : ""}
                {dia.variacion.toFixed(1)}%
              </strong>
            </div>
          </section>

          {/* OBSERVACIONES */}
          {dia.mensajeCierre && (
            <section className="diaModal-observaciones">
              <h4>Observaciones</h4>
              <p>{dia.mensajeCierre}</p>
            </section>
          )}
        </div>

        {/* FOOTER */}
        <footer className="diaModal-footer">
          <button onClick={onClose}>Cerrar</button>
        </footer>
      </div>
    </div>
  );
}
