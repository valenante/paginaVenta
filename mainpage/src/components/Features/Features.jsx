// src/components/Features/Features.jsx
import React from "react";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import "./Features.css";

const principales = [
  {
    icono: "🧾",
    titulo: "Tus camareros atienden mas mesas",
    descripcion:
      "Comanda completa en 3 toques con buscador inteligente. Notas por plato, orden de salida y mensajes a cocina. Menos tiempo por mesa, mas mesas atendidas por servicio.",
  },
  {
    icono: "👨‍🍳",
    titulo: "Los platos salen mas rapido y sin errores",
    descripcion:
      "Cocina y barra ven solo lo suyo en pantalla. El cocinero marca listo y salta ticket al camarero. Los platos llegan calientes y en orden. Cero confusion.",
  },
  {
    icono: "💰",
    titulo: "Tu caja cuadra siempre",
    descripcion:
      "Cada venta queda registrada. Cierres automaticos, control de descuadres y facturacion legal preparada para VERI*FACTU (obligatorio julio 2027). Tu trabajas, Alef se encarga.",
  },
];

const secundarias = [
  { icono: "📲", texto: "Carta digital QR en 3 idiomas con pedidos, reservas y valoraciones" },
  { icono: "💳", texto: "Caja diaria con cierres automaticos y control de descuadres" },
  { icono: "📦", texto: "Stock con alertas de minimos y gestion de proveedores" },
  { icono: "📈", texto: "Estadisticas de ventas, productos estrella y horas punta" },
  { icono: "🗣️", texto: "Comandas por voz para horas de maximo ritmo" },
  { icono: "🖥️", texto: "Funciona en PC, tablet y movil — sin instalar nada" },
  { icono: "🖨️", texto: "Funciona con o sin pantallas de cocina — tu decides el flujo" },
  { icono: "🔧", texto: "Desarrollo a medida: adaptamos Alef a las necesidades de tu negocio" },
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
