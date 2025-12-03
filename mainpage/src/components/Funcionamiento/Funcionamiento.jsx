import React from "react";
import "./Funcionamiento.css";
import setupImg from "../../assets/imagenes/main.png";

export default function Funcionamiento() {
  return (
    <section className="Fn" aria-labelledby="fn-title">
      <div className="Fn-inner">

        {/* TÍTULO CENTRAL */}
        <header className="Fn-header">
          <span className="Fn-badge">Así funciona Alef de principio a fin</span>
          <h2 id="fn-title">Tu TPV Alef funcionando en minutos</h2>
          <p>
            Desde la elección del plan hasta tomar tu primer pedido. 
            Sin técnicos, sin complicaciones: configuración automática y asistencia incluida.
          </p>
        </header>

        {/* PASOS CON ICONOS */}
        <div className="Fn-steps">
          <div className="Fn-step">
            <div className="Fn-step-icon">📦</div>
            <h3>Elige tu plan</h3>
            <p>Selecciona rápidamente según el tamaño y estilo de tu restaurante.</p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">🎨</div>
            <h3>Personaliza tu TPV</h3>
            <p>Define colores, carta, estaciones, branding y funciones avanzadas.</p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">📦</div>
            <h3>Recibe el equipo</h3>
            <p>Hardware preconfigurado, listo para enchufar, encender y usar.</p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">🚀</div>
            <h3>Empieza a trabajar</h3>
            <p>Accede al dashboard y controla tu restaurante desde el primer día.</p>
          </div>
        </div>

      </div>
    </section>
  );
}
