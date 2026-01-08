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
              La plataforma que se adapta a tu negocio
            </div>

            <h1 className="Introduccion-titulo">
              El sistema web definitivo para restaurantes y tiendas
            </h1>

            <p className="Introduccion-subtitulo">
              Alef es una plataforma creada desde dentro del negocio físico para
              adaptarse a tu forma real de trabajar. Gestiona restaurantes y
              tiendas desde un único sistema: ventas, stock, proveedores,
              facturación, estadísticas y mucho más, sin instalaciones
              complicadas ni límites de dispositivos.
            </p>

            <div className="Introduccion-highlights">
              <span>⚡ Instalación en minutos</span>
              <span>🖥️ Dispositivos ilimitados</span>
              <span>🏪 Restaurantes y tiendas</span>
              <span>🎨 Personalización total</span>
              <span>🗣️ Voz en sala, cocina, barra y mostrador</span>
              <span>📦 Stock, proveedores y escáner de códigos</span>
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
                <strong>Todo en uno</strong>
                <span>restaurante y shop en una sola plataforma</span>
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
              🗣️ Voz inteligente en restaurante y tienda
            </div>
            <div className="hero-pill pill-cocina">
              👨‍🍳 Cocina, barra y mostrador por secciones
            </div>
            <div className="hero-pill pill-carta">
              📲 Carta digital y TPV web en cualquier dispositivo
            </div>

            {/* Stack principal de pantallas */}
            <div className="hero-stack">
              <div className="hero-glow" />

              <img
                src={letrasalefsinfondo}
                alt="Plataforma Alef – Restaurante y Shop"
                className="hero-img hero-main"
              />

              <img
                src={cartaMain}
                alt="Alef en móvil, tablet y TPV"
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
