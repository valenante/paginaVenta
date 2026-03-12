import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje";
import { toImgSrc } from "../utils/media";
import { normalizeApiError } from "../utils/normalizeApiError.js";
import ErrorToast from "../components/common/ErrorToast";
import LoadingScreen from "../components/LoadingScreen/LoadingScreen";
import "../styles/PerfilPage.css";

export default function PerfilPage() {
  const { user, logout, setUser } = useAuth();
  const [nombre, setNombre] = useState(user?.name || "");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  useEffect(() => {
    document.title = "Mi perfil | Alef";
  }, []);

  const doUpdate = async () => {
    setAlerta(null);
    setErrorState(null);

    if (nuevaPassword && nuevaPassword !== confirmPassword) {
      setAlerta({ tipo: "error", mensaje: "Las contraseñas no coinciden." });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", nombre);
      if (nuevaPassword) formData.append("nuevaPassword", nuevaPassword);
      if (avatar) formData.append("avatar", avatar);

      const { data } = await api.put("/auth/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data?.user) setUser(data.user);

      setAlerta({
        tipo: "exito",
        mensaje: "Perfil actualizado correctamente.",
      });

    } catch (err) {
      const e = normalizeApiError(err);

      if (e.action === "REAUTH") {
        await logout();
        return;
      }

      setErrorState(e);
    } finally {
      setLoading(false);
    }
  };

  const handleActualizar = async (e) => {
    e.preventDefault();
    await doUpdate();
  };

  if (!user) return <LoadingScreen />;

  return (
    <main className="perfil-config-page section section--wide">
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
          autoCerrar
          duracion={3000}
        />
      )}

      {errorState && (
        <ErrorToast
          error={errorState}
          onRetry={errorState.canRetry ? doUpdate : null}
          onClose={() => setErrorState(null)}
        />
      )}

      <header className="perfil-config-header">
        <div>
          <h1>👤 Mi perfil</h1>
          <p className="text-suave">
            Actualiza tu información personal, cambia tu contraseña y gestiona tu
            avatar desde una vista Alef limpia y profesional.
          </p>
        </div>

        <div className="perfil-config-header-status">
          <span className="badge badge-aviso">{user.role}</span>
        </div>
      </header>

      <div className="perfil-config-layout">
        <div className="perfil-config-main">
          {/* RESUMEN */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Resumen de usuario</h2>
                <p className="config-card-subtitle">
                  Información principal de tu cuenta dentro del sistema.
                </p>
              </div>
            </div>

            <div className="perfil-summary">
              <div className="perfil-summary-left">
                <img
                  src={toImgSrc(user.avatarUrl, { fallback: "/default-avatar.png" })}
                  alt="Avatar"
                  className="perfil-avatar"
                />

                <div className="perfil-summary-info">
                  <h3>{user.name}</h3>
                  <p className="perfil-summary-email">{user.email}</p>
                  <div className="perfil-summary-meta">
                    <span className="badge badge-aviso">{user.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FORMULARIO */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Datos de la cuenta</h2>
                <p className="config-card-subtitle">
                  Modifica tu nombre, contraseña y foto de perfil.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleActualizar}
              className="perfil-form"
              autoComplete="off"
            >
              <input
                type="text"
                name="fakeusernameremembered"
                style={{ display: "none" }}
                autoComplete="off"
              />
              <input
                type="password"
                name="fakepasswordremembered"
                style={{ display: "none" }}
                autoComplete="new-password"
              />

              <div className="perfil-form-grid">
                <label className="config-field">
                  <span>Correo electrónico</span>
                  <input
                    type="email"
                    name="email"
                    value={user.email || ""}
                    readOnly
                    className="input-disabled"
                  />
                </label>

                <label className="config-field">
                  <span>Nombre</span>
                  <input
                    type="text"
                    name="profileName"
                    inputMode="text"
                    autoComplete="name"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </label>

                <label className="config-field">
                  <span>Nueva contraseña</span>
                  <input
                    type="password"
                    name="newPassword"
                    autoComplete="new-password"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder="Dejar vacío para mantener la actual"
                  />
                </label>

                {nuevaPassword && (
                  <label className="config-field">
                    <span>Confirmar nueva contraseña</span>
                    <input
                      type="password"
                      name="confirmNewPassword"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </label>
                )}

                <label className="config-field perfil-form-grid-full">
                  <span>Foto de perfil</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatar(e.target.files[0])}
                  />
                  <small className="perfil-help">
                    PNG o JPG. Se recomienda formato cuadrado.
                  </small>
                </label>
              </div>

              <div className="perfil-actions">
                <button
                  type="submit"
                  className="btn btn-primario"
                  disabled={loading}
                >
                  {loading ? "Actualizando..." : "Guardar cambios"}
                </button>

                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={logout}
                >
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
