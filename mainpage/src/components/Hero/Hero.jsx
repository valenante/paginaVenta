import React from "react";
import "./Hero.css";

const Hero = () => {
  return (
    <section className="Hero reveal espaciados" id="hero">
      <div className="Hero-left">
        <img
          src="/img/tpv-camarero.jpg"
          alt="Camarero usando TPV"
          className="Hero-img"
        />
      </div>
      <div className="Hero-right">
        <div className="Hero-texto">
          <h2>
            Transforma tu restaurante en un entorno eficaz, ordenado y moderno
          </h2>
          <p>
            Nuestro sistema TPV permite que todo funcione con fluidez: pedidos
            digitales, cocina organizada y facturación legal al instante.
          </p>
          <a href="#contacto" className="Hero-boton">Solicitar demo</a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
