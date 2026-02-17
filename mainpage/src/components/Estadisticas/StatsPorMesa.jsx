// src/pages/Estadisticas/components/StatsPorMesa.jsx
import React from "react";
import "./StatsPorMesa.css";

const money = (n) => (Number(n || 0)).toFixed(2);

const StatsPorMesa = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <section className="statsmesa-container">
        <header className="statsmesa-header">
          <h3>Estadísticas por mesa</h3>
        </header>
        <p className="statsmesa-empty">No hay ventas para este filtro.</p>
      </section>
    );
  }

  return (
    <section className="statsmesa-container">
      <header className="statsmesa-header">
        <div className="statsmesa-title">
          <h3>Estadísticas por mesa</h3>
          <p className="statsmesa-desc">Mesas ordenadas por ingresos generados.</p>
        </div>

        <span className="statsmesa-badge">{data.length} mesas</span>
      </header>

      <div className="statsmesa-table-wrapper">
        <table className="statsmesa-table">
          <thead>
            <tr>
              <th>Mesa</th>
              <th>Tickets</th>
              <th>Unidades</th>
              <th>Ingresos</th>
              <th>Ticket medio</th>
            </tr>
          </thead>

          <tbody>
            {data.map((mesa) => {
              const ticketMedio =
                mesa.numTickets > 0 ? mesa.totalIngresos / mesa.numTickets : 0;

              return (
                <tr key={mesa.mesa}>
                  <td data-label="Mesa" className="mesa-name">
                    Mesa {mesa.mesa}
                  </td>

                  <td data-label="Tickets" className="stats-num">
                    {mesa.numTickets}
                  </td>

                  <td data-label="Unidades" className="stats-num">
                    {mesa.totalCantidad}
                  </td>

                  <td data-label="Ingresos" className="stats-money">
                    {money(mesa.totalIngresos)} €
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

export default StatsPorMesa;
