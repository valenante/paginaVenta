import { useEffect } from "react";
import { useConfig } from "../context/ConfigContext.jsx";
import { useTenant } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen/LoadingScreen";
import "../styles/DashboardPage.css";

export default function DashboardPage() {
  const { user, hasPermission, canAccessModule } = useAuth();
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

  const isOwner =
    user?.role === "admin_restaurante" ||
    user?.role === "admin_shop";

  useEffect(() => {
    const fallback = tipoNegocio === "shop" ? "Tienda" : "Restaurante";
    document.title = `${config?.branding?.nombreRestaurante || fallback} | Configuración`;
  }, [config, tipoNegocio]);

  if (loading) return <LoadingScreen />;

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
          <p className="dashboard-welcome-label">Configuración</p>
          <p className="dashboard-welcome-user">
            Hola, <span>{user?.name || "usuario"}</span>
          </p>
          <p className="dashboard-welcome-sub">
            Configura y administra {labelArticulo} desde un único lugar.
          </p>
        </div>
      </header>

      {/* Grid de accesos rápidos */}
      <section className="dashboard-grid">
        {/* 1) Negocio / Operación */}
        {hasPermission("config.edit") && (
          <Link to="/configuracion/restaurante" className="dashboard-tile card">
            <div className="dashboard-tile-icon">🏪</div>
            <h2>Datos de {labelNegocio}</h2>
            <p>Actualiza branding, contacto y configuración general del entorno Alef.</p>
          </Link>
        )}

        {hasPermission("config.edit") && (
          <Link to={impresionPath} className="dashboard-tile card">
            <div className="dashboard-tile-icon">🖨️</div>
            <h2>Impresión</h2>
            <p>{impresionTexto}</p>
          </Link>
        )}

        {tipoNegocio === "restaurante" && !isPlanEsencial && (
          <>
            {canAccessModule("productos") && (
              <Link to="/configuracion/carta" className="dashboard-tile card">
                <div className="dashboard-tile-icon">📋</div>
                <h2>Carta</h2>
                <p>Gestiona la carta digital, alérgenos, platos, bebidas y visibilidad.</p>
              </Link>
            )}

            {canAccessModule("reservas") && (
              <Link to="/configuracion/reservas" className="dashboard-tile card">
                <div className="dashboard-tile-icon">📅</div>
                <h2>Reservas</h2>
                <p>Administra días disponibles, capacidad y solicitudes de reservas.</p>
              </Link>
            )}
          </>
        )}

        {canAccessModule("proveedores") && (
          <Link to="/configuracion/proveedores" className="dashboard-tile card">
            <div className="dashboard-tile-icon">🚚</div>
            <h2>Proveedores</h2>
            <p>Gestiona proveedores, contactos, condiciones y relaciones comerciales.</p>
          </Link>
        )}

        {/* 2) Equipo / Acceso */}
        {hasPermission("usuarios.manage") && (
          <Link to="/configuracion/usuarios" className="dashboard-tile card">
            <div className="dashboard-tile-icon">👥</div>
            <h2>Usuarios</h2>
            <p>Gestiona el equipo: alta, baja, permisos individuales y estadísticas de cada usuario.</p>
          </Link>
        )}

        {hasPermission("roles.manage") && (
          <Link to="/configuracion/roles" className="dashboard-tile card">
            <div className="dashboard-tile-icon">🔐</div>
            <h2>Roles y Permisos</h2>
            <p>Crea y edita roles personalizados, asigna permisos granulares por módulo.</p>
          </Link>
        )}

        {/* 3) Cuenta / Facturación */}
        {isOwner && (
          <Link to="/mi-cuenta" className="dashboard-tile card">
            <div className="dashboard-tile-icon">💼</div>
            <h2>Mi cuenta</h2>
            <p>
              Consulta tu plan, fecha de renovación, estado de tu suscripción y datos de
              facturación.
            </p>
          </Link>
        )}

        {canAccessModule("facturas") && (
          <Link to="/facturas" className="dashboard-tile card">
            <div className="dashboard-tile-icon">🧾</div>
            <h2>Facturas</h2>
            <p>Visualiza facturas encadenadas, XML firmados y envíos AEAT.</p>
          </Link>
        )}

        {hasPermission("estadisticas.manage") && (
          <Link to="/configuracion/exports" className="dashboard-tile card">
            <div className="dashboard-tile-icon">📤</div>
            <h2>Exports / Reports</h2>
            <p>Genera CSV y reportes en segundo plano. Historial auditable y descarga segura.</p>
          </Link>
        )}

        {/* 4) Usuario (siempre visible) */}
        <Link to="/perfil" className="dashboard-tile card">
          <div className="dashboard-tile-icon">👤</div>
          <h2>Perfil</h2>
          <p>Gestiona tus datos personales, login y preferencias de usuario.</p>
        </Link>
      </section>
    </main>
  );
}
