import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/RegistroSuccess.css";

import logo from "../assets/imagenes/alef.png"; // 👈 AJUSTA si tu ruta es diferente

export default function RegistroSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("cargando");
  const navigate = useNavigate();

  const sessionId = searchParams.get("session_id");
  const tenantName = searchParams.get("tenant");

  useEffect(() => {
    const verificarPago = async () => {
      if (!sessionId) {
        setStatus("error");
        return;
      }

      try {
        const { data } = await api.get(`/pago/verificar?session_id=${sessionId}`);

        if (data.status === "paid") {
          setStatus("exito");
        } else {
          setStatus("pendiente");
        }
      } catch (err) {
        console.error("❌ Error verificando pago:", err);
        setStatus("error");
      }
    };

    verificarPago();
  }, [sessionId]);

  return (
    <main className="success-container">
      <div className="success-card">
        <img src={logo} alt="Alef Logo" className="success-logo" />

        {status === "cargando" && (
          <>
            <div className="success-spinner"></div>
            <h2>Verificando tu pago...</h2>
            <p>Estamos validando la información con Stripe.</p>
          </>
        )}

        {status === "exito" && (
          <>
            <h1 className="success-title">🎉 ¡Pago completado!</h1>
            <p className="success-text">
              Tu restaurante <strong>{tenantName || "Alef"}</strong> está siendo configurado.
            </p>
            <p className="success-text">
              En unos minutos recibirás un correo con los accesos.
            </p>

            <button className="success-btn" onClick={() => navigate("/")}>
              Volver al inicio
            </button>
          </>
        )}

        {status === "pendiente" && (
          <>
            <h1 className="success-title">⏳ Pago pendiente</h1>
            <p className="success-text">
              El pago está en proceso. En breve recibirás confirmación.
            </p>

            <button className="success-btn" onClick={() => navigate("/")}>
              Volver al inicio
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="success-title error">❌ Error en el pago</h1>
            <p className="success-text">
              No hemos podido verificar tu transacción.
            </p>
            <p className="success-text">
              Si crees que el cargo se realizó correctamente, contáctanos.
            </p>

            <button className="success-btn" onClick={() => navigate("/")}>
              Volver al inicio
            </button>
          </>
        )}
      </div>
    </main>
  );
}
