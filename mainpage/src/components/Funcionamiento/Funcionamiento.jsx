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
          <h2 id="fn-title">Tu sistema Alef funcionando en minutos</h2>
          <p>
            Desde la activación del entorno hasta tu primera venta.
            Restaurantes y tiendas comparten la misma base: configuración
            automática, hardware listo y soporte incluido.
          </p>
        </header>

        {/* PASOS CON ICONOS */}
        <div className="Fn-steps">
          <div className="Fn-step">
            <div className="Fn-step-icon">📦</div>
            <h3>Elige tu plan</h3>
            <p>
              Selecciona el plan según tu negocio: restaurante, tienda o ambos.
              Sin límites de dispositivos ni usuarios.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">🎨</div>
            <h3>Configura tu entorno</h3>
            <p>
              Personaliza diseño, funciones, impuestos, stock, proveedores,
              estaciones y flujos de trabajo.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">🖥️</div>
            <h3>Conecta tus dispositivos</h3>
            <p>
              Usa ordenadores, tablets, móviles, impresoras y escáneres.
              Todo funciona desde el navegador, sin instalaciones.
            </p>
          </div>

          <div className="Fn-step">
            <div className="Fn-step-icon">🚀</div>
            <h3>Empieza a trabajar</h3>
            <p>
              Vende, controla stock, gestiona proveedores y consulta estadísticas
              desde el primer día.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
