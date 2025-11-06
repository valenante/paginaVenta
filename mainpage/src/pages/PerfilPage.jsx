import { useAuth } from "../context/AuthContext.jsx";
import { useState } from "react";
import api from "../utils/api";
import "../styles/PerfilPage.css";

export default function PerfilPage() {
  const { user, logout } = useAuth();
  const [nombre, setNombre] = useState(user?.name || "");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

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

      await api.put("/auth/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMensaje("✅ Perfil actualizado correctamente.");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error(err);
      setMensaje("❌ Error al actualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  console.log("Usuario en PerfilPage:", user);

  if (!user) {
    return (
      <div className="perfil-page perfil-loading">
        <p>Cargando datos del usuario...</p>
      </div>
    );
  }

  return (
    <section className="perfil-page">
      <div className="perfil-card">
        <div className="perfil-header">
          <img
            src={user.avatarUrl || "/default-avatar.png"}
            alt="Avatar"
            className="perfil-avatar"
          />
          <div>
            <h2>{user.name}</h2>
            <span className="perfil-rol">{user.role}</span>
          </div>
        </div>

        <form
          onSubmit={handleActualizar}
          className="perfil-form"
          autoComplete="off"
        >
          {/* === CAMPOS FANTASMA PARA EVITAR AUTOCOMPLETADO LOGIN === */}
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

          {/* === EMAIL (SOLO LECTURA) === */}
          <label>
            Correo electrónico:
            <input
              type="email"
              name="email"
              value={user.email || ""}
              readOnly
              className="input-disabled"
            />
          </label>

          {/* === NOMBRE === */}
          <label>
            Nombre:
            <input
              type="text"
              name="profileName"
              inputMode="text"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>

          {/* === CONTRASEÑA === */}
          <label>
            Nueva contraseña:
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
            <label>
              Confirmar nueva contraseña:
              <input
                type="password"
                name="confirmNewPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
          )}

          {/* === AVATAR === */}
          <label>
            Foto de perfil:
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files[0])}
            />
          </label>

          {mensaje && <p className="perfil-mensaje">{mensaje}</p>}

          <div className="perfil-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Guardar cambios"}
            </button>
            <button type="button" className="btn-secundario" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
