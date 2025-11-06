import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "../../styles/Login.css";

export default function ResetPassword() {
  const { tenantId, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post(`/password/reset-password/${tenantId}/${token}`, { password });
      setMensaje("Contraseña restablecida correctamente.");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      console.error("❌ Error al restablecer:", err);
      setError(
        err.response?.data?.error ||
          "Error al restablecer la contraseña. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-container">
        <h1 className="login-title">Restablecer contraseña</h1>
        <p className="login-subtitle">
          Ingresa tu nueva contraseña para continuar.
        </p>

        {mensaje ? (
          <p className="login-subtitle" style={{ color: "green" }}>
            {mensaje}
          </p>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Nueva contraseña:
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            <label>
              Confirmar contraseña:
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Restableciendo..." : "Guardar nueva contraseña"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
