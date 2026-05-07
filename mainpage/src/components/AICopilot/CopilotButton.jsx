import React, { useRef, useCallback } from "react";
import logoAlef from "../../assets/imagenes/alef.png";

export default function CopilotButton({ onClick, onLongPress }) {
  const timerRef = useRef(null);
  const firedRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress?.();
    }, 400);
  }, [onLongPress]);

  const handlePointerUp = useCallback(() => {
    clearTimeout(timerRef.current);
    if (!firedRef.current) onClick?.();
  }, [onClick]);

  const handlePointerLeave = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  return (
    <button
      className="copilot-btn"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      aria-label="Abrir ALEF Copilot"
      title="ALEF Copilot — mantén pulsado para pantalla completa"
    >
      <img src={logoAlef} alt="ALEF" className="copilot-btn__logo" />
      <span className="copilot-btn__pulse" />
    </button>
  );
}
