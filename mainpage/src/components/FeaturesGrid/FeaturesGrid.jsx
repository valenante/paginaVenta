import React from "react";
import "./FeaturesGrid.css";

const areas = [
  { icono: "💳", titulo: "TPV táctil", desc: "Cobros, mesas, comandas, propinas, cierres de caja. Todo desde un tablet." },
  { icono: "📦", titulo: "Control de stock", desc: "Inventario actualizado con cada venta, alertas de reposición, pedidos automáticos." },
  { icono: "📊", titulo: "Costes y márgenes", desc: "Escandallo por plato, margen real en tiempo real, impacto de cambios de precio." },
  { icono: "📧", titulo: "Facturación automática", desc: "Facturas de proveedor procesadas automáticamente. VeriFactu incluido." },
  { icono: "🍳", titulo: "Cocina inteligente", desc: "Pantallas por estación, tiempos de preparación, predicción de pedidos." },
  { icono: "📱", titulo: "Carta digital QR", desc: "Menú actualizado al instante, multiidioma, pedidos directos a cocina." },
  { icono: "🛒", titulo: "Compras y proveedores", desc: "Pedidos automáticos, comparativa de precios, historial de costes." },
  { icono: "👥", titulo: "Personal y turnos", desc: "Calendario de turnos, control de horas, sugerencias basadas en demanda." },
  { icono: "📈", titulo: "Informes y estadísticas", desc: "Ventas, productos estrella, horas punta, comparativas y tendencias." },
];

export default function FeaturesGrid() {
  return (
    <section className="FGrid" id="mas-funciones">
      <div className="FGrid-inner">
        <span className="FGrid-kicker">Una plataforma. Todo lo que necesitas.</span>
        <h2 className="FGrid-titulo">Cada área de tu restaurante, conectada</h2>
        <p className="FGrid-sub">Sin módulos extra. Sin costes ocultos. Todo incluido desde el primer día.</p>

        <div className="FGrid-grid">
          {areas.map((m, i) => (
            <div key={i} className="FGrid-card">
              <span className="FGrid-card-icon">{m.icono}</span>
              <div>
                <h3 className="FGrid-card-title">{m.titulo}</h3>
                <p className="FGrid-card-desc">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
