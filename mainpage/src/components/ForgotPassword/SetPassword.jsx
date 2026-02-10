// src/components/ForgotPassword/SetPassword.jsx
import { useMemo, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import api from "../../utils/api";
import "../../styles/Login.css";
import "../../styles/SetPassword.css";

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
  const code = data?.error || data?.code;

  if (code === "TOKEN_EXPIRED") return "El enlace expiró. Solicita uno nuevo.";
  if (code === "TOKEN_INVALID") return "El enlace no es válido. Solicita uno nuevo.";
  if (code === "TENANT_NOT_FOUND") return "Tenant no encontrado.";
  if (code === "PASSWORD_WEAK") return "La contraseña no cumple requisitos mínimos.";
  if (data?.message) return data.message;

  return err?.message || "No se pudo crear la contraseña.";
}

export default function SetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ soporte legacy: /set-password/:tenantId/:token
  const { tenantId: tenantIdParam, token: tokenParam } = useParams();

  // ✅ soporte actual: /set-password?token=...
  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tokenQuery = qs.get("token") || "";
  const tenantIdQuery = qs.get("tenantId") || ""; // opcional, por si algún día lo mandas

  const tenantId = tenantIdParam || tenantIdQuery || "";
  const token = tokenParam || tokenQuery || "";

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const flags = useMemo(() => validarPassword(password), [password]);
  const score = useMemo(() => scorePassword(flags), [flags]);
  const scoreMeta = useMemo(() => labelScore(score), [score]);

  // ✅ ahora SOLO exige token (tenantId es opcional)
  const canSubmit = useMemo(() => {
    const allReq = flags.len && flags.upper && flags.lower && flags.num && flags.sym;
    const match = password.length > 0 && password === password2;
    return !!token && allReq && match && !loading;
  }, [token, flags, password, password2, loading]);

  const mismatch = password2.length > 0 && password !== password2;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setOk(false);

    if (!token) {
      setError("Link inválido (falta token).");
      return;
    }
    if (!canSubmit) return;

    setLoading(true);
    try {
      // ✅ SOLO setup
      if (tenantId) {
        // legacy: con tenantId en path
        await api.post(
          `/auth/password-setup/${encodeURIComponent(tenantId)}/${encodeURIComponent(token)}`,
          { password }
        );
      } else {
        // actual: token-only (query)
        await api.post(`/auth/password-setup`, { token, password });
      }

      setOk(true);
      setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (err) {
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page reset-page">
      <div className="login-shell reset-shell">
        <aside className="login-info reset-info">
          <span className="login-kicker">Alef · Seguridad</span>
          <h1 className="login-hero-title">Crea tu contraseña</h1>
          <p className="login-hero-subtitle">
            Estás a un paso de entrar al sistema. Usa una contraseña robusta para proteger tu cuenta.
          </p>

          <ul className="login-bullets">
            <li>Mínimo 10 caracteres</li>
            <li>Incluye mayúsculas y minúsculas</li>
            <li>Incluye números y un símbolo</li>
            <li>El enlace caduca</li>
          </ul>
        </aside>

        <section className="login-card reset-card">
          <h2 className="login-title">Establecer contraseña</h2>
          <p className="login-subtitle">Introduce una contraseña nueva y confírmala.</p>

          <form className="login-form" onSubmit={submit}>
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
            {ok && <p className="reset-success">✅ Contraseña creada. Redirigiendo al login…</p>}

            <button className="login-btn reset-btn" type="submit" disabled={!canSubmit}>
              {loading ? "Guardando…" : "Guardar contraseña"}
            </button>

            <div className="login-footer reset-footer">
              ¿Ya tienes contraseña?{" "}
              <Link to="/login" className="login-link">
                Ir al login
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
