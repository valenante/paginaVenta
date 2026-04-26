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
    <ClienteLayout narrow>
      <div className="cliente-auth-grid cliente-auth-grid--login">
        <aside className="cliente-auth-hero">
          <h2>Tu cuenta <span>ALEF</span></h2>
          <p>
            Consulta tus puntos, restaurantes vinculados y recompensas disponibles
            desde una única cuenta.
          </p>
          <div className="cliente-auth-hero__stat">
            <strong>+30 restaurantes</strong>
            <span>Crece cada mes con nuevos locales que aceptan ALEF</span>
          </div>
        </aside>

        <div className="cliente-auth-card">
          <header className="cliente-auth-card__header">
            <h1>Iniciar sesión</h1>
            <p>Bienvenido de nuevo.</p>
          </header>

          <form onSubmit={onSubmit} className="cliente-auth-form">
            <div className="cliente-field">
              <label>Email</label>
              <input
                name="email" type="email" required
                autoComplete="email" inputMode="email"
                value={form.email}
                onChange={onChange}
                placeholder="tu@email.com"
                autoFocus
              />
            </div>

            <div className="cliente-field">
              <label>
                Contraseña
                <Link to="/cliente/recuperar" className="cliente-field__link">
                  ¿La olvidaste?
                </Link>
              </label>
              <input
                name="password" type="password" required
                autoComplete="current-password"
                value={form.password}
                onChange={onChange}
              />
            </div>

            {error && <div className="cliente-alert cliente-alert--error">{error}</div>}

            <button type="submit" className="cliente-btn cliente-btn--primary" disabled={submitting}>
              {submitting ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="cliente-auth-card__alt">
            ¿No tienes cuenta? <Link to="/cliente/registro">Crea una en 30 segundos</Link>
          </p>
        </div>
      </div>
    </ClienteLayout>
  );
}
