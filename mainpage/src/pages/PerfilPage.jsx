import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api";
import "../styles/PerfilPage.css";

export default function PerfilPage() {
  const { user, logout, setUser } = useAuth();
  const [nombre, setNombre] = useState(user?.name || "");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Mi perfil | Alef";
  }, []);

  const handleActualizar = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (nuevaPassword && nuevaPassword !== confirmPassword) {
      setMensaje("❌ Las contraseñas no coinciden.");
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

      if (data?.user) {
        setUser(data.user);
      }

      setMensaje("✅ Perfil actualizado correctamente.");
    } catch (err) {
      console.error(err);
      setMensaje("❌ Error al actualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="perfil-page section section--wide perfil-loading">
        <p className="text-suave">Cargando datos del usuario...</p>
      </main>
    );
  }

  const esError = mensaje.startsWith("❌");
  const esOk = mensaje.startsWith("✅");

  return (
    <main className="perfil-page section section--wide">
      <section className="perfil-card card">
        <header className="perfil-header">
          <div className="perfil-header-left">
            <img
              src={user.avatarUrl || "/default-avatar.png"}
              alt="Avatar"
              className="perfil-avatar"
            />
            <div className="perfil-header-info">
              <h1>{user.name}</h1>
              <div className="perfil-header-meta">
                <span className="perfil-rol badge badge-aviso">
                  {user.role}
                </span>
                <span className="perfil-email">{user.email}</span>
              </div>
            </div>
          </div>
        </header>

        <form
          onSubmit={handleActualizar}
          className="perfil-form"
          autoComplete="off"
        >
          {/* Campos fantasma para evitar autocompletado de login */}
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

          {/* Email (solo lectura) */}
          <label className="perfil-field">
            <span className="perfil-label">Correo electrónico</span>
            <input
              type="email"
              name="email"
              value={user.email || ""}
              readOnly
              className="input-disabled"
            />
          </label>

          {/* Nombre */}
          <label className="perfil-field">
            <span className="perfil-label">Nombre</span>
            <input
              type="text"
              name="profileName"
              inputMode="text"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>

          {/* Contraseña nueva */}
          <label className="perfil-field">
            <span className="perfil-label">Nueva contraseña</span>
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
            <label className="perfil-field">
              <span className="perfil-label">Confirmar nueva contraseña</span>
              <input
                type="password"
                name="confirmNewPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
          )}

          {/* Avatar */}
          <label className="perfil-field">
            <span className="perfil-label">Foto de perfil</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files[0])}
            />
            <span className="perfil-help">
              PNG o JPG. Se recomienda formato cuadrado.
            </span>
          </label>

          {mensaje && (
            <p
              className={[
                "perfil-mensaje",
                esError && "perfil-mensaje--error",
                esOk && "perfil-mensaje--ok",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {mensaje}
            </p>
          )}

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
    </main>
  );
}
