import { useEffect, useMemo } from "react";
import "./ErrorToast.css";

function copy(text) {
  try {
    navigator.clipboard.writeText(String(text || ""));
  } catch {}
}

export default function ErrorToast({
  error,
  onRetry,
  supportHref,
  onClose,
  autoHideMs = 0,
  showSupport = true,
}) {
  const requestId =
    error?.requestId && error.requestId !== "—" ? error.requestId : null;

  const code = error?.code || "—";
  const canRetry = !!error?.canRetry && typeof onRetry === "function";

  // ✅ Política simple:
  // - si showSupport=false => nunca mostramos soporte
  // - si showSupport=true => solo si tiene sentido (CONTACT_SUPPORT o server)
  const shouldShowSupport =
    !!showSupport && (error?.action === "CONTACT_SUPPORT" || error?.kind === "server");

  const helpUrl =
    supportHref ||
    `/ayuda/ticket?nuevo=1&code=${encodeURIComponent(code)}&requestId=${encodeURIComponent(
      requestId || ""
    )}`;

  const subtitle = useMemo(() => {
    if (error?.kind === "rate_limit" && error?.retryAfter) {
      return `Puedes reintentar en ${error.retryAfter}s.`;
    }

    if (error?.action === "REAUTH") {
      return "Revisa tus credenciales e inténtalo de nuevo.";
    }

    if (error?.action === "RETRY") {
      return shouldShowSupport
        ? "Prueba de nuevo; si persiste, abre un ticket con el ID."
        : "Prueba de nuevo en unos segundos.";
    }

    return shouldShowSupport
      ? "Si necesitas ayuda, abre un ticket con el ID de diagnóstico."
      : "Si el problema persiste, revisa la información e inténtalo de nuevo.";
  }, [error, shouldShowSupport]);

  // autocierre (opcional)
  useEffect(() => {
    if (!autoHideMs) return;
    const t = setTimeout(() => onClose?.(), autoHideMs);
    return () => clearTimeout(t);
  }, [autoHideMs, onClose]);

  return (
    <div className="alef-toast" role="alert" aria-live="polite">
      <button
        className="alef-toast__close"
        onClick={onClose}
        aria-label="Cerrar"
      >
        ×
      </button>

      <div className="alef-toast__head">
        <div className="alef-toast__title">Algo no salió bien</div>
        <div className="alef-toast__code">#{code}</div>
      </div>

      <div className="alef-toast__msg">{error?.message || "Error inesperado"}</div>
      <div className="alef-toast__sub">{subtitle}</div>

      <div className="alef-toast__actions">
        {canRetry && (
          <button className="tbtn tbtn-primary" onClick={onRetry}>
            Reintentar
          </button>
        )}

        {shouldShowSupport && (
          <>
            <button
              className="tbtn tbtn-secondary"
              onClick={() => requestId && copy(requestId)}
              disabled={!requestId}
              title={!requestId ? "No hay ID disponible" : "Copiar ID"}
            >
              Copiar ID
            </button>

            <a className="tbtn tbtn-accent" href={helpUrl}>
              Abrir ticket
            </a>
          </>
        )}
      </div>

      {shouldShowSupport && (
        <div className="alef-toast__meta">
          <span>
            ID: <b>{requestId || "—"}</b>
          </span>
        </div>
      )}
    </div>
  );
}