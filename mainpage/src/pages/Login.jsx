import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { useAuth } from "../context/AuthContext";

import ErrorToast from "../components/common/ErrorToast";
import { normalizeApiError } from "../utils/normalizeApiError";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [uiError, setUiError] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resolveTenantSlug = (user) => user?.tenantSlug || user?.tenantId || null;

  const redirectByRole = ({ user, tenantSlug, isLocalhost }) => {
    if (user?.role === "superadmin") return "/superadmin";

    const baseLocal = tenantSlug
      ? `http://localhost:5173/${tenantSlug}`
      : "http://localhost:5173";
    const baseProd = tenantSlug
      ? `https://${tenantSlug}-panel.${import.meta.env.VITE_MAIN_DOMAIN}`
      : `https://panel.${import.meta.env.VITE_MAIN_DOMAIN}`;

    const base = isLocalhost ? baseLocal : baseProd;

    return `${base}/pro`;
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const doLogin = async () => {
    if (loading || cooldown > 0) return;

    setLoading(true);
    setUiError(null);

    try {
      const user = await login(form);

      if (user?.role === "superadmin") {
        navigate("/superadmin", { replace: true });
        return;
      }

      const tenantSlug = resolveTenantSlug(user);
      if (!tenantSlug) {
        setUiError({
          code: "TENANT_REQUIRED",
          message: "No se encontró el restaurante asignado.",
          requestId: "—",
          action: "CONTACT_SUPPORT",
          kind: "client",
          canRetry: false,
        });
        return;
      }

      const isLocalhost = window.location.hostname === "localhost";
      const targetUrl = redirectByRole({ user, tenantSlug, isLocalhost });

      if (isLocalhost) {
        navigate(`/${tenantSlug}/pro`, { replace: true });
        return;
      }

      window.location.href = targetUrl;
    } catch (err) {
      const normalized = normalizeApiError(err);
      setUiError(normalized);

      if (normalized?.kind === "rate_limit" && normalized?.retryAfter) {
        setCooldown(Number(normalized.retryAfter) || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin();
  };

  const canRetry = !!uiError?.canRetry && cooldown === 0 && !loading;

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

            {uiError && (
              <ErrorToast
                error={{ ...uiError, retryAfter: cooldown > 0 ? cooldown : uiError.retryAfter }}
                onRetry={canRetry ? doLogin : null}
                onClose={() => setUiError(null)}
                autoHideMs={0}
                showSupport={uiError?.action === "CONTACT_SUPPORT"}
              />
            )}

            <button
              type="submit"
              className="btn btn-primario"
              disabled={loading || cooldown > 0}
              title={cooldown > 0 ? `Espera ${cooldown}s` : ""}
            >
              {loading
                ? "Iniciando sesión..."
                : cooldown > 0
                  ? `Espera ${cooldown}s`
                  : "Entrar"}
            </button>

            <button
              type="button"
              className="login-forgot"
              onClick={() => navigate("/forgot-password")}
              disabled={loading}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>

          <p className="login-footer">
            ¿No tienes cuenta?{" "}
            <a href="/registro" className="login-link">
              Regístrate aquí
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}