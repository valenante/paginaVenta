// src/context/ToastContext.jsx
import { createContext, useContext, useState, useCallback, useRef } from "react";
import "./ToastContext.css";

const ToastContext = createContext(null);

/**
 * Proveedor global de toasts simples.
 * Para errores de API con requestId / retry usar ErrorToast directamente en el componente.
 * Para feedback rápido (validación, éxito, info) usar useToast().showToast().
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, tipo = "info", duracion = 3500) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev.slice(-4), { id, message, tipo }]);
      if (duracion > 0) {
        setTimeout(() => dismiss(id), duracion);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.tipo}`}>
          <span className="toast-msg">{t.message}</span>
          <button
            className="toast-close"
            onClick={() => onDismiss(t.id)}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
