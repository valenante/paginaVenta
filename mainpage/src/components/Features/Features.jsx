// src/components/Features/Features.jsx
import React from "react";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import "./Features.css";

const principales = [
  {
    icono: "🧠",
    titulo: "Un copiloto IA que conoce tu negocio",
    descripcion:
      "Preguntale cualquier cosa: cual es tu plato mas rentable, cuantos camareros necesitas el sabado, que proveedor te esta subiendo precios. Responde con datos reales de TU restaurante en segundos.",
  },
  {
    icono: "⚡",
    titulo: "Procesos que se ejecutan solos",
    descripcion:
      "Stock bajo → pedido al proveedor generado. Margen cayendo → te avisa y sugiere precios. Viernes flojos → te lo dice antes de que lo notes. Tu restaurante reacciona solo.",
  },
  {
    icono: "🍽️",
    titulo: "Operativa impecable incluida",
    descripcion:
      "Comanda en 3 toques, cocina coordinada en tiempo real, carta QR en 3 idiomas, facturacion VeriFactu. Todo lo que necesitas para el dia a dia — integrado y sin fricciones.",
  },
];

const secundarias = [
  { icono: "📊", texto: "Finanzas automaticas: P&L, margenes, informe al contable sin Excel" },
  { icono: "📦", texto: "Stock inteligente con alertas, prediccion de consumo y pedidos a proveedores" },
  { icono: "🔔", texto: "Alertas proactivas: margen erosionado, tendencias negativas, facturas vencidas" },
  { icono: "📈", texto: "Estadisticas avanzadas: hora punta, productos estrella, correlaciones" },
  { icono: "🗣️", texto: "Comandas por voz en horas de maximo ritmo" },
  { icono: "🖥️", texto: "Funciona en PC, tablet y movil — sin instalar nada" },
  { icono: "✅", texto: "Facturacion legal preparada para VERI*FACTU (obligatorio julio 2027)" },
  { icono: "🔧", texto: "Desarrollo a medida: adaptamos Alef a las necesidades de tu negocio" },
];

const Features = () => {
  useRevealOnScroll();

  return (
    <section className="Features bg-fondo-claro reveal" id="ventajas">
      <div className="Features-inner section--wide">
        <div className="Features-header">
          <span className="Features-kicker">Automatizacion real para restaurantes</span>
          <h2>Tu restaurante toma decisiones inteligentes. Automaticamente.</h2>
          <p>
            Alef no es un TPV — es un sistema inteligente que automatiza
            la gestion de tu restaurante. Esto es lo que cambia desde el primer dia.
          </p>
        </div>

        {/* 3 features principales - cards grandes */}
        <div className="Features-grid Features-grid--main">
          {principales.map((v, i) => (
            <article key={i} className="Features-card Features-card--main">
              <div className="Features-icono">{v.icono}</div>
              <h3 className="Features-titulo">{v.titulo}</h3>
              <p className="Features-descripcion">{v.descripcion}</p>
            </article>
          ))}
        </div>

        {/* features secundarias - lista compacta */}
        <div className="Features-secondary">
          <h3 className="Features-secondary-title">Todo lo que necesitas, automatizado</h3>
          <div className="Features-secondary-grid">
            {secundarias.map((s, i) => (
              <div key={i} className="Features-secondary-item">
                <span className="Features-secondary-icon">{s.icono}</span>
                <span className="Features-secondary-text">{s.texto}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
