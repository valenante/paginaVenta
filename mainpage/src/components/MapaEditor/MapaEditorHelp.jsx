import React, { useEffect, useState } from "react";
import "./MapaEditorHelp.css";

export default function MapaEditorHelp() {
  const [open, setOpen] = useState(false);

  // ESC cierra, Ctrl/Cmd + ? abre/cierra (opcional)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);

      const isToggle =
        (e.ctrlKey || e.metaKey) && (e.key === "?" || (e.shiftKey && e.key === "/"));
      if (isToggle) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        className="mapa-help-fab"
        onClick={() => setOpen(true)}
        aria-label="Ayuda del editor de plano"
        title="Ayuda (Ctrl/Cmd + ?)"
      >
        ?
      </button>

      {/* Modal independiente */}
      {open && (
        <div
          className="mapa-help-overlay"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="mapa-help-modal" onClick={(e) => e.stopPropagation()}>
            <header className="mapa-help-header">
              <div>
                <h2 className="mapa-help-title">Ayuda — Editor de plano</h2>
                <p className="mapa-help-subtitle">
                  Guía rápida para editar el mapa.
                </p>
              </div>

              <button
                type="button"
                className="mapa-help-close"
                onClick={() => setOpen(false)}
                aria-label="Cerrar ayuda"
              >
                ✕
              </button>
            </header>

            <div className="mapa-help-body">
              <section className="mapa-help-section">
                <h3>Qué estás editando</h3>
                <p>
                  Este editor define la <strong>posición visual</strong> de las mesas en el plano.
                  Al mover una mesa, se guarda su posición para que el TPV muestre el local tal como es.
                </p>
              </section>

              <section className="mapa-help-section">
                <h3>Controles</h3>
                <ul>
                  <li>
                    <strong>Arrastrar mesa:</strong> clic y arrastra para recolocar.
                  </li>
                  <li>
                    <strong>Editar mesa:</strong> mantén pulsado ~700ms sobre una mesa.
                  </li>
                  <li>
                    <strong>Bloquear plano:</strong> desactiva el arrastre para evitar movimientos accidentales.
                  </li>
                  <li>
                    <strong>Zona:</strong> cambia entre <em>Interior</em> y <em>Terraza</em>.
                  </li>
                </ul>
              </section>

              <section className="mapa-help-section">
                <h3>Mesas auxiliares</h3>
                <p>
                  Son mesas de apoyo que no forman parte del plano principal. Puedes seleccionarlas
                  para editarlas desde el panel correspondiente.
                </p>
              </section>

              <section className="mapa-help-section">
                <h3>Recomendaciones</h3>
                <ul>
                  <li>Deja el plano bloqueado cuando termines.</li>
                  <li>Coloca primero las mesas “fijas” y luego ajusta el resto.</li>
                  <li>Si una mesa queda cerca del borde, sepárala un poco para evitar errores de toque.</li>
                </ul>
              </section>

              <div className="mapa-help-footer">
                <span>Tip: pulsa <strong>ESC</strong> para cerrar.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
