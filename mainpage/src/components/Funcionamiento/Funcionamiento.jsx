import React from "react";
import "./Funcionamiento.css";

export default function Funcionamiento() {
  return (
    <section className="Fn" aria-labelledby="fn-title">
      <div className="Fn-inner">
        {/* TÍTULO CENTRAL */}
        <header className="Fn-header">
          <span className="Fn-badge">De 0 a restaurante inteligente en un dia</span>
          <h2 id="fn-title">Asi de rapido empiezas con Alef</h2>
          <p>
            Sin tecnicos, sin instalaciones, sin esperas.
            Te preparamos todo y tu restaurante empieza a funcionar de forma inteligente.
          </p>
        </header>

        {/* PASOS */}
        <div className="Fn-steps">
          <div className="Fn-step">
            <div className="Fn-step-icon">📦</div>
            <h3>Nos cuentas tu negocio</h3>
            <p>
              Tu carta, tus mesas, tu equipo. En una llamada de 10 minutos
              entendemos como trabajas y que necesitas automatizar.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">⚙️</div>
            <h3>Configuramos todo por ti</h3>
            <p>
              Creamos tu entorno con mesas, carta, categorias, accesos
              y toda la configuracion. Listo para usar.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">🧠</div>
            <h3>La IA aprende tu restaurante</h3>
            <p>
              Desde el primer servicio, Alef empieza a recoger datos.
              En dias ya tienes insights de ventas, margenes y tendencias.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">🚀</div>
            <h3>Tu restaurante funciona solo</h3>
            <p>
              Stock, proveedores, alertas, finanzas — todo automatizado.
              Tu te dedicas a tus clientes y a cocinar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
