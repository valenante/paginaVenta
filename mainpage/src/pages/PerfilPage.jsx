import { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje";
import { toImgSrc } from "../utils/media";
import { normalizeApiError } from "../utils/normalizeApiError.js";
import ErrorToast from "../components/common/ErrorToast";
import LoadingScreen from "../components/LoadingScreen/LoadingScreen";
import "../styles/PerfilPage.css";

function PasswordStrength({ password }) {
  const strength = useMemo(() => {
    if (!password) return null;
    let score = 0;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  if (!password) return null;

  const level = strength <= 2 ? "weak" : strength <= 4 ? "medium" : "strong";
  const label = strength <= 2 ? "Débil" : strength <= 4 ? "Media" : "Fuerte";
  const pct = Math.round((strength / 5) * 100);

  return (
    <div className="perfil-strength">
      <div className="perfil-strength__bar">
        <div className={`perfil-strength__fill perfil-strength--${level}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`perfil-strength__label perfil-strength--${level}`}>{label}</span>
      {strength < 5 && (
        <small className="perfil-strength__hint">
          Min. 10 caracteres, mayúscula, minúscula, número y carácter especial.
        </small>
      )}
    </div>
  );
}

export default function PerfilPage() {
  const { user, logout, setUser } = useAuth();
  const [nombre, setNombre] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { document.title = "Mi perfil | Alef"; }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAlerta({ tipo: "error", mensaje: "La imagen no puede superar 2MB." });
      return;
    }
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const doUpdate = async () => {
    setAlerta(null);
    setErrorState(null);

    if (nuevaPassword && !currentPassword) {
      setAlerta({ tipo: "error", mensaje: "Introduce tu contraseña actual para cambiarla." });
      return;
    }
    if (nuevaPassword && nuevaPassword !== confirmPassword) {
      setAlerta({ tipo: "error", mensaje: "Las contraseñas no coinciden." });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", nombre);
      if (currentPassword) formData.append("currentPassword", currentPassword);
      if (nuevaPassword) formData.append("nuevaPassword", nuevaPassword);
      if (avatar) formData.append("avatar", avatar);

      const { data } = await api.put("/auth/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data?.user) setUser(data.user);
      setAlerta({ tipo: "exito", mensaje: "Perfil actualizado correctamente." });
      setCurrentPassword("");
      setNuevaPassword("");
      setConfirmPassword("");
    } catch (err) {
      const e = normalizeApiError(err);
      if (e.action === "REAUTH") { await logout(); return; }
      setErrorState(e);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <LoadingScreen />;

  const avatarSrc = avatarPreview || toImgSrc(user.avatarUrl, { fallback: "" });

  return (
    <main className="perfil-config-page cfg-page section section--wide">
      {alerta && (
        <AlertaMensaje tipo={alerta.tipo} mensaje={alerta.mensaje} onClose={() => setAlerta(null)} autoCerrar duracion={3000} />
      )}
      {errorState && (
        <ErrorToast error={errorState} onRetry={errorState.canRetry ? doUpdate : null} onClose={() => setErrorState(null)} />
      )}

      <header className="perfil-config-header cfg-header">
        <div>
          <h1>Mi perfil</h1>
          <p className="text-suave">Actualiza tu información personal, contraseña y avatar.</p>
        </div>
        <span className="badge badge-aviso">{user.role}</span>
      </header>

      <div className="perfil-config-layout cfg-layout">
        <div className="perfil-config-main cfg-main">
          {/* RESUMEN */}
          <section className="card config-card">
            <div className="config-card-header">
              <h2>Resumen</h2>
            </div>
            <div className="perfil-summary">
              <div className="perfil-avatar-wrap">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="perfil-avatar" />
                ) : (
                  <div className="perfil-avatar perfil-avatar--placeholder">
                    {(user.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="perfil-summary-info">
                <h3>{user.name}</h3>
                <p className="perfil-summary-email">{user.email}</p>
                <span className="badge badge-aviso">{user.role}</span>
              </div>
            </div>
          </section>

          {/* FORMULARIO */}
          <section className="card config-card">
            <div className="config-card-header">
              <h2>Datos de la cuenta</h2>
              <p className="config-card-subtitle">Modifica tu nombre, contraseña y foto de perfil.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); doUpdate(); }} className="perfil-form" autoComplete="off">
              <div className="perfil-form-grid">
                <label className="config-field">
                  <span>Correo electrónico</span>
                  <input type="email" value={user.email || ""} readOnly className="input-disabled" />
                </label>

                <label className="config-field">
                  <span>Nombre</span>
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
                </label>

                <label className="config-field">
                  <span>Nueva contraseña</span>
                  <input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} placeholder="Dejar vacío para mantener la actual" autoComplete="new-password" />
                  <PasswordStrength password={nuevaPassword} />
                </label>

                {nuevaPassword && (
                  <>
                    <label className="config-field">
                      <span>Contraseña actual</span>
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Requerida para cambiar" autoComplete="current-password" />
                    </label>
                    <label className="config-field">
                      <span>Confirmar nueva contraseña</span>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                    </label>
                  </>
                )}

                <div className="config-field perfil-form-grid-full">
                  <span>Foto de perfil</span>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} hidden />
                  <button type="button" className="perfil-avatar-btn" onClick={() => fileRef.current?.click()}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="perfil-avatar-btn__preview" />
                    ) : (
                      <span className="perfil-avatar-btn__icon">📷</span>
                    )}
                    <span>{avatar ? avatar.name : "Cambiar foto"}</span>
                  </button>
                  <small className="perfil-help">PNG, JPG o WebP. Máx 2MB. Formato cuadrado recomendado.</small>
                </div>
              </div>

              <div className="perfil-actions cfg-actions">
                <button type="submit" className="btn btn-primario" disabled={loading}>
                  {loading ? "Actualizando..." : "Guardar cambios"}
                </button>
                <button type="button" className="btn btn-secundario" onClick={logout}>
                  Cerrar sesión
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
