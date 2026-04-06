// src/components/Features/Features.jsx
import React from "react";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import "./Features.css";

const principales = [
  {
    icono: "🧾",
    titulo: "Comandas en 3 toques",
    descripcion:
      "Buscador inteligente de productos, notas por plato, orden de salida y mensajes a cocina. El camarero no pierde tiempo y cocina recibe todo claro.",
  },
  {
    icono: "👨‍🍳",
    titulo: "Cocina y barra coordinadas en tiempo real",
    descripcion:
      "Cada seccion ve solo lo suyo en pantalla. El cocinero marca listo, salta un ticket automatico al camarero. Cero confusion, maximo ritmo.",
  },
  {
    icono: "✅",
    titulo: "Cumple con Hacienda sin pensar",
    descripcion:
      "Facturacion encadenada con hash antifraude, registro de cada emision y preparado para VERI*FACTU. Tu trabajas, Alef se encarga de la ley.",
  },
];

const secundarias = [
  { icono: "📲", texto: "Carta digital QR en 3 idiomas con reservas y valoraciones" },
  { icono: "💳", texto: "Caja diaria con cierres automaticos y control de descuadres" },
  { icono: "📦", texto: "Stock con alertas de minimos y gestion de proveedores" },
  { icono: "📈", texto: "Estadisticas de ventas, productos top y horas fuertes" },
  { icono: "🗣️", texto: "Voz inteligente para comandas y acciones en horas pico" },
  { icono: "🖥️", texto: "Funciona en PC, tablet y movil — sin instalar nada" },
];

const Features = () => {
  useRevealOnScroll();

  return (
    <section className="Features bg-fondo-claro reveal" id="ventajas">
      <div className="Features-inner section--wide">
        <div className="Features-header">
          <span className="Features-kicker">Lo que cambia en tu dia a dia</span>
          <h2>Tu sala mas rapida. Tu cocina sin errores. Tu negocio bajo control.</h2>
          <p>
            Alef esta pensado para el servicio real — no para demos bonitas.
            Esto es lo que notas desde el primer dia.
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

        {/* 6 features secundarias - lista compacta */}
        <div className="Features-secondary">
          <h3 className="Features-secondary-title">Y ademas...</h3>
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
