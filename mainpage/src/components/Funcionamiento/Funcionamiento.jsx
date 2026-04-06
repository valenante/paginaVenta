import React from "react";
import "./Funcionamiento.css";

export default function Funcionamiento() {
  return (
    <section className="Fn" aria-labelledby="fn-title">
      <div className="Fn-inner">
        {/* TÍTULO CENTRAL */}
        <header className="Fn-header">
          <span className="Fn-badge">De 0 a operativo en minutos</span>
          <h2 id="fn-title">Asi de rapido empiezas con Alef</h2>
          <p>
            Sin tecnicos, sin instalaciones, sin esperas.
            Eliges plan, te preparamos todo y empiezas a trabajar.
          </p>
        </header>

        {/* PASOS */}
        <div className="Fn-steps">
          <div className="Fn-step">
            <div className="Fn-step-icon">📦</div>
            <h3>Elige tu plan</h3>
            <p>
              59 segundos. Eliges el plan que encaja con tu restaurante,
              pones nombre y email. Listo.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">⚙️</div>
            <h3>Te lo dejamos listo</h3>
            <p>
              Creamos tu entorno con mesas, categorias, carta digital
              y accesos para tu equipo. Todo configurado.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">🖥️</div>
            <h3>Abre desde cualquier dispositivo</h3>
            <p>
              PC, tablet o movil. Solo abre el navegador y entra.
              Sin descargar nada, sin licencias por dispositivo.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">🚀</div>
            <h3>Tu primer servicio</h3>
            <p>
              Comandas, cocina marca listo, cuenta, impresion y cierre de caja.
              Todo funciona desde el primer dia.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}