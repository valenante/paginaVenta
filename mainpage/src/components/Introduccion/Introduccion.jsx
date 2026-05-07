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
              Hacemos tu restaurante inteligente
            </h1>

            <p className="Introduccion-subtitulo">
              Automatizamos los procesos que te roban tiempo — stock, proveedores,
              finanzas, cocina, comandas — para que tu te centres en tus clientes.
              Con un copiloto IA que conoce tu negocio mejor que nadie.
            </p>

            <div className="Introduccion-highlights">
              <span>📦 Tu stock se controla solo — avisa cuando falta y genera el pedido al proveedor</span>
              <span>🧠 Una IA que analiza tu negocio — te dice que plato subir de precio y cuantos camareros necesitas</span>
              <span>📊 Finanzas al dia sin Excel — margenes, P&L e informe al contable automatico</span>
              <span>🍽️ Comandas, cocina y mesa sin fricciones — coordinacion en tiempo real</span>
              <span>📱 Carta digital que vende sola — QR en 3 idiomas con pedidos y reservas</span>
              <span>🔔 Alertas antes de que el problema exista — margen cayendo, stock bajo, viernes flojos</span>
            </div>

            <div className="Introduccion-botones">
              <a href="#contacto" className="Introduccion-boton principal">
                Quiero automatizar mi restaurante
              </a>

              <a href="#contacto" className="Introduccion-boton secundario">
                Ver demo en 10 minutos
              </a>
            </div>

            <div className="Introduccion-metricas">
              <div>
                <strong>49 herramientas IA</strong>
                <span>analizan tu negocio</span>
              </div>
              <div>
                <strong>Automatico</strong>
                <span>stock, compras, alertas</span>
              </div>
              <div>
                <strong>Tiempo real</strong>
                <span>cocina, barra, sala</span>
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
              🧠 IA: "Sube el pulpo un 8%, tu margen esta bajo"
            </div>
            <div className="hero-pill pill-cocina">
              📦 Stock bajo → pedido al proveedor automatico
            </div>
            <div className="hero-pill pill-carta">
              📊 Informe mensual generado y enviado al contable
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
