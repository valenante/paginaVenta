// src/components/Features/Features.jsx
// Tier S — 5 features que cambian el negocio
import React from "react";
import { Link } from "react-router-dom";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import "./Features.css";

const tierS = [
  {
    icono: "📄",
    kicker: "Facturas que se procesan solas",
    titulo: "Tu proveedor envía factura por email. ALEF la lee, extrae productos y actualiza stock y costes.",
    desc: "Si la factura llega en papel, la escaneas con el móvil. Productos, precios y cantidades se cargan automáticamente. La documentación se envía sola a tu gestoría. Ningún otro TPV del mercado hace esto.",
    link: "/facturacion-automatica-restaurante",
  },
  {
    icono: "🎯",
    kicker: "Tu carta se optimiza sola",
    titulo: "Cada semana analiza qué platos venden mucho y dan margen, y cuáles no. Y te dice qué hacer.",
    desc: "Te dice qué promocionar, qué subir de precio, qué potenciar y qué eliminar de la carta. Decisiones basadas en datos reales de tu negocio, no en intuición.",
    link: "/automatizacion-restaurante",
  },
  {
    icono: "📦",
    kicker: "Stock predictivo con pedidos automáticos",
    titulo: "Analiza 8 semanas de histórico, reservas y clima. Genera el pedido al proveedor antes de que te falte.",
    desc: "No es un simple control de stock con alertas. Es predicción real: sabe que el viernes necesitarás más entrecot porque hay 12 reservas y hace sol. El pedido se genera solo.",
    link: "/stock-predictivo-restaurante",
  },
  {
    icono: "🛡️",
    kicker: "Protección de márgenes",
    titulo: "Si un proveedor sube un 10%, el sistema te alerta al momento y te dice qué platos pierden rentabilidad.",
    desc: "Antes de que te des cuenta, sabes exactamente cuánto margen pierdes, en qué platos y qué opciones tienes: subir precio, cambiar proveedor o sacar el plato. Decisión informada, no sorpresa a final de mes.",
    link: "/stock-predictivo-restaurante",
  },
  {
    icono: "🤖",
    kicker: "Copilot IA para hostelería",
    titulo: "Pregúntale al sistema en lenguaje normal. Responde con datos reales de tu negocio.",
    desc: "\"¿Qué plato me da más margen?\" \"¿Cuánto vendí el sábado?\" \"¿Qué proveedor me sale más caro?\" No necesitas buscar en informes — preguntas y el sistema responde con tus datos reales.",
    link: "/automatizacion-restaurante",
  },
];

const Features = () => {
  useRevealOnScroll();

  return (
    <section className="Feat reveal" id="ventajas">
      <div className="Feat-inner">
        <span className="Feat-kicker">Lo que no vas a encontrar en otro sistema</span>
        <h2 className="Feat-titulo">No es solo un TPV. Es un sistema que piensa por ti.</h2>

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
                {f.link && <Link to={f.link} className="Feat-card-link">Saber más →</Link>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
