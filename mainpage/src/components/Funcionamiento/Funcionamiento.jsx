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
            <h3>Nos cuentas tu negocio</h3>
            <p>
              Tu carta, tus mesas, tu equipo. En una llamada de 10 minutos
              entendemos cómo trabajas y qué necesitas.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">⚙️</div>
            <h3>Configuramos todo por ti</h3>
            <p>
              Creamos tu entorno con mesas, carta, categorías, accesos
              y toda la configuración. Listo para usar.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">🍽️</div>
            <h3>Empiezas a operar</h3>
            <p>
              Desde el primer servicio, el sistema registra ventas, costes
              y márgenes. En días tienes información real de tu negocio.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">📈</div>
            <h3>Tu negocio gana control</h3>
            <p>
              Stock controlado, facturas procesadas, márgenes protegidos.
              Tú te dedicas a tus clientes y a tu cocina.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
