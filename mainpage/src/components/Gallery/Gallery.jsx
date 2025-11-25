import React from "react";
import "./Gallery.css";

const Gallery = () => {
  return (
    <section className="Gallery" id="capturas">
      <div className="Gallery-item">
        <img src="/img/captura1.jpg" alt="Carta digital" />
      </div>
      <div className="Gallery-item">
        <img src="/img/captura2.jpg" alt="TPV para trabajadores" />
      </div>
      <div className="Gallery-item">
        <img src="/img/captura3.jpg" alt="Vista de cocina" />
      </div>
      <div className="Gallery-item">
        <img src="/img/captura4.jpg" alt="Reservas y gestión" />
      </div>
    </section>
  );
};

export default Gallery;
