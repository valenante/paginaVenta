import './PanelPrecio.css';

export default function PanelPrecio({ precio }) {
  return (
    <aside className="panel-precio">
      <h3>💶 Resumen de precios</h3>
      <p><strong>Suscripción mensual:</strong> {precio.mensual.toFixed(2)} €</p>
      <p><strong>Coste único inicial:</strong> {precio.unico.toFixed(2)} €</p>
      <hr />
      <p className="total-primer-mes">
        <strong>Total primer mes:</strong> {precio.totalPrimerMes.toFixed(2)} €
      </p>
    </aside>
  );
}
