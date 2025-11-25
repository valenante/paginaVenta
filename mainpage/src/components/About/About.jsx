import React from "react";
import "./About.css";

const About = () => {
  return (
    <section className="About" id="nosotros">
      <div className="About-left">
        <img
          src="/img/equipo.jpg"
          alt="Equipo de desarrollo"
          className="About-img"
        />
      </div>
      <div className="About-right">
        <div className="About-texto">
          <h2>¿Quiénes somos?</h2>
          <p>
            Somos un grupo de jóvenes con pasión por el desarrollo que,
            trabajando en la hostelería, nos preguntamos cómo optimizar y hacer
            nuestro trabajo más eficaz. Así nació este proyecto: un sistema TPV
            creado desde la experiencia real para digitalizar restaurantes de forma
            profesional y sencilla.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
