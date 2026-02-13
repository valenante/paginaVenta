// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const redirectByRole = ({ user, tenantSlug, isLocalhost }) => {
    const baseLocal = `http://localhost:5173/${tenantSlug}`;
    const baseProd = `https://${tenantSlug}-panel.${import.meta.env.VITE_MAIN_DOMAIN}`;
    const base = isLocalhost ? baseLocal : baseProd;

    switch (user.role) {
      case "superadmin":
        return "/superadmin";

      case "admin":
      case "admin_restaurante":
      case "admin_shop":
      case "vendedor":
        return `${base}/pro`;

      case "camarero":
        return `${base}/camarero`;

      case "cocinero":
        return `${base}/cocinero`;

      default:
        return `${base}/pro`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(form);

      // SUPERADMIN
      if (user.role === "superadmin") {
        return navigate("/superadmin");
      }

      const tenantSlug = user.tenantId;
      if (!tenantSlug) {
        setError("No se encontró el restaurante asignado.");
        return;
      }

      const isLocalhost = window.location.hostname === "localhost";
      const targetUrl = redirectByRole({ user, tenantSlug, isLocalhost });

      if (targetUrl.startsWith("/")) navigate(targetUrl);
      else window.location.href = targetUrl;

    } catch (err) {
      const backendMsg = err.response?.data?.error;
      setError(
        backendMsg ||
          "Error al iniciar sesión. Revisa tus credenciales e intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-info">
          <span className="login-kicker">Panel Alef</span>
          <h1 className="login-hero-title">Accede al corazón digital de tu restaurante</h1>
          <p className="login-hero-subtitle">
            Desde aquí gestionas tus locales, planes, usuarios y todo lo que ocurre en tu TPV Alef.
          </p>
          <ul className="login-bullets">
            <li>Gestiona restaurantes y usuarios.</li>
            <li>Configura carta, reservas y flujos.</li>
            <li>Accede rápido al TPV y carta online.</li>
          </ul>
        </section>

        <section className="login-card card">
          <h2 className="login-title">Iniciar sesión en Alef</h2>
          <p className="login-subtitle">
            Usa las credenciales que recibiste al dar de alta tu restaurante o tu usuario.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="login-field login-field-password">
              <label htmlFor="login-password">Contraseña</label>

              <div className="login-password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="btn btn-primario " disabled={loading}>
              {loading ? "Iniciando sesión..." : "Entrar"}
            </button>

            <button type="button" className="login-forgot" onClick={() => navigate("/forgot-password")}>
              ¿Olvidaste tu contraseña?
            </button>
          </form>

          <p className="login-footer">
            ¿No tienes cuenta? <a href="/registro" className="login-link">Regístrate aquí</a>
          </p>
        </section>
      </div>
    </main>
  );
}
