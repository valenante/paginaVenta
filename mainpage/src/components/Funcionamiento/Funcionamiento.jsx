import React from "react";
import "./Funcionamiento.css";

export default function Funcionamiento() {
  return (
    <section className="Fn" aria-labelledby="fn-title">
      <div className="Fn-inner">
        {/* TÍTULO CENTRAL */}
        <header className="Fn-header">
          <span className="Fn-badge">Así funciona Alef de principio a fin</span>
          <h2 id="fn-title">Tu sistema Alef funcionando en minutos</h2>
          <p>
            De la activación del entorno a tu primer servicio real.
            Alef está pensado para operar desde el día 1: TPV, cocina/bar,
            impresión, carta digital y panel de gestión, todo en tiempo real y con
            soporte incluido.
          </p>
        </header>

        {/* PASOS */}
        <div className="Fn-steps">
          <div className="Fn-step">
            <div className="Fn-step-icon">📦</div>
            <h3>Elige tu plan</h3>
            <p>
              Seleccionas el plan según tu negocio (restaurante o tienda) y
              Alef te activa el entorno para empezar sin complicaciones.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">⚙️</div>
            <h3>Configura tu operativa</h3>
            <p>
              Ajustas lo importante: mesas, secciones/estaciones, roles, impuestos,
              horarios y el comportamiento del TPV. Todo editable desde el panel.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">🖨️</div>
            <h3>Conecta dispositivos e impresión</h3>
            <p>
              Funciona en PC, tablet o móvil desde el navegador. Puedes asignar
              impresoras por estación, hacer pruebas y usar tickets con secciones y
              mensajes personalizados.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">🚀</div>
            <h3>Empieza a trabajar</h3>
            <p>
              Tomas comandas, cocina/bar marca listo, caja y cierres diarios. Si lo
              activas, tus clientes usan carta QR (idiomas + reservas + “pedir cuenta”
              y valoraciones).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}