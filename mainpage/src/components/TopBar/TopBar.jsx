import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTenant } from "../../context/TenantContext";
import logoAlef from "../../assets/imagenes/alef.png";
import StockAlertasBell from "./StockAlertasBell.jsx";
import "./TopBar.css";

/* ADMIN_PANEL_ROLES eliminado — acceso al panel controlado por permisos granulares */

export default function TopBar() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const {
    user,
    logout,
    canAccessModule,
    isSuperadmin,
  } = useAuth();

  const { tenant, tenantId } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();


  const isActive = (path) => location.pathname.startsWith(path);

  const isPlanEsencial =
    user?.plan === "esencial" || user?.plan === "tpv-esencial";

  const isDev = import.meta.env.DEV;

  const isOwner =
    user?.role === "admin_restaurante" ||
    user?.role === "admin_shop";

  const tenantSlug = useMemo(() => {
    return tenant?.slug || tenantId || user?.tenantSlug || user?.tenantId || "demo";
  }, [tenant?.slug, tenantId, user?.tenantSlug, user?.tenantId]);

  const tipoNegocio = useMemo(() => {
    return (
      tenant?.tipoNegocio ||
      tenant?.suscripcion?.tipoNegocio ||
      "restaurante"
    ).toLowerCase();
  }, [tenant?.tipoNegocio, tenant?.suscripcion?.tipoNegocio]);

  const esTienda =
    tipoNegocio === "shop" ||
    tipoNegocio === "peluqueria" ||
    tipoNegocio === "otro";

  const abrirEnNuevaPestana = useCallback((url) => {
    const nuevaVentana = window.open(url, "_blank", "noopener,noreferrer");
    if (nuevaVentana) nuevaVentana.focus();
  }, []);

  const puedeEntrarPanel = !isSuperadmin && !!user;

  const rutaPanelPrincipal = useMemo(() => {
    if (isSuperadmin) return "/superadmin";
    if (!user) return "/";
    return "/pro";
  }, [isSuperadmin, user]);

  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);
  const toggleMenu = useCallback(() => setMenuAbierto((v) => !v), []);

  const tpvURL = isDev
    ? `http://localhost:5174/${tenantSlug}`
    : `https://${tenantSlug}-tpv.${import.meta.env.VITE_MAIN_DOMAIN}`;

  const cartaURL = isDev
    ? `http://localhost:5175/${tenantSlug}`
    : `https://${tenantSlug}-carta.${import.meta.env.VITE_MAIN_DOMAIN}`;

  const shopsURL = isDev
    ? `http://localhost:5176/${tenantSlug}`
    : `https://${tenantSlug}-shops.${import.meta.env.VITE_MAIN_DOMAIN}`;

  useEffect(() => {
    const manejarResize = () => {
      if (window.innerWidth > 768 && menuAbierto) setMenuAbierto(false);
    };

    window.addEventListener("resize", manejarResize);
    return () => window.removeEventListener("resize", manejarResize);
  }, [menuAbierto]);

  const handleLogoClick = useCallback(() => {
    cerrarMenu();

    if (!user) {
      if (location.pathname !== "/") {
        navigate("/", { replace: false });

        setTimeout(() => {
          document.getElementById("inicio")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 50);

        return;
      }

      document.getElementById("inicio")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    navigate(rutaPanelPrincipal);
  }, [cerrarMenu, user, location.pathname, navigate, rutaPanelPrincipal]);

  return (
    <header className="TopBar">
      <div className="TopBar-container">
        {/* Logo */}
        <button
          type="button"
          className="TopBar-logo"
          onClick={handleLogoClick}
        >
          <img src={logoAlef} alt="Alef" className="TopBar-logo-img" />
          <span className="TopBar-logo-text">
            Alef <strong>{esTienda ? "Shops" : "TPV"}</strong>
          </span>
        </button>

        {/* Hamburguesa */}
        <button
          type="button"
          className={`TopBar-menu ${menuAbierto ? "active" : ""}`}
          onClick={toggleMenu}
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          aria-controls="topbar-menu"
        >
          <span />
          <span />
          <span />
        </button>

        {/* Menú */}
        <nav
          id="topbar-menu"
          className={`TopBar-dropdown ${menuAbierto ? "open" : ""}`}
        >
          {!user ? (
            <>
              <a href="#inicio" onClick={cerrarMenu}>
                Inicio
              </a>

              <a href="#ventajas" onClick={cerrarMenu}>
                Ventajas
              </a>

              <a href="#faq" onClick={cerrarMenu}>
                FAQ
              </a>

              <a href="#contacto" onClick={cerrarMenu}>
                Contacto
              </a>

              <Link
                to="/login"
                onClick={cerrarMenu}
                className="TopBar-btn login"
              >
                Iniciar sesion
              </Link>

              {/* <a
                href="#packs"
                onClick={cerrarMenu}
                className="TopBar-btn cta"
              >
                Probar Alef
              </a> */}
            </>
          ) : (
            <>
              {/* SUPERADMIN */}
              {user.role === "superadmin" && (
                <>
                  <Link
                    to="/superadmin"
                    className={`TopBar-btn special ${isActive("/superadmin") ? "active" : ""}`}
                    onClick={cerrarMenu}
                  >
                    Panel SuperAdmin
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      cerrarMenu();
                      navigate("/configuracion");
                    }}
                    className={`TopBar-btn login ${isActive("/configuracion") ? "active" : ""}`}
                  >
                    Configuración
                  </button>

                  {!esTienda ? (
                    <>
                      <button
                        type="button"
                        onClick={() => abrirEnNuevaPestana(tpvURL)}
                        className="TopBar-btn login"
                      >
                        TPV
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirEnNuevaPestana(cartaURL)}
                        className="TopBar-btn login"
                      >
                        Carta
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => abrirEnNuevaPestana(shopsURL)}
                      className="TopBar-btn login"
                    >
                      Alef Shops
                    </button>
                  )}
                </>
              )}

              {/* PANEL PRINCIPAL */}
              {puedeEntrarPanel && (
                <button
                  type="button"
                  onClick={() => {
                    cerrarMenu();
                    navigate(rutaPanelPrincipal);
                  }}
                  className={`TopBar-btn login ${isActive("/pro") || isActive("/staff") || isActive("/panel")
                      ? "active"
                      : ""
                    }`}
                >
                  Panel de Gestión
                </button>
              )}

              {/* CONFIGURACIÓN */}
              {!isSuperadmin && (
                canAccessModule("dashboard") ||
                canAccessModule("config") ||
                canAccessModule("caja") ||
                canAccessModule("stock") ||
                canAccessModule("stats")
              ) && (
                  <button
                    type="button"
                    onClick={() => {
                      cerrarMenu();
                      navigate("/configuracion");
                    }}
                    className={`TopBar-btn login ${isActive("/configuracion") ? "active" : ""}`}
                  >
                    Configuración
                  </button>
                )}

              {/* ENLACES EXTERNOS */}
              {!isSuperadmin && (
                <>
                  {!esTienda ? (
                    <>
                      <button
                        type="button"
                        onClick={() => abrirEnNuevaPestana(tpvURL)}
                        className="TopBar-btn login"
                      >
                        TPV
                      </button>

                      {!isPlanEsencial && (
                        <button
                          type="button"
                          onClick={() => abrirEnNuevaPestana(cartaURL)}
                          className="TopBar-btn login"
                        >
                          Carta
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => abrirEnNuevaPestana(shopsURL)}
                      className="TopBar-btn login"
                    >
                      Shop
                    </button>
                  )}
                </>
              )}

              {/* ALERTAS DE STOCK (Fase 4) — solo dueños de restaurante */}
              {!isSuperadmin && isOwner && !esTienda && (
                <StockAlertasBell />
              )}

              {/* AYUDA / SOPORTE */}
              {!isSuperadmin && isOwner && (
                <>
                  <Link
                    to="/ayuda"
                    onClick={cerrarMenu}
                    className={`TopBar-btn login ${isActive("/ayuda") ? "active" : ""}`}
                  >
                    Ayuda
                  </Link>

                  <Link
                    to="/soporte"
                    onClick={cerrarMenu}
                    className={`TopBar-btn login ${isActive("/soporte") ? "active" : ""}`}
                  >
                    Soporte
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={logout}
                className="TopBar-btn cta"
              >
                Cerrar sesión
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}