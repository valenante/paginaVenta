import { useState } from "react";
import api from "../../utils/api";
import "../../styles/Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🔹 Se enviará el tenantId desde el encabezado (Auth o contexto)
      const tenantId = sessionStorage.getItem("tenantId") || "global";
      await api.post(
        "/password/forgot-password",
        { email },
        { headers: { "x-tenant-id": tenantId } }
      );

      setEnviado(true);
    } catch (err) {
      console.error("❌ Error al enviar correo:", err);
      setError(
        err.response?.data?.error ||
          "Error al enviar el correo. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <main className="login-page">
        <div className="login-container">
          <h1 className="login-title">Correo enviado ✅</h1>
          <p className="login-subtitle">
            Hemos enviado un enlace para restablecer tu contraseña.  
            Revisa tu bandeja de entrada (y la carpeta de spam).
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="login-container">
        <h1 className="login-title">¿Olvidaste tu contraseña?</h1>
        <p className="login-subtitle">
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Correo electrónico:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>
      </div>
    </main>
  );
}
