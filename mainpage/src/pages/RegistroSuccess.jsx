import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/RegistroSuccess.css";

export default function RegistroSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("cargando");
  const navigate = useNavigate();

  const sessionId = searchParams.get("session_id");
  const tenant = searchParams.get("tenant");

  useEffect(() => {
    const verificarPago = async () => {
      if (!sessionId) {
        setStatus("error");
        return;
      }

      try {
        const { data } = await api.get(`/pago/verificar?session_id=${sessionId}`);
        if (data.status === "paid") {
          console.log("✅ Pago verificado correctamente:", data.session.id);
          setStatus("exito");
        } else {
          console.warn("⚠️ Pago no confirmado aún:", data.status);
          setStatus("pendiente");
        }
      } catch (err) {
        console.error("❌ Error verificando pago:", err);
        setStatus("error");
      }
    };

    verificarPago();
  }, [sessionId]);

  // === ESTADOS ===
  if (status === "cargando") {
    return (
      <div className="registro-success">
        <div className="spinner"></div>
        <p>Verificando tu pago...</p>
      </div>
    );
  }

  if (status === "exito") {
    return (
      <div className="registro-success">
        <h1>✅ ¡Pago completado con éxito!</h1>
        <p>
          Tu restaurante <strong>{tenant}</strong> está siendo configurado.
          Recibirás un correo cuando todo esté listo.
        </p>
        <button onClick={() => navigate("/")}>Volver al inicio</button>
      </div>
    );
  }

  if (status === "pendiente") {
    return (
      <div className="registro-success">
        <h2>⏳ Pago pendiente</h2>
        <p>
          El pago se está procesando. Recibirás una confirmación en tu correo.
        </p>
        <button onClick={() => navigate("/")}>Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="registro-success">
      <h2>❌ Error al verificar el pago</h2>
      <p>No se pudo confirmar tu transacción. Si el cargo fue realizado, contáctanos.</p>
      <button onClick={() => navigate("/")}>Volver al inicio</button>
    </div>
  );
}
