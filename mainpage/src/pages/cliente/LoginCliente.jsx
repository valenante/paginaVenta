import React, { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import ClienteLayout from "./ClienteLayout";
import "./cliente.css";

export default function LoginCliente() {
  const { login, isAuthenticated, loading } = useClienteAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  if (!loading && isAuthenticated) return <Navigate to="/cliente/perfil" replace />;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form);
      navigate("/cliente/perfil");
    } catch (err) {
      setError(err?.response?.data?.message || "Email o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ClienteLayout>
      <main className="cli-login-page">
        <div className="cli-login-shell">
          <section className="cli-login-info">
            <span className="cli-login-kicker">Alef Club</span>
            <h1 className="cli-login-hero-title">
              Tu programa de fidelidad <span>en cada visita</span>
            </h1>
            <p className="cli-login-hero-subtitle">
              Una sola cuenta para todos los restaurantes Alef. Acumula puntos al
              cobrar tu mesa y canjea recompensas cuando tú quieras.
            </p>
            <ul className="cli-login-bullets">
              <li>Puntos automáticos al cerrar cada mesa.</li>
              <li>Canjea descuentos, productos gratis y más.</li>
              <li>Tu saldo te acompaña en cada restaurante Alef.</li>
            </ul>
          </section>

          <section className="cli-login-card">
            <h2 className="cli-login-title">Iniciar sesión en Alef Club</h2>
            <p className="cli-login-subtitle">
              Bienvenido de nuevo. Continúa donde lo dejaste.
            </p>

            <form className="cli-login-form" onSubmit={onSubmit}>
              <div className="cli-login-field">
                <label htmlFor="cli-login-email">Correo electrónico</label>
                <input
                  id="cli-login-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  autoComplete="email"
                  inputMode="email"
                  required
                  autoFocus
                />
              </div>

              <div className="cli-login-field cli-login-field-password">
                <label htmlFor="cli-login-password">Contraseña</label>
                <div className="cli-login-password-wrapper">
                  <input
                    id="cli-login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={onChange}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="cli-login-toggle-password"
                    onClick={() => setShowPassword((p) => !p)}
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              {error && <div className="cli-login-error" role="alert">{error}</div>}

              <button
                type="submit"
                className="cli-login-btn"
                disabled={submitting}
              >
                {submitting ? "Entrando…" : "Entrar"}
              </button>

              <Link to="/cliente/recuperar" className="cli-login-forgot">
                ¿Olvidaste tu contraseña?
              </Link>
            </form>

            <p className="cli-login-footer-cta">
              ¿No tienes cuenta?{" "}
              <Link to="/cliente/registro" className="cli-login-link">
                Crea una en 30 segundos
              </Link>
            </p>
          </section>
        </div>
      </main>
    </ClienteLayout>
  );
}
