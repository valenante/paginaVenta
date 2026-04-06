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
              Tus camareros toman comandas en segundos.
              Cocina no se equivoca. Caja siempre cuadra.
            </h1>

            <p className="Introduccion-subtitulo">
              Alef agiliza tu sala, coordina cocina y barra en tiempo real
              y te da el control completo de tu negocio. Sin instalar nada,
              funciona en cualquier dispositivo con navegador.
            </p>

            <div className="Introduccion-highlights">
              <span>🔎 Buscador inteligente de productos al tomar comanda</span>
              <span>🧾 Tickets por seccion con notas, orden y mensajes a cocina</span>
              <span>👨‍🍳 Pantallas de cocina y barra con marcado en tiempo real</span>
              <span>📲 Carta digital QR en 3 idiomas con pedidos y reservas</span>
              <span>✅ Facturacion encadenada y preparada para VERI*FACTU</span>
              <span>📊 Estadisticas, stock, caja diaria y gestion completa</span>
            </div>

            <div className="Introduccion-botones">
              <a href="#packs" className="Introduccion-boton principal">
                Ver planes desde 59€/mes
              </a>

              <a href="#contacto" className="Introduccion-boton secundario">
                Pedir demo de 10 min
              </a>
            </div>

            <div className="Introduccion-metricas">
              <div>
                <strong>3 toques</strong>
                <span>para una comanda completa</span>
              </div>
              <div>
                <strong>0 errores</strong>
                <span>tickets claros por seccion</span>
              </div>
              <div>
                <strong>59€/mes</strong>
                <span>todo incluido, sin permanencia</span>
              </div>
              <div>
                <strong>1 minuto</strong>
                <span>para estar operativo</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======= COLUMNA VISUAL ======= */}
        <div className="Introduccion-right">
          <div className="hero-orbit">
            {/* Pills flotantes alrededor */}
            <div className="hero-pill pill-voz">
              🗣️ Comandas por voz en horas pico
            </div>
            <div className="hero-pill pill-cocina">
              👨‍🍳 Cocina marca listo → ticket al camarero
            </div>
            <div className="hero-pill pill-carta">
              📲 Tu carta QR en 3 idiomas con reservas
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