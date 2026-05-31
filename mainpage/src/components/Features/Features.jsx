// src/components/Features/Features.jsx
// Tier S — 5 features que cambian el negocio
import React from "react";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import "./Features.css";

const tierS = [
  {
    icono: "📧",
    kicker: "Deja de cargar facturas a mano",
    titulo: "Tu proveedor envía una factura. Tu stock se actualiza solo.",
    desc: "Cada factura que llega por email se procesa automáticamente. Se extraen los productos, las cantidades y los precios. Tu inventario y tus costes se actualizan sin que tú hagas nada.",
  },
  {
    icono: "🛡️",
    kicker: "Protege tus márgenes",
    titulo: "Si un proveedor sube precios, lo sabes al momento. No al final de mes.",
    desc: "El sistema detecta automáticamente cambios de precio, calcula qué platos pierden margen y te sugiere a cuánto ajustar el precio para mantener tu rentabilidad.",
  },
  {
    icono: "📦",
    kicker: "Cero roturas de stock",
    titulo: "Evita quedarte sin producto un viernes por la noche.",
    desc: "ALEF predice tu consumo de los próximos 7 días basándose en histórico y reservas confirmadas. Cuando algo va a faltar, genera el pedido al proveedor automáticamente.",
  },
  {
    icono: "📊",
    kicker: "Control real de tu negocio",
    titulo: "Sabe qué platos te hacen ganar dinero. Y cuáles no.",
    desc: "Margen real por producto, costes actualizados, P&L mensual y análisis de rentabilidad — todo calculado con datos reales de tu operativa. Sin esperar al cierre de mes.",
  },
  {
    icono: "🍽️",
    kicker: "Cocina y sala conectadas",
    titulo: "Menos errores. Mejor servicio. Más control.",
    desc: "Comandas en tiempo real, tiempos de preparación controlados por estación, comunicación directa entre equipos. Tu cocina sabe qué viene antes de que llegue el pedido.",
  },
];

const Features = () => {
  useRevealOnScroll();

  return (
    <section className="Feat reveal" id="ventajas">
      <div className="Feat-inner">
        <span className="Feat-kicker">Lo que cambia cuando todo funciona conectado</span>
        <h2 className="Feat-titulo">Resultados desde la primera semana</h2>

        <div className="Feat-stack">
          {tierS.map((f, i) => (
            <div key={i} className={`Feat-card ${i % 2 !== 0 ? "Feat-card--reverse" : ""}`}>
              <div className="Feat-card-visual">
                <span className="Feat-card-emoji">{f.icono}</span>
              </div>
              <div className="Feat-card-text">
                <span className="Feat-card-kicker">{f.kicker}</span>
                <h3 className="Feat-card-title">{f.titulo}</h3>
                <p className="Feat-card-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
