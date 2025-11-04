import { useAuth } from "../context/AuthContext.jsx";
import "../styles/PerfilPage.css";

export default function PerfilPage() {
  const { user, logout } = useAuth();

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
            src="/default-avatar.png"
            alt="Avatar del usuario"
            className="perfil-avatar"
          />
          <div>
            <h2>{user.name}</h2>
            <span className="perfil-rol">{user.role}</span>
          </div>
        </div>

        <div className="perfil-info">
          <p>
            <strong>ID de usuario:</strong> {user.id}
          </p>
          <p>
            <strong>Restaurante (tenant):</strong> {user.tenantId || "No asignado"}
          </p>
        </div>

        <div className="perfil-actions">
          <button className="btn-secundario" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </section>
  );
}
