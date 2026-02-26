import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTenant } from "../../context/TenantContext";
import logoAlef from "../../assets/imagenes/alef.png";
import "./TopBar.css";

export default function TopBar() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const { user, logout } = useAuth();
  const { tenant, tenantId } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  // ✅ Plan esencial: tanto 'esencial' como 'tpv-esencial'
  const isPlanEsencial =
    user?.plan === "esencial" || user?.plan === "tpv-esencial";

  const isDev = import.meta.env.DEV;

  // ✅ tenantSlug: usa tenant.slug primero, y cae a tenantId/user.tenantId como fallback
  const tenantSlug = useMemo(() => {
    return tenant?.slug || tenantId || user?.tenantId || "demo";
  }, [tenant?.slug, tenantId, user?.tenantId]);

  // ✅ tipoNegocio (soporta ambos modelos)
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

  const irAlPanelPro = useCallback((url) => {
    window.location.href = url;
  }, []);

  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);
  const toggleMenu = useCallback(() => setMenuAbierto((v) => !v), []);


  // =========================
  // URLs por tipo de negocio
  // =========================
  const tpvURL = isDev
    ? `http://localhost:3002/${tenantSlug}`
    : `https://${tenantSlug}-tpv.${import.meta.env.VITE_MAIN_DOMAIN}`;

  const cartaURL = isDev
    ? `http://localhost:3001/${tenantSlug}`
    : `https://${tenantSlug}-carta.${import.meta.env.VITE_MAIN_DOMAIN}`;

  // 👉 SHOPS (shop) — AJUSTA a tu realidad
  const shopsURL = isDev
    ? `http://localhost:3003/${tenantSlug}`
    : `https://${tenantSlug}-shops.${import.meta.env.VITE_MAIN_DOMAIN}`;

  // =========================
  // URL PANEL PRO (logo click)
  // =========================
  const panelProURL = isDev
    ? `http://localhost:5173/${tenantSlug}/pro`
    : `https://${tenantSlug}-panel.${import.meta.env.VITE_MAIN_DOMAIN}/pro`;

  // Cerrar menú al cambiar tamaño
  useEffect(() => {
    const manejarResize = () => {
      if (window.innerWidth > 768 && menuAbierto) setMenuAbierto(false);
    };
    window.addEventListener("resize", manejarResize);
    return () => window.removeEventListener("resize", manejarResize);
  }, [menuAbierto]);

  const handleLogoClick = useCallback(() => {
    // 1) Si estoy en landing pública (no logueado): ir a #inicio
    if (!user) {
      cerrarMenu();

      // si estás en rutas tipo /aviso-legal, /privacidad, etc
      // primero vuelve a "/" y luego scrollea
      if (location.pathname !== "/") {
        navigate("/", { replace: false });

        // espera al render para que exista el elemento
        setTimeout(() => {
          document.getElementById("inicio")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 50);

        return;
      }

      // si ya estás en "/"
      document.getElementById("inicio")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    // 2) Si hay sesión: comportamiento actual (panel)
    irAlPanelPro(panelProURL);
  }, [user, cerrarMenu, location.pathname, navigate, irAlPanelPro, panelProURL]);

  return (
    <header className="TopBar">
      <div className="TopBar-container">
        {/* Logo */}
        <button
          type="button"
          className="TopBar-logo"
          onClick={handleLogoClick}
          aria-label={user ? "Ir al Panel" : "Volver al inicio"}
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
              {/* <a href="#packs" onClick={cerrarMenu}>Packs</a> */}
              {/* <a href="#capturas" onClick={cerrarMenu}>
                Capturas
              </a>*/}
              <a href="#contacto" onClick={cerrarMenu}>
                Contacto
              </a>

              <Link
                to="/login"
                onClick={cerrarMenu}
                className="TopBar-btn login"
              >
                Iniciar sesión
              </Link>

              {/*
              <button
                type="button"
                className="TopBar-btn cta"
                onClick={() => {
                  cerrarMenu();
                  navigate("/?seleccionarPlan=1#packs");
                }}
              >
                Solicitar demo
              </button>
              */}
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
                      navigate("/dashboard");
                    }}
                    className={`TopBar-btn login ${isActive("/dashboard") ? "active" : ""}`}
                  >
                    Dashboard
                  </button>

                  {/* ✅ ENLACES EXTERNOS segun tipoNegocio */}
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

              {/* ADMIN / ADMIN_RESTAURANTE / ADMIN_SHOP */}
              {["admin_restaurante", "admin", "admin_shop"].includes(
                user.role
              ) && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        cerrarMenu();
                        navigate("/pro");
                      }}
                      className={`TopBar-btn login ${isActive("/pro") ? "active" : ""}`}
                    >
                      Panel de Gestión
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        cerrarMenu();
                        navigate("/dashboard");
                      }}
                      className={`TopBar-btn login ${isActive("/dashboard") ? "active" : ""}`}
                    >
                      Dashboard
                    </button>

                    {/* ✅ ENLACES EXTERNOS segun tipoNegocio */}
                    {!esTienda ? (
                      <>
                        <button
                          type="button"
                          onClick={() => abrirEnNuevaPestana(tpvURL)}
                          className="TopBar-btn login"
                        >
                          TPV
                        </button>

                        {/* Carta SOLO si NO es esencial */}
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

              {/* EMPLEADOS (camarero/cocinero) */}
              {["camarero", "cocinero"].includes(user.role) && (
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

                  {!esTienda && (
                    <button
                      type="button"
                      onClick={() => {
                        cerrarMenu();
                        navigate("/personalizar");
                      }}
                      className={`TopBar-btn login ${isActive("/perfil") ? "active" : ""}`}
                    >
                      Personalizar
                    </button>
                  )}
                </>
              )}

              {/* VENDEDOR (SHOP) */}
              {user.role === "vendedor" && (
                <button
                  type="button"
                  onClick={() => abrirEnNuevaPestana(shopsURL)}
                  className="TopBar-btn login"
                >
                  Shop
                </button>
              )}

              <button type="button" onClick={logout} className="TopBar-btn cta">
                Cerrar sesión
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
