import React, { useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import "./ModalBase.css";

function getFocusable(container) {
  if (!container) return [];
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll(selectors.join(",")))
    .filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
}

export default function ModalBase({
  open,
  title,
  subtitle,
  children,
  footer,
  onClose,

  // opciones pro
  width = 720,
  closeOnOverlay = true,
  closeOnEsc = true,
  showClose = true,
}) {
  const titleId = useId();
  const descId = useId();

  const overlayRef = useRef(null);
  const cardRef = useRef(null);
  const closeBtnRef = useRef(null);
  const lastActiveElRef = useRef(null);

  const style = useMemo(
    () => ({
      ["--alefModalWidth"]: `${width}px`,
    }),
    [width]
  );

  // ⚖️ D-443 · referencia siempre actualizada a `onClose`, para poder sacarla de las
  // dependencias del efecto de abajo sin que el Escape se quede con una version vieja.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;

    // guarda foco previo
    lastActiveElRef.current = document.activeElement;

    // lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // ⚖️ D-443 · FOCO INICIAL AL PRIMER CAMPO ESCRIBIBLE, NO AL BOTON DE CERRAR.
    //
    // ⚠️ Antes esto hacia `closeBtnRef.current.focus()` SIEMPRE. En escritorio era un parpadeo
    // invisible; en PANTALLA TACTIL es «no puedo escribir»: el campo con `autoFocus` coge el
    // foco y abre el teclado, y un instante despues este temporizador se lo lleva a la ✕ —
    // y el teclado se cierra. Lo vio Valen en «Nuevo item de stock» (9-sep-2026).
    //
    // ⭐ Y no basta con no robarlo: si el campo ya tiene el foco (por `autoFocus`), NO se toca.
    // Mover el foco a otro sitio, aunque sea a un campo, tambien cierra el teclado.
    const focusTimer = setTimeout(() => {
      const card = cardRef.current;
      if (!card) return;
      // ¿ya hay algo del modal enfocado? entonces no se toca nada.
      if (card.contains(document.activeElement) && document.activeElement !== closeBtnRef.current) return;

      const focusables = getFocusable(card);
      const escribible = focusables.find(
        (el) => el.matches("input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]), textarea, select")
      );
      if (escribible) escribible.focus();
      else if (closeBtnRef.current) closeBtnRef.current.focus();
      else if (focusables[0]) focusables[0].focus();
    }, 0);

    const onKeyDown = (e) => {
      if (closeOnEsc && e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current?.();
        return;
      }

      // focus trap
      if (e.key === "Tab") {
        const focusables = getFocusable(cardRef.current);
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;

      // restaura foco
      const last = lastActiveElRef.current;
      if (last && typeof last.focus === "function") last.focus();
    };
    // ⚖️ D-443 (segunda mitad) · `onClose` FUERA de las dependencias.
    //
    // ⚠️ Los 9 consumidores lo pasan como funcion anonima (`onClose={() => setModal(null)}`),
    // que es NUEVA en cada render del padre. Con `onClose` aqui dentro, cada repintado del padre
    // desmontaba y rehacia todo este efecto — y con el, el robo de foco. Medido: tras un
    // repintado el foco acababa en «Cerrar» estando el usuario escribiendo.
    // Se lee por referencia (`onCloseRef`) para que el manejador de Escape siga usando la
    // ultima version sin que su identidad reejecute el efecto.
  }, [open, closeOnOverlay, closeOnEsc]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="alefModal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={subtitle ? descId : undefined}
      style={style}
      onMouseDown={(e) => {
        if (!closeOnOverlay) return;
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={cardRef}
        className="alefModal-container"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="alefModal-header">
          <div className="alefModal-headings">
            {title && (
              <h3 id={titleId} className="alefModal-title">
                {title}
              </h3>
            )}
            {subtitle && (
              <p id={descId} className="alefModal-subtitle">
                {subtitle}
              </p>
            )}
          </div>

          {showClose && (
            <button
              ref={closeBtnRef}
              className="alefModal-close"
              onClick={onClose}
              aria-label="Cerrar"
              type="button"
            >
              ✕
            </button>
          )}
        </header>

        <section className="alefModal-body">{children}</section>

        {footer ? <footer className="alefModal-footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body
  );
}
