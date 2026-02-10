import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/RegistroSuccess.css";
import logo from "../assets/imagenes/alef.png";

export default function RegistroSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = searchParams.get("session_id");
  const precheckoutId = searchParams.get("precheckoutId");

  const [view, setView] = useState("cargando"); 
  // "cargando" | "pendientePago" | "provisioning" | "activo" | "warning" | "failed" | "error"

  const [tenantNombre, setTenantNombre] = useState("");
  const [passwordSetupUrl, setPasswordSetupUrl] = useState("");
  const [failMsg, setFailMsg] = useState("");

  useEffect(() => {
    if (!sessionId || !precheckoutId) {
      setView("error");
      return;
    }

    let alive = true;
    let intervalId = null;

    const startPollingEstado = () => {
      intervalId = setInterval(async () => {
        try {
          const { data } = await api.get("/pago/estado", {
            params: { session_id: sessionId, precheckoutId },
          });

          if (!alive) return;

          const nombre = data?.tenant?.nombre || data?.tenant?.name || "";
          if (nombre) setTenantNombre(nombre);

          if (data?.passwordSetupUrl) setPasswordSetupUrl(data.passwordSetupUrl);

          if (data.status === "PROVISIONING" || data.status === "PAYMENT_PENDING") {
            setView("provisioning");
            return;
          }

          if (data.status === "FAILED") {
            setFailMsg(data?.error?.message || "Error desconocido");
            setView("failed");
            clearInterval(intervalId);
            return;
          }

          if (data.status === "ACTIVE_WITH_WARNINGS") {
            setView("warning");
            clearInterval(intervalId);
            return;
          }

          if (data.status === "ACTIVE") {
            setView("activo");
            clearInterval(intervalId);
            return;
          }

          // fallback
          setView("provisioning");
        } catch (e) {
          if (!alive) return;
          setView("error");
          clearInterval(intervalId);
        }
      }, 2000);
    };

    const run = async () => {
      try {
        // 1) Verificar pago UNA vez (opcional pero recomendado)
        const { data } = await api.get("/pago/verificar", {
          params: { session_id: sessionId, precheckoutId },
        });

        if (!alive) return;

        // Si no está pagado, muestra pendiente
        if (data.payment_status !== "paid") {
          setView("pendientePago");
          return;
        }

        // 2) Pagado → empezar polling de provisioning
        setView("provisioning");
        startPollingEstado();
      } catch (e) {
        if (!alive) return;
        setView("error");
      }
    };

    run();

    return () => {
      alive = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionId, precheckoutId]);

  return (
    <main className="success-container">
      <div className="success-card">
        <img src={logo} alt="Alef Logo" className="success-logo" />

        {view === "cargando" && (
          <>
            <div className="success-spinner"></div>
            <h2>Verificando tu pago...</h2>
            <p>Estamos validando la información con Stripe.</p>
          </>
        )}

        {view === "pendientePago" && (
          <>
            <h1 className="success-title">⏳ Pago pendiente</h1>
            <p className="success-text">El pago todavía no aparece como completado.</p>
            <button className="success-btn" onClick={() => navigate("/")}>
              Volver al inicio
            </button>
          </>
        )}

        {view === "provisioning" && (
          <>
            <div className="success-spinner"></div>
            <h1 className="success-title">⚙️ Creando tu entorno...</h1>
            <p className="success-text">
              {tenantNombre ? (
                <>Estamos configurando <strong>{tenantNombre}</strong>.</>
              ) : (
                <>Estamos configurando tu restaurante/tienda.</>
              )}
            </p>
            <p className="success-text">No cierres esta página.</p>
          </>
        )}

        {view === "activo" && (
          <>
            <h1 className="success-title">🎉 ¡Todo listo!</h1>
            <p className="success-text">
              {tenantNombre ? (
                <>Tu entorno <strong>{tenantNombre}</strong> ya está creado.</>
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
              Está operativo, pero hubo un aviso (por ejemplo: email).
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

        {view === "failed" && (
          <>
            <h1 className="success-title error">❌ Hubo un problema</h1>
            <p className="success-text">{failMsg}</p>
            <p className="success-text">
              El pago está registrado. Vamos a solucionarlo.
            </p>
            <button className="success-btn" onClick={() => navigate("/")}>
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
