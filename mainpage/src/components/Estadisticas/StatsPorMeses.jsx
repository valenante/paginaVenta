// src/components/Estadisticas/StatsPorMeses.jsx
import React from "react";
import "./StatsPorMeses.css";

const money = (n) => (Number(n || 0)).toFixed(2);

const MESES_LABEL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const formatMesLabel = (mesKey) => {
  if (!mesKey) return mesKey;
  const [yyyy, mm] = String(mesKey).split("-");
  const idx = Number(mm) - 1;
  return `${MESES_LABEL[idx] || mm} ${yyyy}`;
};

const StatsPorMeses = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <section className="statsmeses-container">
        <header className="statsmeses-header">
          <h3>Estadísticas por mes</h3>
        </header>
        <p className="statsmeses-empty">No hay ventas para este filtro.</p>
      </section>
    );
  }

  return (
    <section className="statsmeses-container">
      <header className="statsmeses-header">
        <div className="statsmeses-title">
          <h3>Estadísticas por mes</h3>
          <p className="statsmeses-desc">Meses ordenados por ingresos generados.</p>
        </div>

        <span className="statsmeses-badge">{data.length} meses</span>
      </header>

      <div className="statsmeses-table-wrapper">
        <table className="statsmeses-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Tickets</th>
              <th>Unidades</th>
              <th>Ingresos</th>
              <th>Ticket medio</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row) => {
              const ticketMedio =
                row.numTickets > 0 ? row.totalIngresos / row.numTickets : 0;

              return (
                <tr key={row.mes}>
                  <td data-label="Mes" className="mesa-name">
                    {formatMesLabel(row.mes)}
                  </td>

                  <td data-label="Tickets" className="stats-num">
                    {row.numTickets}
                  </td>

                  <td data-label="Unidades" className="stats-num">
                    {row.totalCantidad}
                  </td>

                  <td data-label="Ingresos" className="stats-money">
                    {money(row.totalIngresos)} €
                  </td>

                  <td data-label="Ticket medio" className="stats-money">
                    {money(ticketMedio)} €
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default StatsPorMeses;
