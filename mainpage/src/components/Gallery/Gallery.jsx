// src/components/Gallery/Gallery.jsx
import React from "react";
import useRevealOnScroll from "../../Hooks/useRevealOnScroll";
import "./Gallery.css";

const capturas = [
  {
    src: "/img/captura1.jpg",
    titulo: "Carta digital",
    descripcion: "Los clientes ven la carta desde el móvil y pueden hacer pedidos.",
    tag: "Carta y pedidos en mesa",
  },
  {
    src: "/img/captura2.jpg",
    titulo: "TPV para el equipo",
    descripcion: "Visión completa de mesas, cuentas y tickets desde caja.",
    tag: "TPV central",
  },
  {
    src: "/img/captura3.jpg",
    titulo: "Vista de cocina",
    descripcion: "Comandas claras por estación, con voz y estados en tiempo real.",
    tag: "Cocina y barra",
  },
  {
    src: "/img/captura4.jpg",
    titulo: "Reservas y estadísticas",
    descripcion: "Control de reservas, ocupación y datos de negocio.",
    tag: "Gestión y análisis",
  },
];

const Gallery = () => {
  useRevealOnScroll();

  return (
    <section className="Gallery bg-fondo-oscuro reveal" id="capturas">
      <div className="Gallery-inner section--wide">
        <header className="Gallery-header">
          <span className="Gallery-kicker">Capturas reales</span>
          <h2>Así se ve Alef trabajando en tu restaurante</h2>
          <p>
            Panel para el equipo, carta digital para los clientes, vista de
            cocina, reservas y estadísticas. Un mismo sistema, adaptado a cada
            rol del restaurante.
          </p>
        </header>

        <div className="Gallery-grid">
          {capturas.map((c, i) => (
            <article key={i} className="Gallery-item">
              <div className="Gallery-img-wrapper">
                <img src={c.src} alt={c.titulo} />
                <div className="Gallery-overlay">
                  <span className="Gallery-tag">{c.tag}</span>
                  <h3>{c.titulo}</h3>
                  <p>{c.descripcion}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="Gallery-footer">
          <a href="#contacto" className="btn btn-primario">
            Quiero ver una demo en directo
          </a>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
