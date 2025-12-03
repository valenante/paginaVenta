import React from "react";
import "./Introduccion.css";
import letrasalefsinfondo from "../../assets/imagenes/letrasalefsinfondo.png";
import cartaMain from "../../assets/imagenes/cartaMain.png";

const Introduccion = () => {
  return (
    <section className="Introduccion hero-bg reveal" id="inicio">
      <div className="Introduccion-layout">
        {/* ======= COLUMNA TEXTO ======= */}
        <div className="Introduccion-left">
          <div className="Introduccion-contenido">
            <div className="Introduccion-badge">
              El primer TPV que se adapta a ti
            </div>

            <h1 className="Introduccion-titulo">
              El TPV web más rápido, flexible y moderno para tu restaurante
            </h1>

            <p className="Introduccion-subtitulo">
              Alef es el primer TPV creado desde dentro de la hostelería para
              adaptarse a tu forma de trabajar. Sin instalaciones complicadas,
              sin límites de dispositivos y totalmente personalizable en diseño
              y funcionalidades.
            </p>

            <div className="Introduccion-highlights">
              <span>⚡ Instalación en minutos</span>
              <span>🖥️ Ilimitado en dispositivos</span>
              <span>🎨 Personalización total</span>
              <span>🗣️ Voz en sala, cocina y barra</span>
              <span>🧾 Facturación encadenada y VERI*FACTU</span>
            </div>

            <div className="Introduccion-botones">
              <a href="#contacto" className="Introduccion-boton principal">
                Pedir una demo
              </a>
              <a href="#ventajas" className="Introduccion-boton secundario">
                Ver funcionalidades
              </a>
            </div>

            <div className="Introduccion-metricas">
              <div>
                <strong>+40</strong>
                <span>funciones avanzadas</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>acceso desde cualquier dispositivo</span>
              </div>
              <div>
                <strong>Listo</strong>
                <span>para Ley Antifraude 11/2021</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======= COLUMNA VISUAL ======= */}
        <div className="Introduccion-right">
          <div className="hero-orbit">
            {/* Pills flotantes alrededor */}
            <div className="hero-pill pill-voz">
              🗣️ Voz inteligente en sala, cocina y barra
            </div>
            <div className="hero-pill pill-cocina">
              👨‍🍳 Cocina por secciones y tiempos
            </div>
            <div className="hero-pill pill-carta">
              📲 Carta web interactiva para tus clientes
            </div>

            {/* Stack principal de pantallas */}
            <div className="hero-stack">
              <div className="hero-glow" />

              <img
                src={letrasalefsinfondo}
                alt="Panel de mesas Alef TPV"
                className="hero-img hero-main"
              />

              <img
                src={cartaMain}
                alt="Carta web Alef en el móvil"
                className="hero-img hero-secondary"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Introduccion;
