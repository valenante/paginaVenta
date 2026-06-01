import React from "react";
import "./Funcionamiento.css";

export default function Funcionamiento() {
  return (
    <section className="Fn" aria-labelledby="fn-title">
      <div className="Fn-inner">
        <header className="Fn-header">
          <span className="Fn-badge">Operativo en 24 horas</span>
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
            2 restaurantes operan con ALEF cada día en Torremolinos.
            Haz click en su carta para verlo en directo.
          </p>
          <div className="Fn-caso-links">
            <a href="https://zabor-feten-carta.softalef.com" target="_blank" rel="noopener noreferrer" className="Fn-caso-link">
              Ver carta Zabor Feten →
            </a>
            <a href="https://bodegon-argentino-carta.softalef.com" target="_blank" rel="noopener noreferrer" className="Fn-caso-link">
              Ver carta Bodegón Argentino →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
