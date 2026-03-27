import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import "../../styles/Login.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailValid = EMAIL_RE.test(email.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!emailValid) {
      setError("Introduce un correo electrónico válido.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/password/forgot-password", { email: email.trim() });

      setEnviado(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
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
        <div className="forgot-container" style={{ textAlign: "center" }}>
          <h1 className="forgot-title">Revisa tu correo</h1>
          <p className="forgot-subtitle">
            Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace
            para restablecer tu contraseña en los próximos minutos.
          </p>
          <p className="forgot-subtitle" style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#64748b" }}>
            Revisa también la carpeta de spam o correo no deseado.
          </p>
          <div style={{ marginTop: "1.5rem" }}>
            <Link to="/login" className="login-link">
              Volver al login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="forgot-container">
        <h1 className="forgot-title">¿Olvidaste tu contraseña?</h1>
        <p className="forgot-subtitle">
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>

        <form className="forgot-form" onSubmit={handleSubmit}>
          <div className="forgot-field">
            <label>Correo electrónico</label>
            <input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {error && <p className="forgot-error">{error}</p>}

          <button className="forgot-btn" disabled={loading || !emailValid}>
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <Link to="/login" className="login-link">
            Volver al login
          </Link>
        </div>
      </div>
    </main>
  );
}
