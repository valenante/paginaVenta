import { useEffect } from "react";
import { useConfig } from "../context/ConfigContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";
import "../styles/DashboardPage.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const { config, loading } = useConfig();

  const isPlanEsencial =
    user?.plan === "esencial" || user?.plan === "tpv-esencial";

  useEffect(() => {
    document.title = `${
      config?.branding?.nombreRestaurante || "Restaurante"
    } | Dashboard`;
  }, [config]);

  if (loading) {
    return (
      <main className="section section--wide">
        <p className="text-suave">Cargando configuración...</p>
      </main>
    );
  }

  const nombreRestaurante =
    config?.branding?.nombreRestaurante || "Tu restaurante";
  const direccion = config?.informacionRestaurante?.direccion || "";
  const telefono = config?.informacionRestaurante?.telefono || "";

  return (
    <main className="dashboard-page section section--wide">
      {/* Header principal */}
      <header className="dashboard-header card">
        <div className="dashboard-header-left">
          <img
            src={config?.branding?.logoUrl || "/default-logo.png"}
            alt="Logo restaurante"
            className="dashboard-logo"
          />

          <div className="dashboard-info">
            <h1>{nombreRestaurante}</h1>
            {direccion && <p className="dashboard-text">{direccion}</p>}
            {telefono && (
              <p className="dashboard-text">
                Tel: <span className="dashboard-text-strong">{telefono}</span>
              </p>
            )}
          </div>
        </div>

        <div className="dashboard-header-right">
          <p className="dashboard-welcome-label">Panel Alef</p>
          <p className="dashboard-welcome-user">
            Hola, <span>{user?.name || "usuario"}</span>
          </p>
          <p className="dashboard-welcome-sub">
            Gestiona tu restaurante desde un único lugar.
          </p>
        </div>
      </header>

      {/* Grid de accesos rápidos */}
      <section className="dashboard-grid">
        <Link to="/perfil" className="dashboard-tile card">
          <div className="dashboard-tile-icon">👤</div>
          <h2>Perfil</h2>
          <p>
            Gestiona tus datos personales, login y preferencias de usuario.
          </p>
        </Link>

        <Link to="/mi-cuenta" className="dashboard-tile card">
          <div className="dashboard-tile-icon">💼</div>
          <h2>Mi cuenta</h2>
          <p>
            Consulta tu plan, fecha de renovación, estado de tu suscripción y
            datos de facturación.
          </p>
        </Link>

        <Link to="/facturas" className="dashboard-tile card">
          <div className="dashboard-tile-icon">🧾</div>
          <h2>Facturas</h2>
          <p>
            Visualiza facturas encadenadas, XML firmados y envíos AEAT.
          </p>
        </Link>

        {/* 👉 SIEMPRE visible */}
        <Link
          to="/configuracion/restaurante"
          className="dashboard-tile card"
        >
          <div className="dashboard-tile-icon">🏪</div>
          <h2>Datos del restaurante</h2>
          <p>
            Actualiza branding, contacto y configuración general del entorno
            Alef.
          </p>
        </Link>

        {/* Estas dos solo si el plan NO es esencial */}
        {!isPlanEsencial && (
          <>
            <Link to="/configuracion/carta" className="dashboard-tile card">
              <div className="dashboard-tile-icon">📋</div>
              <h2>Carta</h2>
              <p>
                Gestiona la carta digital, alérgenos, platos, bebidas y
                visibilidad.
              </p>
            </Link>

            <Link to="/configuracion/reservas" className="dashboard-tile card">
              <div className="dashboard-tile-icon">📅</div>
              <h2>Reservas</h2>
              <p>
                Administra días disponibles, capacidad y solicitudes de
                reservas.
              </p>
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
