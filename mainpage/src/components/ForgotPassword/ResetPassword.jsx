import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../utils/api";
import "../../styles/Login.css";
import "./SetPassword.css";

function validarPassword(pw) {
  const v = String(pw || "");
  return {
    len: v.length >= 10,
    upper: /[A-Z]/.test(v),
    lower: /[a-z]/.test(v),
    num: /[0-9]/.test(v),
    sym: /[^A-Za-z0-9]/.test(v),
  };
}

function scorePassword(flags) {
  return Object.values(flags).filter(Boolean).length;
}

function labelScore(score) {
  if (score <= 1) return { text: "Muy débil", tone: "bad" };
  if (score === 2) return { text: "Débil", tone: "bad" };
  if (score === 3) return { text: "Aceptable", tone: "ok" };
  if (score === 4) return { text: "Fuerte", tone: "good" };
  return { text: "Muy fuerte", tone: "good" };
}

function mapError(err) {
  const data = err?.response?.data;
  const code = data?.code || data?.error;

  if (code === "TOKEN_EXPIRADO") return { msg: "El enlace ha expirado.", expired: true };
  if (code === "TOKEN_INVALIDO") return { msg: "El enlace no es válido o ya fue utilizado.", expired: true };
  if (code === "PASSWORD_WEAK") return { msg: "La contraseña no cumple los requisitos mínimos.", expired: false };
  if (code === "VALIDATION_ERROR") {
    const fields = data?.action === "FIX_INPUT" ? data?.fields : null;
    const detail = fields ? Object.values(fields).join(". ") : "";
    return { msg: detail || data?.message || "Datos inválidos.", expired: false };
  }
  if (data?.message) return { msg: data.message, expired: false };

  return { msg: "No se pudo restablecer la contraseña. Intenta nuevamente.", expired: false };
}

export default function ResetPassword() {
  const { tenantId, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenExpired, setTokenExpired] = useState(false);
  const [ok, setOk] = useState(false);

  const flags = useMemo(() => validarPassword(password), [password]);
  const score = useMemo(() => scorePassword(flags), [flags]);
  const scoreMeta = useMemo(() => labelScore(score), [score]);

  const canSubmit = useMemo(() => {
    const allReq = flags.len && flags.upper && flags.lower && flags.num && flags.sym;
    const match = password.length > 0 && password === password2;
    return !!token && !!tenantId && allReq && match && !loading;
  }, [token, tenantId, flags, password, password2, loading]);

  const mismatch = password2.length > 0 && password !== password2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      await api.post(`/password/reset-password/${tenantId}/${token}`, { password });
      setOk(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      const parsed = mapError(err);
      setError(parsed.msg);
      if (parsed.expired) setTokenExpired(true);
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de token expirado / inválido
  if (tokenExpired) {
    return (
      <div className="login-page reset-page">
        <div className="login-shell reset-shell">
          <section className="login-card reset-card" style={{ textAlign: "center" }}>
            <h2 className="login-title">Enlace no válido</h2>
            <p className="login-subtitle">{error}</p>
            <p className="login-subtitle" style={{ marginTop: "0.5rem" }}>
              Solicita un nuevo enlace de recuperación.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
              <Link to="/forgot-password" className="btn btn-primario" style={{ textDecoration: "none", textAlign: "center" }}>
                Solicitar nuevo enlace
              </Link>
              <Link to="/login" className="login-link">
                Volver al login
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Pantalla de éxito
  if (ok) {
    return (
      <div className="login-page reset-page">
        <div className="login-shell reset-shell">
          <section className="login-card reset-card" style={{ textAlign: "center" }}>
            <h2 className="login-title">Contraseña restablecida</h2>
            <p className="reset-success">Tu contraseña se ha actualizado correctamente. Todas las sesiones anteriores han sido cerradas.</p>
            <p className="login-subtitle" style={{ marginTop: "0.75rem" }}>
              Redirigiendo al login...
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page reset-page">
      <div className="login-shell reset-shell">
        <aside className="login-info reset-info">
          <span className="login-kicker">Alef · Seguridad</span>
          <h1 className="login-hero-title">Restablecer contraseña</h1>
          <p className="login-hero-subtitle">
            Introduce una nueva contraseña segura para proteger tu cuenta.
          </p>

          <ul className="login-bullets">
            <li>Mínimo 10 caracteres</li>
            <li>Incluye mayúsculas y minúsculas</li>
            <li>Incluye números y un símbolo</li>
            <li>Se cerrarán todas las sesiones activas</li>
          </ul>
        </aside>

        <section className="login-card reset-card">
          <h2 className="login-title">Nueva contraseña</h2>
          <p className="login-subtitle">Introduce y confirma tu nueva contraseña.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field login-field-password">
              <label>Nueva contraseña</label>
              <div className="login-password-wrapper">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 10 caracteres"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            {password.length > 0 && (
              <div className="reset-strength">
                <div className={`reset-strength-badge tone-${scoreMeta.tone}`}>
                  Fortaleza: <strong>{scoreMeta.text}</strong>
                </div>
                <div className="reset-reqs">
                  <span className={flags.len ? "ok" : ""}>10+ chars</span>
                  <span className={flags.upper ? "ok" : ""}>A-Z</span>
                  <span className={flags.lower ? "ok" : ""}>a-z</span>
                  <span className={flags.num ? "ok" : ""}>0-9</span>
                  <span className={flags.sym ? "ok" : ""}>#@!</span>
                </div>
              </div>
            )}

            <div className="login-field login-field-password">
              <label>Confirmar contraseña</label>
              <div className="login-password-wrapper">
                <input
                  type={showPw2 ? "text" : "password"}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPw2((v) => !v)}
                >
                  {showPw2 ? "Ocultar" : "Ver"}
                </button>
              </div>
              {mismatch && <p className="login-error">Las contraseñas no coinciden.</p>}
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="btn btn-primario" type="submit" disabled={!canSubmit}>
              {loading ? "Restableciendo..." : "Guardar nueva contraseña"}
            </button>

            <div className="login-footer reset-footer">
              <Link to="/login" className="login-link">
                Volver al login
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
