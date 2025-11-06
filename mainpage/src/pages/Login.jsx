import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ✅ Enviar login al backend
      const res = await api.post("/auth/login", form);
      const { user } = res.data;

      console.log("✅ Usuario autenticado:", user);

      // 🔹 Guardar sesión temporal
      sessionStorage.setItem("user", JSON.stringify(user));

      // 🧭 Redirección según rol
      if (user.role === "superadmin") {
        navigate("/superadmin");
      } else if (user.role === "admin_restaurante") {
        // 🚀 Redirige al TPV del restaurante
        const tenantId = user.tenantId || "default";
        const tpvUrl = `http://localhost:5173/${tenantId}`;
        window.location.href = tpvUrl;
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("❌ Error de inicio de sesión:", err);
      setError(
        err.response?.data?.error ||
          "Error al iniciar sesión. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <main className="login-page">
      <div className="login-container">
        <h1 className="login-title">Iniciar sesión en Alef</h1>
        <p className="login-subtitle">
          Accede a tu panel o al entorno de tu restaurante.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Usuario:
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Tu nombre de usuario"
              required
            />
          </label>

          <label>
            Contraseña:
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Entrar"}
          </button>

          {/* 🔹 Nueva opción: recuperar contraseña */}
          <p
            className="login-forgot"
            onClick={handleForgotPassword}
            style={{ cursor: "pointer", color: "var(--color-secundario)" }}
          >
            ¿Olvidaste tu contraseña?
          </p>
        </form>

        <p className="login-footer">
          ¿No tienes cuenta?{" "}
          <a href="/registro" className="login-link">
            Regístrate aquí
          </a>
        </p>
      </div>
    </main>
  );
}
