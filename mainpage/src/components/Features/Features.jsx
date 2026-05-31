// src/components/Features/Features.jsx
// Tier S — 5 features que cambian el negocio
import React from "react";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import "./Features.css";

const tierS = [
  {
    icono: "📱",
    kicker: "Carta digital inteligente",
    titulo: "Tu carta recomienda platos, se traduce sola y envía pedidos directo a cocina.",
    desc: "Carta QR con sugerencias basadas en lo que piden tus clientes, traducción automática para turistas, y pedido directo a cocina desde el móvil del cliente. Sin camarero intermediario.",
  },
  {
    icono: "📅",
    kicker: "Reservas y fidelización",
    titulo: "Reservas confirmadas automáticamente. Clientes que vuelven.",
    desc: "Sistema de reservas con confirmación automática y recordatorio 24h al cliente. Programa de fidelidad con puntos y recompensas que hace que tus clientes repitan.",
  },
  {
    icono: "📊",
    kicker: "Decisiones con datos reales",
    titulo: "Sabe qué platos vender más, qué horarios reforzar y qué quitar de la carta.",
    desc: "Ventas por hora, productos estrella vs productos muertos, tendencias semanales, previsión de demanda. Información clara para tomar decisiones de negocio, no intuiciones.",
  },
  {
    icono: "📦",
    kicker: "Stock que se gestiona solo",
    titulo: "Predice tu consumo, genera pedidos y evita que te falte producto.",
    desc: "ALEF analiza 8 semanas de histórico y reservas confirmadas para predecir qué vas a necesitar. Cuando algo va a faltar, genera el pedido al proveedor automáticamente.",
  },
  {
    icono: "✅",
    kicker: "VeriFactu incluido",
    titulo: "Cumples la normativa fiscal sin contratar nada aparte.",
    desc: "Facturación certificada con hash antifraude, numeración encadenada y preparada para envío automático a la AEAT. Obligatorio desde julio 2027 — ALEF ya lo tiene.",
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
