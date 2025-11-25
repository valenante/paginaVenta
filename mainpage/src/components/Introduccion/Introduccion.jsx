import React from "react";
import "./Introduccion.css";
import main from "../../assets/imagenes/main.png";

const Introduccion = () => {
  return (
    <section className="Introduccion reveal" id="inicio">
      <div className="Introduccion-left">
        <div className="Introduccion-contenido">
          <h1 className="Introduccion-titulo">
            🍽️ Sistema TPV para Restaurantes – Gestión Total en Tiempo Real
          </h1>
          <p className="Introduccion-subtitulo">
            Presentamos nuestro sistema TPV desarrollado específicamente para restaurantes, diseñado desde cero con experiencia real en el sector hostelero. Digitaliza y optimiza la gestión completa del restaurante, desde el pedido del cliente hasta la impresión de la factura. Cumple con la legislación actual y está preparado para futuras normativas como VERI*FACTU.
          </p>
          <div className="Introduccion-botones">
            <a href="#ventajas" className="Introduccion-boton">Ver funcionalidades</a>
            <a href="#contacto" className="Introduccion-boton secundario">Solicitar demo</a>
          </div>
        </div>
      </div>
      <div className="Introduccion-right">
        <img
          src={main}
          alt="TPV restaurante"
          className="Introduccion-imagen"
        />
      </div>
    </section>
  );
};

export default Introduccion;
