// src/pages/SetPassword.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/SetPassword.css";

function getTokenFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
}

function validatePassword(pw) {
  const p = String(pw || "");
  if (p.length < 10) return "La contraseña debe tener al menos 10 caracteres.";
  return null;
}

export default function SetPassword() {
  const navigate = useNavigate();

  const token = useMemo(() => getTokenFromQuery(), []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk(false);

    if (!token) {
      setError("Falta el token en el enlace. Revisa el email y vuelve a abrir el botón.");
      return;
    }

    const errPw = validatePassword(password);
    if (errPw) return setError(errPw);

    if (password !== confirm) {
      return setError("Las contraseñas no coinciden.");
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/set-password", { token, password });

      setOk(true);

      const panelUrl = data?.panelUrl;
      if (panelUrl) {
        window.location.assign(panelUrl);
        return;
      }

      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors[0]?.msg : null) ||
        "No se pudo establecer la contraseña. El enlace puede haber caducado.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="setpw-page">
      <div className="setpw-shell">
        <div className="setpw-card">
          <header className="setpw-header">
            <p className="setpw-kicker">Acceso al panel</p>
            <h1 className="setpw-title">Crear contraseña</h1>
            <p className="setpw-sub">
              Define la contraseña del usuario administrador para acceder a tu panel.
            </p>
          </header>

          {!token && (
            <div className="setpw-alert setpw-alert--warn">
              Este enlace no tiene token. Abre el botón del email de bienvenida.
            </div>
          )}

          <form className="setpw-form" onSubmit={onSubmit}>
            <label className="setpw-label">
              Nueva contraseña
              <input
                className="setpw-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 10 caracteres"
                autoComplete="new-password"
                disabled={loading}
                required
              />
            </label>

            <label className="setpw-label">
              Repetir contraseña
              <input
                className="setpw-input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                disabled={loading}
                required
              />
            </label>

            {error && <div className="setpw-alert setpw-alert--error">{error}</div>}
            {ok && (
              <div className="setpw-alert setpw-alert--ok">
                ✅ Contraseña creada. Entrando al panel...
              </div>
            )}

            <button className="setpw-btn" type="submit" disabled={loading || !token}>
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>

          <p className="setpw-foot">
            Si el enlace caducó, solicita uno nuevo desde soporte.
          </p>
        </div>
      </div>
    </main>
  );
}
