import React from "react";
import "./Introduccion.css";
import letrasalefsinfondo from "../../assets/imagenes/letrasalefsinfondo.png";
import cartaMain from "../../assets/imagenes/cartaMain.png";
import verifactuLogo from "../../assets/imagenes/verifactu.png";

const Introduccion = () => {
  return (
    <section className="Introduccion hero-bg reveal" id="inicio">
      <div className="Introduccion-layout">
        {/* ======= COLUMNA TEXTO ======= */}
        <div className="Introduccion-left">
          <div className="Introduccion-contenido">
            <div className="Introduccion-badge">
              <span>Usado en restaurantes reales cada dia</span>

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
              Tu restaurante gana más dinero cuando piensa solo
            </h1>

            <p className="Introduccion-subtitulo">
              Alef automatiza stock, proveedores, finanzas, Instagram, reseñas de Google, y 25 procesos más.
              Un copiloto IA con 50 herramientas que conoce tu negocio mejor que tu contable.
            </p>

            <div className="Introduccion-highlights">
              <span>💰 Ahorra 1.300–3.400€/mes en herramientas que ya no necesitas</span>
              <span>⏱️ Recupera 2-3 horas diarias en tareas que se hacen solas</span>
              <span>📈 Protege tus márgenes — la IA detecta erosión antes que tú</span>
              <span>🤖 50 herramientas IA que responden con datos reales de TU restaurante</span>
            </div>

            <div className="Introduccion-botones">
              <a href="#contacto" className="Introduccion-boton principal">
                Quiero ver la demo
              </a>

              <a href="#ahorro" className="Introduccion-boton secundario">
                Ver cuanto ahorro
              </a>
            </div>

            <div className="Introduccion-metricas">
              <div>
                <strong>50+ herramientas IA</strong>
                <span>analizan tu negocio</span>
              </div>
              <div>
                <strong>25 automatizaciones</strong>
                <span>trabajando 24/7</span>
              </div>
              <div>
                <strong>39 modulos</strong>
                <span>en un solo sistema</span>
              </div>
              <div>
                <strong>1 dia</strong>
                <span>para estar operativo</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======= COLUMNA VISUAL ======= */}
        <div className="Introduccion-right">
          <div className="hero-orbit">
            <div className="hero-pill pill-voz">
              📸 IA: Post de Instagram publicado automaticamente
            </div>
            <div className="hero-pill pill-cocina">
              📦 Stock bajo → pedido al proveedor generado
            </div>
            <div className="hero-pill pill-carta">
              ⭐ Resena de Google respondida con IA en 2 min
            </div>

            <div className="hero-stack">
              <div className="hero-glow" />

              <img
                src={letrasalefsinfondo}
                alt="Plataforma Alef"
                className="hero-img hero-main"
              />

              <img
                src={cartaMain}
                alt="Alef en movil, tablet y TPV"
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
