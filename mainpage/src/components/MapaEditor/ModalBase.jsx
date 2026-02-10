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

  useEffect(() => {
    if (!open) return;

    // guarda foco previo
    lastActiveElRef.current = document.activeElement;

    // lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // focus inicial
    const focusTimer = setTimeout(() => {
      const focusables = getFocusable(cardRef.current);
      if (closeBtnRef.current) closeBtnRef.current.focus();
      else if (focusables[0]) focusables[0].focus();
    }, 0);

    const onKeyDown = (e) => {
      if (closeOnEsc && e.key === "Escape") {
        e.preventDefault();
        onClose?.();
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
  }, [open, onClose, closeOnOverlay, closeOnEsc]);

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
