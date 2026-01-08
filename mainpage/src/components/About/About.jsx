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
              alt="Equipo Alef desarrollando el sistema"
              className="About-img"
            />
            <div className="About-image-badge">
              <span className="About-image-pill">
                Hecho desde el negocio real
              </span>
              <span className="About-image-text">
                Pensado para el día a día, no para teoría.
              </span>
            </div>
          </div>
        </div>

        {/* Texto */}
        <div className="About-right">
          <span className="About-kicker">Sobre Alef</span>
          <h2 className="About-title">
            Un sistema creado desde dentro del negocio
          </h2>

          <p className="About-paragraph">
            Alef nace de una pregunta sencilla hecha en pleno servicio:
            <strong> “¿por qué el software no trabaja al ritmo del negocio?”</strong>
          </p>
          <p className="About-paragraph">
            Somos desarrolladores que han trabajado en sala, cocina, barra y
            venta directa. Por eso construimos un sistema que se adapta a cómo
            trabajas tú: pedidos rápidos, control real de stock, proveedores,
            facturación legal y pantallas claras para cada rol.
          </p>

          <div className="About-grid">
            <ul className="About-list">
              <li>
                <span>✔</span>
                Experiencia real en negocio físico: cada flujo nace del uso diario.
              </li>
              <li>
                <span>✔</span>
                Enfoque legal desde el inicio: facturación encadenada y VeriFactu.
              </li>
              <li>
                <span>✔</span>
                Evolución continua: restaurante y shop en una misma plataforma.
              </li>
            </ul>

            <div className="About-stats">
              <div className="About-stat">
                <span className="About-stat-number">40+</span>
                <span className="About-stat-label">
                  funciones profesionales activables
                </span>
              </div>
              <div className="About-stat">
                <span className="About-stat-number">100%</span>
                <span className="About-stat-label">
                  web: cualquier dispositivo, sin límites
                </span>
              </div>
              <div className="About-stat">
                <span className="About-stat-number">Soporte</span>
                <span className="About-stat-label">
                  directo con quien lo desarrolla
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
