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
              Tu sala mas rapida.
              Tu cocina sin errores.
              Tu caja siempre cuadra.
            </h1>

            <p className="Introduccion-subtitulo">
              Alef es el TPV web que agiliza tu servicio, coordina cocina y barra
              en tiempo real y te da control total de tu negocio.
              Sin instalar nada. Funciona en cualquier dispositivo.
            </p>

            <div className="Introduccion-highlights">
              <span>🔎 Comanda completa en 3 toques con buscador inteligente</span>
              <span>👨‍🍳 Cocina ve el pedido al instante y marca listo cuando sale</span>
              <span>🧾 Tickets claros por seccion con notas y orden de salida</span>
              <span>📲 Carta digital QR en 3 idiomas con pedidos y reservas</span>
              <span>📊 Estadisticas, stock, caja diaria y gestion completa</span>
              <span>✅ Facturacion legal preparada para VERI*FACTU</span>
            </div>

            <div className="Introduccion-botones">
              <a href="#packs" className="Introduccion-boton principal">
                Ver planes desde 59€/mes
              </a>

              <a href="#contacto" className="Introduccion-boton secundario">
                Ver demo en 10 minutos
              </a>
            </div>

            <div className="Introduccion-metricas">
              <div>
                <strong>3 toques</strong>
                <span>comanda completa</span>
              </div>
              <div>
                <strong>0 errores</strong>
                <span>cocina recibe todo claro</span>
              </div>
              <div>
                <strong>59€/mes</strong>
                <span>sin permanencia</span>
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
              🗣️ Comandas por voz en horas pico
            </div>
            <div className="hero-pill pill-cocina">
              👨‍🍳 Cocina marca listo → ticket al camarero
            </div>
            <div className="hero-pill pill-carta">
              📲 Tu carta QR en 3 idiomas con reservas
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
