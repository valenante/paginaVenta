import React from "react";
import "./Funcionamiento.css";
import logoZF from "../../assets/imagenes/logo-zabor-feten.png";
import logoBA from "../../assets/imagenes/logo-bodegon-argentino.webp";

export default function Funcionamiento() {
  return (
    <section className="Fn" aria-labelledby="fn-title">
      <div className="Fn-inner">
        <header className="Fn-header">
          <span className="Fn-badge">Puesta en marcha rápida</span>
          <h2 id="fn-title">Así de rápido empiezas con ALEF</h2>
          <p>
            Sin técnicos, sin instalaciones complicadas, sin semanas de espera.
          </p>
        </header>

        <div className="Fn-steps">
          <div className="Fn-step">
            <div className="Fn-step-icon">📞</div>
            <h3>Cuéntanos cómo trabajas</h3>
            <p>
              10 minutos por teléfono o WhatsApp. Tu carta, tus mesas, tu equipo.
              Entendemos tu operativa y qué necesitas.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">⚙️</div>
            <h3>Configuramos tu restaurante</h3>
            <p>
              Mesas, carta, categorías, accesos, impresoras — lo hacemos nosotros.
              No necesitas técnicos ni instalaciones.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">🍽️</div>
            <h3>Empieza a operar</h3>
            <p>
              Desde el primer servicio, ventas, costes y márgenes se registran solos.
              En una semana tienes información real de tu negocio.
            </p>
          </div>
        </div>

        <div className="Fn-caso-real">
          <p className="Fn-caso-label">Ya funcionando en Málaga</p>
          <p className="Fn-caso-texto">
            Restaurantes reales operando con ALEF cada día.
          </p>
          <div className="Fn-caso-clientes">
            <a href="https://zabor-feten-carta.softalef.com" target="_blank" rel="noopener noreferrer" className="Fn-caso-cliente">
              <img src={logoZF} alt="Zabor Feten" className="Fn-caso-logo" />
              <span className="Fn-caso-nombre">Zabor Feten</span>
              <span className="Fn-caso-ciudad">Torremolinos</span>
            </a>
            <a href="https://bodegon-argentino-carta.softalef.com" target="_blank" rel="noopener noreferrer" className="Fn-caso-cliente">
              <img src={logoBA} alt="Bodegón Argentino" className="Fn-caso-logo" />
              <span className="Fn-caso-nombre">Bodegón Argentino</span>
              <span className="Fn-caso-ciudad">Torremolinos</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
