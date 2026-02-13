// src/components/Gallery/Gallery.jsx
import React from "react";
import useRevealOnScroll from "../../Hooks/useRevealOnScroll";
import "./Gallery.css";

const capturas = [
  {
    src: "/img/captura1.jpg",
    titulo: "Pedidos y autoservicio",
    descripcion:
      "Carta digital para restaurantes y flujos de autoservicio en tiendas, todo conectado al sistema central.",
    tag: "Clientes y ventas",
  },
  {
    src: "/img/captura2.jpg",
    titulo: "Panel de ventas y caja",
    descripcion:
      "Control completo de ventas, tickets, facturas y estados de caja desde un único panel.",
    tag: "TPV central",
  },
  {
    src: "/img/captura3.jpg",
    titulo: "Cocina, barra y mostrador",
    descripcion:
      "Vistas optimizadas por estación: cocina, barra o mostrador, con estados en tiempo real y control por voz.",
    tag: "Operativa diaria",
  },
  {
    src: "/img/captura4.jpg",
    titulo: "Stock, proveedores y estadísticas",
    descripcion:
      "Gestión profesional de stock, proveedores, márgenes y análisis de negocio en tiempo real.",
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
          <h2>Así se ve Alef trabajando en tu negocio</h2>
          <p>
            Panel de ventas, pedidos desde el móvil, cocina, mostrador, stock y
            estadísticas. Un único sistema que se adapta a restaurantes y
            tiendas sin cambiar tu forma de trabajar.
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
          <a href="#contacto" className="btn btn-primario ">
            Quiero ver Alef en funcionamiento
          </a>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
