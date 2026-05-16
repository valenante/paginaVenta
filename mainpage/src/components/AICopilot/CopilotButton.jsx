import React, { useRef, useCallback } from "react";
import logoAlef from "../../assets/imagenes/alef.png";

/**
 * Orbe IA — respira, cambia color según estado del restaurante,
 * muestra badge con insights pendientes.
 */
export default function CopilotButton({ onClick, onLongPress, severity, insightCount }) {
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

  // severity: "ok" | "info" | "alta" | "critica"
  const sev = severity || "ok";

  return (
    <button
      className={`copilot-orb copilot-orb--${sev}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      aria-label="Abrir ALEF Autopilot"
      title="ALEF Autopilot — mantén pulsado para pantalla completa"
    >
      {/* Anillos de respiración */}
      <span className="copilot-orb__ring copilot-orb__ring--1" />
      <span className="copilot-orb__ring copilot-orb__ring--2" />

      {/* Logo central */}
      <img src={logoAlef} alt="ALEF" className="copilot-orb__logo" />

      {/* Badge */}
      {insightCount > 0 && (
        <span className="copilot-orb__badge">{insightCount > 9 ? "9+" : insightCount}</span>
      )}
    </button>
  );
}
