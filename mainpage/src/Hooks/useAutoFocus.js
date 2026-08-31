import { useEffect, useRef } from "react";

/**
 * useAutoFocus — autofocus consciente del dispositivo.
 *
 * Regla (fuente de verdad ÚNICA, no repetir en cada modal):
 *   El autofocus es una comodidad SOLO de escritorio. En dispositivos táctiles
 *   el foco por código NO abre el teclado en pantalla y deja el input "ya
 *   enfocado", de modo que el primer toque del usuario no lo reabre → no se
 *   puede escribir. Por eso en táctil NO pre-enfocamos: dejamos que el usuario
 *   toque y sea su gesto quien abra el teclado.
 *
 * Sustituye al atributo nativo `autoFocus`, que está prohibido por ESLint
 * (`jsx-a11y/no-autofocus`) precisamente por este bug y por accesibilidad.
 *
 * Uso:
 *   const ref = useAutoFocus(open);        // modal: re-enfoca cada vez que abre
 *   <input ref={ref} ... />                // (sin autoFocus)
 *
 * @param {boolean} active  Cuándo debe intentar enfocar (p.ej. el prop `open`
 *                          del modal). Por defecto true (enfoca al montar).
 * @returns {React.RefObject} ref a colocar en el input/textarea/select.
 */
export function useAutoFocus(active = true) {
  const ref = useRef(null);

  useEffect(() => {
    if (!active) return;
    if (isCoarsePointer()) return; // táctil → no pre-enfocar

    // rAF: asegura que el nodo está montado y pintado antes de enfocar.
    const id = requestAnimationFrame(() => {
      const el = ref.current;
      // Solo si está realmente visible (getClientRects vacío = display:none /
      // desmontado). Evita robar foco en modales que quedan montados ocultos.
      if (el && typeof el.focus === "function" && el.getClientRects().length > 0) {
        el.focus();
      }
    });
    return () => cancelAnimationFrame(id);
  }, [active]);

  return ref;
}

function isCoarsePointer() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(any-pointer: coarse)").matches
  );
}

export default useAutoFocus;
