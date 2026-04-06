import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import "../styles/RegistroSuccess.css";
import logo from "../assets/imagenes/alef.png";

const STEP_LABELS = [
  ["stripeSubscription", "Verificando suscripción en Stripe"],
  ["tenantGlobal", "Creando entorno del negocio"],
  ["db", "Inicializando base de datos"],
  ["users", "Creando usuario administrador"],
  ["config", "Aplicando configuración inicial"],
  ["dns", "Configurando subdominios"],
  ["qr", "Generando QR (si aplica)"],
  ["passwordSetup", "Generando enlace de contraseña"],
  ["emailSent", "Enviando email de bienvenida"],
  ["post", "Tareas finales (servicios / notificaciones)"],
  ["tenantSubscription", "Guardando suscripción"],
  ["configSync", "Sincronizando configuración"],
];

export default function RegistroSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const sessionId = searchParams.get("session_id");
  const precheckoutId = searchParams.get("precheckoutId");

  const [view, setView] = useState("cargando");
  // "cargando" | "pendientePago" | "provisioning" | "activo" | "warning" | "failed" | "error" | "cancelado"

  const [tenantNombre, setTenantNombre] = useState("");
  const [passwordSetupUrl, setPasswordSetupUrl] = useState("");
  const [failMsg, setFailMsg] = useState("");

  const [steps, setSteps] = useState({});
  const [warnings, setWarnings] = useState({});
  const [retrying, setRetrying] = useState(false);

  const aliveRef = useRef(true);
  const pollingRef = useRef(null);
  const inFlightRef = useRef(false);

  // ✅ soporta /pago/cancelado sin params
  useEffect(() => {
    if (location.pathname === "/pago/cancelado") {
      setView("cancelado");
    }
  }, [location.pathname]);

  const stopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = null;
  };

  const fetchEstado = async () => {
    if (!aliveRef.current) return;
    if (!sessionId || !precheckoutId) return;

    // evita solapar requests si una tarda más de 2s
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const { data } = await api.get("/pago/estado", {
        params: { session_id: sessionId, precheckoutId },
      });

      if (!aliveRef.current) return;

      const nombre = data?.tenant?.nombre || data?.tenant?.name || "";
      if (nombre) setTenantNombre(nombre);

      if (data?.passwordSetupUrl) setPasswordSetupUrl(data.passwordSetupUrl);

      setSteps(data?.steps || {});
      setWarnings(data?.warnings || {});

      if (data.status === "PROVISIONING" || data.status === "PAYMENT_PENDING") {
        setView("provisioning");
        return;
      }

      if (data.status === "FAILED") {
        setFailMsg(data?.error?.message || "Error desconocido");
        setView("failed");
        stopPolling();
        return;
      }

      if (data.status === "ACTIVE_WITH_WARNINGS") {
        setView("warning");
        stopPolling();
        return;
      }

      if (data.status === "ACTIVE") {
        setView("activo");
        stopPolling();
        try { localStorage.removeItem("alef_registro_draft"); } catch {}
        return;
      }

      // fallback
      setView("provisioning");
    } catch (e) {
      if (!aliveRef.current) return;
      setView("error");
      stopPolling();
    } finally {
      inFlightRef.current = false;
    }
  };

  const startPolling = () => {
    stopPolling();
    // tick inmediato + interval
    fetchEstado();
    pollingRef.current = setInterval(fetchEstado, 2500);
  };

  useEffect(() => {
    aliveRef.current = true;

    // si estamos en cancelado, no hacemos requests
    if (view === "cancelado") {
      stopPolling();
      return () => {
        aliveRef.current = false;
        stopPolling();
      };
    }

    if (!sessionId || !precheckoutId) {
      setView("error");
      return () => {
        aliveRef.current = false;
        stopPolling();
      };
    }

    const run = async () => {
      try {
        // 1) verificar pago una vez
        const { data } = await api.get("/pago/verificar", {
          params: { session_id: sessionId, precheckoutId },
        });

        if (!aliveRef.current) return;

        const paid =
          data?.payment_status === "paid" ||
          data?.payment_status === "no_payment_required";

        if (!paid) {
          setView("pendientePago");
          stopPolling();
          return;
        }

        // 2) pagado -> provisioning + polling
        setView("provisioning");
        startPolling();
      } catch (e) {
        if (!aliveRef.current) return;
        setView("error");
        stopPolling();
      }
    };

    run();

    return () => {
      aliveRef.current = false;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, precheckoutId, view]);

  const handleRetry = async () => {
    if (!sessionId || !precheckoutId) return;
    if (retrying) return;

    setRetrying(true);
    setFailMsg("");

    try {
      const { data } = await api.post("/pago/reintentar", {
        session_id: sessionId,
        precheckoutId,
      });

      if (!data?.ok) {
        setFailMsg("No se pudo reintentar ahora. Inténtalo en unos segundos.");
        setView("failed");
        return;
      }

      setView("provisioning");
      startPolling();
    } catch (e) {
      setFailMsg("No se pudo reintentar ahora. Inténtalo en unos segundos.");
      setView("failed");
    } finally {
      setRetrying(false);
    }
  };

  const hasWarnings = warnings && Object.keys(warnings).length > 0;

  return (
    <main className="success-container">
      <div className="success-card">
        <img src={logo} alt="Alef Logo" className="success-logo" />

        {view === "cargando" && (
          <>
            <div className="success-spinner" />
            <h2 className="success-title">Verificando tu pago...</h2>
            <p className="success-text">Estamos validando la información con Stripe.</p>
          </>
        )}

        {view === "cancelado" && (
          <>
            <h1 className="success-title">Pago cancelado</h1>
            <p className="success-text">
              No se ha realizado ningún cargo. Puedes volver al registro cuando quieras.
            </p>
            <button className="success-btn" onClick={() => navigate("/registro")}>
              Volver al registro
            </button>
          </>
        )}

        {view === "pendientePago" && (
          <>
            <h1 className="success-title">⏳ Pago pendiente</h1>
            <p className="success-text">
              El pago todavía no aparece como completado. Si acabas de pagar, espera unos segundos.
            </p>
            <button className="success-btn" onClick={() => navigate("/")}>
              Volver al inicio
            </button>
          </>
        )}

        {view === "provisioning" && (
          <>
            <div className="success-spinner" />
            <h1 className="success-title">⚙️ Creando tu entorno...</h1>

            <p className="success-text">
              {tenantNombre ? (
                <>
                  Estamos configurando <strong>{tenantNombre}</strong>.
                </>
              ) : (
                <>Estamos configurando tu restaurante/tienda.</>
              )}
            </p>

            <p className="success-text">No cierres esta página.</p>

            <div className="success-steps">
              {STEP_LABELS.map(([key, label]) => {
                const done = !!steps?.[key];
                return (
                  <div key={key} className={`success-step ${done ? "done" : ""}`}>
                    <span className="success-step-icon">{done ? "✓" : "•"}</span>
                    <span className="success-step-text">{label}</span>
                  </div>
                );
              })}
            </div>

            {hasWarnings && (
              <div className="success-warnings">
                <h3 className="success-warnings-title">⚠️ Avisos</h3>
                <ul className="success-warnings-list">
                  {Object.entries(warnings).map(([k, v]) => (
                    <li key={k}>
                      <strong>{k}:</strong> {v?.message || "Aviso"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {view === "activo" && (
          <>
            <h1 className="success-title">🎉 ¡Todo listo!</h1>

            <p className="success-text">
              {tenantNombre ? (
                <>
                  Tu entorno <strong>{tenantNombre}</strong> ya está creado.
                </>
              ) : (
                <>Tu entorno ya está creado.</>
              )}
            </p>

            {passwordSetupUrl ? (
              <a className="success-btn" href={passwordSetupUrl}>
                Crear contraseña y entrar
              </a>
            ) : (
              <button className="success-btn" onClick={() => navigate("/")}>
                Ir al inicio
              </button>
            )}
          </>
        )}

        {view === "warning" && (
          <>
            <h1 className="success-title">✅ Entorno creado (con avisos)</h1>
            <p className="success-text">
              Está operativo, pero hubo algún aviso (por ejemplo: email). Si necesitas ayuda, lo tenemos registrado.
            </p>

            {hasWarnings && (
              <div className="success-warnings">
                <h3 className="success-warnings-title">⚠️ Avisos</h3>
                <ul className="success-warnings-list">
                  {Object.entries(warnings).map(([k, v]) => (
                    <li key={k}>
                      <strong>{k}:</strong> {v?.message || "Aviso"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {passwordSetupUrl ? (
              <a className="success-btn" href={passwordSetupUrl}>
                Crear contraseña y entrar
              </a>
            ) : (
              <button className="success-btn" onClick={() => navigate("/")}>
                Ir al inicio
              </button>
            )}
          </>
        )}

        {view === "failed" && (
          <>
            <h1 className="success-title error">❌ Hubo un problema</h1>
            <p className="success-text">{failMsg || "Error desconocido"}</p>
            <p className="success-text">
              El pago está registrado. Puedes reintentar el alta ahora mismo.
            </p>

            <button className="success-btn" onClick={handleRetry} disabled={retrying}>
              {retrying ? "Reintentando..." : "Reintentar ahora"}
            </button>

            <p className="success-text subtle">
              ID de soporte: <strong>{precheckoutId}</strong>
            </p>

            <button className="success-btn secondary" onClick={() => navigate("/")}>
              Volver al inicio
            </button>
          </>
        )}

        {view === "error" && (
          <>
            <h1 className="success-title error">❌ Error</h1>
            <p className="success-text">No se pudo verificar el estado.</p>
            <button className="success-btn" onClick={() => navigate("/")}>
              Volver al inicio
            </button>
          </>
        )}
      </div>
    </main>
  );
}