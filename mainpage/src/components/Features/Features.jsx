// src/components/Features/Features.jsx
// Tier S — 5 features que cambian el negocio
import React from "react";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import "./Features.css";

const tierS = [
  {
    icono: "📧",
    kicker: "Ahorra 1-2 horas al día",
    titulo: "Facturas del proveedor → stock actualizado. Sin tocar nada.",
    desc: "Recibes una factura de tu proveedor por email. La IA la lee, extrae productos y cantidades, actualiza tu stock, y registra el coste. Tú solo abres el restaurante.",
  },
  {
    icono: "🧠",
    kicker: "50 herramientas IA",
    titulo: "Pregúntale lo que quieras sobre tu negocio. Responde con tus datos.",
    desc: "¿Cuál es mi plato más rentable? ¿Cuántos camareros necesito el sábado? ¿Qué proveedor me está subiendo precios? El copiloto analiza tus datos reales y responde en segundos. No es ChatGPT — es una IA entrenada en TU restaurante.",
  },
  {
    icono: "🛡️",
    kicker: "Detecta erosión silenciosa",
    titulo: "Tu margen está bajando y no lo sabes. Alef sí.",
    desc: "El proveedor sube un 5% el solomillo. Tú no cambias el precio del plato. En 3 meses has perdido 2.000€ sin darte cuenta. Alef detecta el cambio, calcula el impacto, y te sugiere el nuevo precio.",
  },
  {
    icono: "📦",
    kicker: "Cero roturas de stock",
    titulo: "Sabe lo que necesitas antes que tú. Y lo pide solo.",
    desc: "Alef analiza 8 semanas de consumo, reservas del fin de semana, y día de la semana. Genera el pedido al proveedor automáticamente. Se acabó el 'nos hemos quedado sin X un viernes noche'.",
  },
  {
    icono: "📊",
    kicker: "Nunca más Excel",
    titulo: "Finanzas al día. Informe al contable generado solo.",
    desc: "Márgenes por plato, costes de personal, P&L mensual, informe para la gestoría — todo calculado automáticamente con datos reales. Sabes si tu negocio es rentable sin esperar al cierre de mes.",
  },
];

const Features = () => {
  useRevealOnScroll();

  return (
    <section className="Feat reveal" id="ventajas">
      <div className="Feat-inner">
        <span className="Feat-kicker">Lo que ningún competidor en España tiene junto</span>
        <h2 className="Feat-titulo">5 cosas que te cambian el negocio desde la primera semana</h2>

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
