import React from "react";
import "./Introduccion.css";
import letrasalefsinfondo from "../../assets/imagenes/letrasalefsinfondo.png";
import verifactuLogo from "../../assets/imagenes/verifactu.png";
import tpvDemo from "../../assets/videos/tpv-demo.mp4";

const Introduccion = () => {
  return (
    <section className="Introduccion hero-bg reveal" id="inicio">
      <div className="Introduccion-layout">
        {/* ======= COLUMNA TEXTO ======= */}
        <div className="Introduccion-left">
          <div className="Introduccion-contenido">
            <div className="Introduccion-badge">
              <span>Usado en restaurantes reales cada día</span>

              <span
                className="badge-verifactu"
                title="Preparado para VERI*FACTU"
              >
                <img
                  src={verifactuLogo}
                  alt="VERI*FACTU"
                  className="badge-verifactu-logo"
                  loading="lazy"
                  decoding="async"
                />
              </span>
            </div>

            <h1 className="Introduccion-titulo">
              Sabe qué platos te dan dinero y cuáles te lo quitan.
            </h1>

            <p className="Introduccion-subtitulo">
              Costes, stock, cocina, sala y facturación conectados en una plataforma
              diseñada para hostelería. Operativo en 24 horas.
            </p>

            <div className="Introduccion-highlights">
              <span>📈 Margen real de cada plato — calculado automáticamente</span>
              <span>📦 Stock que se repone solo — pedidos a proveedor automáticos</span>
              <span>📄 Facturas procesadas sin tocar nada — desde email o cámara</span>
              <span>✅ VeriFactu incluido — obligatorio desde julio 2027</span>
            </div>

            <div className="Introduccion-botones">
              <a href="#contacto" className="Introduccion-boton principal">
                Solicitar demo
              </a>

              <a href="#ahorro" className="Introduccion-boton secundario">
                Ver qué incluye
              </a>
            </div>

            <div className="Introduccion-metricas">
              <div>
                <strong>129€/mes</strong>
                <span>todo incluido</span>
              </div>
              <div>
                <strong>Sin permanencia</strong>
                <span>cancela cuando quieras</span>
              </div>
              <div>
                <strong>Soporte incluido</strong>
                <span>te acompañamos siempre</span>
              </div>
              <div>
                <strong>Operativo en 1 día</strong>
                <span>sin instalaciones</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======= COLUMNA VISUAL ======= */}
        <div className="Introduccion-right">
          <div className="hero-orbit">
            <div className="hero-pill pill-voz">
              📸 Post de Instagram publicado automáticamente
            </div>
            <div className="hero-pill pill-cocina">
              📦 Stock bajo → pedido a proveedor generado
            </div>
            <div className="hero-pill pill-carta">
              📄 Factura de proveedor procesada → stock actualizado
            </div>

            <div className="hero-stack">
              <div className="hero-glow" />

              <img
                src={letrasalefsinfondo}
                alt="Plataforma Alef"
                className="hero-img hero-main"
              />

              <div className="phone-mockup hero-secondary">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <video
                    src={tpvDemo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="phone-video"
                  />
                </div>
                <div className="phone-home-bar" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Introduccion;
