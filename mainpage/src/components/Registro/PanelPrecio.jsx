import "./PanelPrecio.css";

export default function PanelPrecio({ precio, periodo = "mensual" }) {
  // 👉 Precio anual calculado si no viene desde backend:
  const precioAnual = precio.mensual * 11; // 1 mes gratis

  // 👉 Total hoy según período
  const totalHoy =
    periodo === "mensual"
      ? precio.totalPrimerMes
      : precio.unico + precioAnual;

  return (
    <aside className="panel-precio card">
      <header className="panel-precio-header">
        <div className="panel-precio-title">
          <div className="panel-precio-icon">💶</div>
          <div>
            <h3>Resumen de precios</h3>
            <p className="panel-precio-sub">
              Vista rápida del coste de alta
            </p>
          </div>
        </div>

        <span className="panel-precio-tag">
          Estimado para tu alta
        </span>
      </header>

      <div className="panel-precio-body">

        {/* === Tipo de suscripción === */}
        <div className="panel-precio-row">
          <span className="row-label">
            {periodo === "mensual"
              ? "Suscripción mensual"
              : "Suscripción anual"}
          </span>

          <span className="row-amount">
            {periodo === "mensual"
              ? `${precio.mensual.toFixed(2)} €/mes`
              : `${precioAnual.toFixed(2)} € (1 mes gratis)`}
          </span>
        </div>

        {/* === Coste uno único === */}
        <div className="panel-precio-row">
          <span className="row-label">Coste único inicial</span>
          <span className="row-amount">
            {precio.unico.toFixed(2)} €
          </span>
        </div>

        <div className="panel-precio-divider" />

        {/* === TOTAL === */}
        <div className="panel-precio-row panel-precio-row--total">
          <span className="row-label">
            {periodo === "mensual"
              ? "Total primer mes"
              : "Total hoy"}
          </span>

          <span className="row-amount row-amount--total">
            {totalHoy.toFixed(2)} €
          </span>
        </div>
      </div>

      <p className="panel-precio-help">
        Sin permanencia. Podrás ajustar tu plan y servicios desde el panel
        de Alef cuando lo necesites.
      </p>
    </aside>
  );
}
