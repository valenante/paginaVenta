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
              <span>La plataforma que se adapta a tu negocio</span>

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
              TPV web
              rápido, claro y listo para crecer
            </h1>

            <p className="Introduccion-subtitulo">
              Alef está diseñado para el día a día real: tomar comandas sin
              perder tiempo, enviar a cocina/bar con información clara y tener
              todo el negocio bajo control desde un solo sistema. Sin
              instalaciones complicadas, sin límites de dispositivos.
            </p>

            <div className="Introduccion-highlights">
              <span>⚡ Puesta en marcha en minutos</span>
              <span>🧾 Tickets claros + notas a cocina</span>
              <span>🔎 Búsqueda rápida de productos</span>
              <span>📲 Carta digital (3 idiomas) + pedidos ON/OFF</span>
              <span>🖥️ Multi-dispositivo (PC, tablet y móvil)</span>
              <span>📦 Stock y proveedores integrados</span>
              <span>✅ Facturación encadenada (Ley 11/2021) y preparada para VERI*FACTU</span>
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
                <span>funciones para operar y crecer</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>acceso desde cualquier dispositivo</span>
              </div>
              <div>
                <strong>Todo en uno</strong>
                <span>TPV, carta, stock, caja y gestión</span>
              </div>
              <div>
                <strong>Soporte real</strong>
                <span>acompañamiento desde el día 1</span>
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