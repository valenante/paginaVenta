import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../styles/RegistroSuccess.css";

export default function RegistroSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("cargando");
  const navigate = useNavigate();

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      console.log("✅ Pago completado. Session ID:", sessionId);
      setStatus("exito");
    } else {
      setStatus("error");
    }
  }, [sessionId]);

  if (status === "cargando") {
    return (
      <div className="registro-success">
        <div className="spinner"></div>
        <p>Verificando tu pago...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="registro-success">
        <h2>❌ Error al verificar el pago</h2>
        <button onClick={() => navigate("/")}>Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="registro-success">
      <h1>✅ ¡Pago completado con éxito!</h1>
      <p>Tu restaurante está siendo configurado. Te contactaremos por correo.</p>
      <button onClick={() => navigate("/")}>Volver al inicio</button>
    </div>
  );
}
