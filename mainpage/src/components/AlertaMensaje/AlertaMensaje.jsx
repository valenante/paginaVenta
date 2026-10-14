import React, { useEffect } from "react";
import "./AlertaMensaje.css";

const AlertaMensaje = ({ tipo = "info", mensaje, onClose, autoCerrar = true, duracion = 3000 }) => {
  useEffect(() => {
    if (autoCerrar && onClose) {
      const timer = setTimeout(onClose, duracion);
      return () => clearTimeout(timer);
    }
  }, [autoCerrar, duracion, onClose]);


  return (
    <div className={`alerta-mensaje alerta-${tipo}`}>
      <span>{mensaje}</span>
      {/* D-1330/D-1331 · type="button": sin `type`, un <button> dentro de un <form> ENVÍA el form, y
          la × volvía a guardar (producto o reserva duplicados). Cerrar un aviso nunca envía nada. */}
      <button type="button" onClick={onClose} className="alerta-cerrar">×</button>
    </div>
  );
};

export default AlertaMensaje;
