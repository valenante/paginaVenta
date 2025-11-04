import { useEffect } from "react";
import { useConfig } from "../context/ConfigContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";
import "../styles/DashboardPage.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const { config, loading } = useConfig();

  useEffect(() => {
    document.title = `${config?.branding?.nombreRestaurante || "Restaurante"} | Dashboard`;
  }, [config]);

  if (loading) return <p>Cargando configuración...</p>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <img
          src={config?.branding?.logoUrl || "/default-logo.png"}
          alt="Logo restaurante"
          className="dashboard-logo"
        />
        <h1>{config?.branding?.nombreRestaurante}</h1>
        <p>{config?.informacionRestaurante?.direccion}</p>
        <p>Tel: {config?.informacionRestaurante?.telefono}</p>
      </header>

      {/* 👇 Mensaje de bienvenida antes del menú */}
      <section className="dashboard-welcome">
        <h2>Bienvenido, {user?.name}</h2>
        <p>Gestiona todos los aspectos de tu restaurante desde aquí.</p>
      </section>

      <nav className="dashboard-menu">
        <Link to="/perfil">Perfil</Link>
        <Link to="/configuracion/restaurante">Datos del restaurante</Link>
        <Link to="/configuracion/carta">Carta</Link>
        <Link to="/configuracion/reservas">Reservas</Link>
      </nav>

    </div>
  );
}
