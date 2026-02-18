import { useEffect } from "react";
import { useConfig } from "../context/ConfigContext.jsx";
import { useTenant } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";
import "../styles/DashboardPage.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const { config, loading } = useConfig();
  const { tenant } = useTenant();
  const tipoNegocio = tenant?.tipoNegocio || "restaurante";

  const isPlanEsencial =
    user?.plan === "esencial" || user?.plan === "tpv-esencial";

  const labelNegocio = tipoNegocio === "shop" ? "shop" : "restaurante";
  const labelArticulo = tipoNegocio === "shop" ? "la shop" : "el restaurante";

  const impresionTexto =
    tipoNegocio === "shop"
      ? "Configura impresoras de tickets y facturas para el mostrador."
      : "Asigna impresoras a cocina, barra y caja y realiza pruebas.";

  useEffect(() => {
    const fallback = tipoNegocio === "shop" ? "Tienda" : "Restaurante";
    document.title = `${config?.branding?.nombreRestaurante || fallback} | Dashboard`;
  }, [config, tipoNegocio]);

  if (loading) {
    return (
      <main className="section section--wide">
        <p className="text-suave">Cargando configuración...</p>
      </main>
    );
  }

  const nombreNegocio =
    config?.branding?.nombreRestaurante ||
    (tipoNegocio === "shop" ? "Tu shop" : "Tu restaurante");

  const direccion = config?.informacionRestaurante?.direccion || "";
  const telefono = config?.informacionRestaurante?.telefono || "";

  const impresionPath =
    tipoNegocio === "shop"
      ? "/configuracion/impresion-shop"
      : "/configuracion/impresion";

  return (
    <main className="dashboard-page section section--wide">
      {/* Header principal */}
      <header className="dashboard-header card">
        <div className="dashboard-header-left">
          <img
            src={config?.branding?.logoUrl || "/default-logo.png"}
            alt={`Logo ${labelNegocio}`}
            className="dashboard-logo"
          />

          <div className="dashboard-info">
            <h1>{nombreNegocio}</h1>
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
            Gestiona {labelArticulo} desde un único lugar.
          </p>
        </div>
      </header>

      {/* Grid de accesos rápidos */}
      <section className="dashboard-grid">
        {/* 1) Operación / Negocio (lo más importante) */}
        <Link to="/configuracion/restaurante" className="dashboard-tile card">
          <div className="dashboard-tile-icon">🏪</div>
          <h2>Datos de {labelNegocio}</h2>
          <p>Actualiza branding, contacto y configuración general del entorno Alef.</p>
        </Link>

        <Link to={impresionPath} className="dashboard-tile card">
          <div className="dashboard-tile-icon">🖨️</div>
          <h2>Impresión</h2>
          <p>{impresionTexto}</p>
        </Link>

        {tipoNegocio === "restaurante" && !isPlanEsencial && (
          <>
            <Link to="/configuracion/carta" className="dashboard-tile card">
              <div className="dashboard-tile-icon">📋</div>
              <h2>Carta</h2>
              <p>Gestiona la carta digital, alérgenos, platos, bebidas y visibilidad.</p>
            </Link>

            <Link to="/configuracion/reservas" className="dashboard-tile card">
              <div className="dashboard-tile-icon">📅</div>
              <h2>Reservas</h2>
              <p>Administra días disponibles, capacidad y solicitudes de reservas.</p>
            </Link>
          </>
        )}

        <Link to="/configuracion/proveedores" className="dashboard-tile card">
          <div className="dashboard-tile-icon">🚚</div>
          <h2>Proveedores</h2>
          <p>Gestiona proveedores, contactos, condiciones y relaciones comerciales.</p>
        </Link>

        {/* 2) Cuenta / Facturación (administrativo) */}
        <Link to="/mi-cuenta" className="dashboard-tile card">
          <div className="dashboard-tile-icon">💼</div>
          <h2>Mi cuenta</h2>
          <p>
            Consulta tu plan, fecha de renovación, estado de tu suscripción y datos de
            facturación.
          </p>
        </Link>

        <Link to="/facturas" className="dashboard-tile card">
          <div className="dashboard-tile-icon">🧾</div>
          <h2>Facturas</h2>
          <p>Visualiza facturas encadenadas, XML firmados y envíos AEAT.</p>
        </Link>

        {/* 3) Usuario (personal, al final) */}
        <Link to="/perfil" className="dashboard-tile card">
          <div className="dashboard-tile-icon">👤</div>
          <h2>Perfil</h2>
          <p>Gestiona tus datos personales, login y preferencias de usuario.</p>
        </Link>
      </section>
    </main>
  );
}
