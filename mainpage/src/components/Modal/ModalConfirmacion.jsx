import React, { useState } from "react";
import "./ModalConfirmacion.css";

export default function ModalConfirmacion({
  titulo = "Confirmar acción",
  mensaje = "¿Está seguro?",
  placeholder = "",
  onConfirm,
  onClose,
  children
}) {
  const [valor, setValor] = useState("");

  const manejarConfirmacion = () => {
    onConfirm(valor.trim());
  };

  return (
    <div className="modal-overlay--modalconfirmacion">
      <div className="modal-contenido--modalconfirmacion glass-card">
        
        <h2 className="modal-titulo--modalconfirmacion">{titulo}</h2>
        <p className="modal-mensaje--modalconfirmacion">{mensaje}</p>

        {children && (
          <div className="modal-extra--modalconfirmacion">
            {children}
          </div>
        )}

        {placeholder && (
          <>
            {placeholder.toLowerCase().includes("comensales") ? (
              <input
                type="number"
                min="1"
                max="25"
                step="1"
                inputMode="numeric"
                pattern="[0-9]*"
                className="modal-input--modalconfirmacion"
                placeholder={placeholder}
                value={valor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (
                    /^\d*$/.test(value) &&
                    (value === "" ||
                      (Number(value) >= 1 && Number(value) <= 25))
                  ) {
                    setValor(value);
                  }
                }}
              />
            ) : (
              <input
                type="text"
                className="modal-input--modalconfirmacion"
                placeholder={placeholder}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            )}
          </>
        )}

        <div className="modal-botones--modalconfirmacion">
          <button
            onClick={onClose}
            className="boton-cancelar--modalconfirmacion"
          >
            Cancelar
          </button>

          <button
            onClick={manejarConfirmacion}
            className="boton-aceptar--modalconfirmacion"
          >
            Aceptar
          </button>
        </div>

      </div>
    </div>
  );
}
