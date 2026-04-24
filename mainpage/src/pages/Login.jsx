import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { useAuth } from "../context/AuthContext";

import ErrorToast from "../components/common/ErrorToast";
import { normalizeApiError } from "../utils/normalizeApiError";

export default function Login() {
  const navigate = useNavigate();
  const { login, verifyMfa } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [uiError, setUiError] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [blockedMsg, setBlockedMsg] = useState(null);

  // MFA state
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaUserId, setMfaUserId] = useState(null);
  const [mfaEmail, setMfaEmail] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("tenantBlockedMsg");
      if (raw) {
        setBlockedMsg(JSON.parse(raw));
        sessionStorage.removeItem("tenantBlockedMsg");
      }
    } catch {}
  }, []);

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

  const handleLoginSuccess = (user) => {
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
  };

  const doLogin = async () => {
    if (loading || cooldown > 0) return;

    setLoading(true);
    setUiError(null);

    try {
      const result = await login(form);

      // MFA required — show code input
      if (result?.mfaRequired) {
        setMfaStep(true);
        setMfaUserId(result.mfaUserId);
        setMfaEmail(result.mfaEmail);
        return;
      }

      handleLoginSuccess(result);
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

  const doVerifyMfa = async () => {
    if (loading || !mfaCode.trim()) return;

    setLoading(true);
    setUiError(null);

    try {
      const user = await verifyMfa({ userId: mfaUserId, code: mfaCode.trim() });
      handleLoginSuccess(user);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setUiError(normalized);
      setMfaCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mfaStep) {
      doVerifyMfa();
    } else {
      doLogin();
    }
  };

  const canRetry = !!uiError?.canRetry && cooldown === 0 && !loading;

  // MFA step UI
  if (mfaStep) {
    return (
      <main className="login-page">
        <div className="login-shell">
          <section className="login-info">
            <span className="login-kicker">Panel Alef</span>
            <h1 className="login-hero-title">Verificación de seguridad</h1>
            <p className="login-hero-subtitle">
              Hemos enviado un código de verificación a tu email para proteger tu cuenta de administrador.
            </p>
          </section>

          <section className="login-card card">
            <h2 className="login-title">Introduce el código</h2>
            <p className="login-subtitle">
              Enviado a <strong>{mfaEmail}</strong>. Expira en 5 minutos.
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="mfa-code">Código de verificación</label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  className="login-mfa-input"
                />
              </div>

              {uiError && (
                <ErrorToast
                  error={uiError}
                  onRetry={canRetry ? doVerifyMfa : null}
                  onClose={() => setUiError(null)}
                  autoHideMs={0}
                />
              )}

              <button
                type="submit"
                className="btn btn-primario"
                disabled={loading || mfaCode.length < 6}
              >
                {loading ? "Verificando..." : "Verificar"}
              </button>

              <button
                type="button"
                className="login-forgot"
                onClick={() => {
                  setMfaStep(false);
                  setMfaCode("");
                  setMfaUserId(null);
                  setUiError(null);
                }}
              >
                Volver al login
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  // Normal login UI
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

            {blockedMsg && (
              <div className="login-blocked-banner" role="alert">
                <strong>{blockedMsg.title}</strong>
                <p>{blockedMsg.message}</p>
              </div>
            )}

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
