import React, { useState } from "react";
import { createPortal } from "react-dom";
import "./ModalConfirmacion.css";

export default function ModalConfirmacion({
  titulo = "Confirmar acción",
  mensaje = "¿Está seguro?",
  placeholder = "",
  textoConfirmar = "Aceptar",
  onConfirm,
  onClose,
  children,
  // ⭐ 2026-08-13 — `valorRequerido` es OPT-IN y su default es `false` A PROPÓSITO.
  // Este modal tiene 28 consumidores (grep en `src/`). Hacer el campo obligatorio para
  // todos sería un SÍ→NO en 27 pantallas que nadie ha pedido tocar (Art. 7 · Art. 3).
  // Sólo lo activa quien lo necesita; hoy: la anulación de facturas.
  valorRequerido = false,
}) {
  const [valor, setValor] = useState("");

  // ⚠️ Se compara sobre el valor YA recortado: "   " no cuenta como motivo escrito, igual
  // que en el backend, donde `zTrimmedString` aplica `.trim()` antes que nada (Art. 6:
  // una sola idea de "vacío" en los dos lados).
  const valorLimpio = valor.trim();
  const bloqueado = valorRequerido && valorLimpio === "";

  const manejarConfirmacion = () => {
    // Cinturón además del `disabled`: un botón deshabilitado se puede saltar desde las
    // devtools, y este guard es el que de verdad decide.
    if (bloqueado) return;
    onConfirm(valorLimpio);
  };

  // ⭐ SE PORTALIZA A `document.body`, y no es cosmético: MEDIDO el 31-ago en staging.
  //
  // El overlay es `position: fixed; inset: 0`, que debería cubrir la pantalla entera. Pero un
  // `fixed` lo RECORTA cualquier ancestro con `overflow: hidden`, y el panel los tiene: al
  // abrir «Eliminar extra» el overlay medía `top 238 · left 27 · 1852×379` sobre un viewport
  // de `1920×941` — descolocado y cortado a media altura, porque
  // `SECTION.products-content-card--productos` lo estaba clipando.
  //
  // Se arregla AQUÍ y no en cada pantalla: este componente tiene ~29 consumidores y **ninguno**
  // lo envolvía en `<Portal>`. Pedirle a 29 sitios que se acuerden es la definición de una
  // asimetría esperando a pasar (Art. 6). Portalizándose él, todos quedan bien de una vez.
  //
  // ⚠️ `z-index: 50` del CSS se conserva: colgando de `body` ya no compite con las capas
  // internas del panel, así que no hace falta subirlo. Si algún día un overlay hermano lo tapa,
  // el sitio de mirar es `ModalConfirmacion.css`, no este fichero.
  return createPortal(
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
            disabled={bloqueado}
            // Sin esto, un botón gris no dice POR QUÉ está gris y el usuario se queda
            // igual de perdido que con el «Algo no salió bien» que tapó este bug 148 días.
            title={bloqueado ? "Escribe el motivo para continuar" : undefined}
          >
            {textoConfirmar}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
