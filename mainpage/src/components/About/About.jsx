import React from "react";
import "./About.css";

const About = () => {
  return (
    <section className="About section bg-fondo-claro reveal" id="nosotros">
      <div className="About-inner section--wide">
        {/* Imagen / side visual */}
        <div className="About-left">
          <div className="About-image-wrapper">
            <img
              src="/img/equipo.jpg"
              alt="Equipo Alef desarrollando el TPV"
              className="About-img"
            />
            <div className="About-image-badge">
              <span className="About-image-pill">Hecho desde la hostelería</span>
              <span className="About-image-text">
                Pensado para salas reales, no para laboratorio.
              </span>
            </div>
          </div>
        </div>

        {/* Texto */}
        <div className="About-right">
          <span className="About-kicker">Sobre Alef</span>
          <h2 className="About-title">
            Un TPV creado desde dentro del restaurante
          </h2>

          <p className="About-paragraph">
            Alef nace de una pregunta sencilla hecha entre servicios:
            <strong> “¿por qué el software no trabaja al ritmo de la sala?”</strong>  
            Somos desarrolladores que han pasado por barra, cocina y sala, y
            construimos el TPV que nos habría gustado tener mientras servíamos.
          </p>

          <p className="About-paragraph">
            Por eso cuidamos igual la parte técnica que el día a día del
            restaurante: fluidez en los pedidos, pantallas claras para el
            equipo, cumplimiento legal con facturación encadenada y un soporte
            cercano cuando lo necesitas.
          </p>

          <div className="About-grid">
            <ul className="About-list">
              <li>
                <span>✔</span>
                Experiencia real en hostelería: diseñamos cada flujo desde la sala.
              </li>
              <li>
                <span>✔</span>
                Enfoque legal desde el inicio: Ley Antifraude y preparado para VeriFactu.
              </li>
              <li>
                <span>✔</span>
                Evolución continua: nuevas funciones y mejoras sin cambiar de sistema.
              </li>
            </ul>

            <div className="About-stats">
              <div className="About-stat">
                <span className="About-stat-number">40+</span>
                <span className="About-stat-label">funciones en el plan avanzado</span>
              </div>
              <div className="About-stat">
                <span className="About-stat-number">100%</span>
                <span className="About-stat-label">web: funciona en cualquier dispositivo</span>
              </div>
              <div className="About-stat">
                <span className="About-stat-number">Soporte</span>
                <span className="About-stat-label">directo con el equipo que lo desarrolla</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
