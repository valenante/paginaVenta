import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTenant } from "../../context/TenantContext"; // ✅ si ya lo tienes
import logoAlef from "../../assets/imagenes/alef.png";
import "./TopBar.css";

export default function TopBar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { user, logout } = useAuth();
  const { tenant, tenantId, loadingTenant } = useTenant();
  const navigate = useNavigate();

  // ✅ Plan esencial: tanto 'esencial' como 'tpv-esencial'
  const isPlanEsencial =
    user?.plan === "esencial" || user?.plan === "tpv-esencial";

  const abrirEnNuevaPestana = (url) => {
    const nuevaVentana = window.open(url, "_blank", "noopener,noreferrer");
    if (nuevaVentana) nuevaVentana.focus();
  };

  // ✅ Mejor que hostname: Vite te da DEV/PROD
  const isDev = import.meta.env.DEV;

  // ✅ tenantSlug: usa tenant.slug primero, y cae a user.tenantId como fallback
  const tenantSlug = tenant?.slug || tenantId || user?.tenantId || "demo";
  // ✅ tipoNegocio (soporta ambos modelos)
  const tipoNegocio = (
    tenant?.tipoNegocio ||
    tenant?.suscripcion?.tipoNegocio ||
    "restaurante"
  ).toLowerCase();

  const esTienda =
    tipoNegocio === "tienda" || tipoNegocio === "peluqueria" || tipoNegocio === "otro";

  // =========================
  // URLs por tipo de negocio
  // =========================
  // Ajusta estos puertos/subdominios si tu arquitectura es distinta.
  const tpvURL = isDev
    ? `http://localhost:3002/${tenantSlug}`
    : `https://${tenantSlug}-tpv.${import.meta.env.VITE_MAIN_DOMAIN}`;

  const cartaURL = isDev
    ? `http://localhost:3001/${tenantSlug}`
    : `https://${tenantSlug}-carta.${import.meta.env.VITE_MAIN_DOMAIN}`;

  // 👉 SHOPS (tienda) — AJUSTA a tu realidad (subdominio/host)
  const shopsURL = isDev
    ? `http://localhost:3004/${tenantSlug}` // por ejemplo
    : `https://${tenantSlug}-shops.${import.meta.env.VITE_MAIN_DOMAIN}`;

  // Cerrar menú al cambiar tamaño
  useEffect(() => {
    const manejarResize = () => {
      if (window.innerWidth > 768 && menuAbierto) setMenuAbierto(false);
    };
    window.addEventListener("resize", manejarResize);
    return () => window.removeEventListener("resize", manejarResize);
  }, [menuAbierto]);

  return (
    <header className="TopBar">
      <div className="TopBar-container">
        {/* Logo */}
        <button className="TopBar-logo" onClick={() => navigate("/")}>
          <img src={logoAlef} alt="Alef Logo" className="TopBar-logo-img" />
          <span className="TopBar-logo-text">
            Alef <strong>{esTienda ? "Shops" : "TPV"}</strong>
          </span>
        </button>

        {/* Hamburguesa */}
        <button
          className={`TopBar-menu ${menuAbierto ? "active" : ""}`}
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label="Abrir menú"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Menú */}
        <nav className={`TopBar-dropdown ${menuAbierto ? "open" : ""}`}>
          {!user ? (
            <>
              <a href="#inicio" onClick={() => setMenuAbierto(false)}>Inicio</a>
              <a href="#ventajas" onClick={() => setMenuAbierto(false)}>Ventajas</a>
              <a href="#packs" onClick={() => setMenuAbierto(false)}>Packs</a>
              <a href="#capturas" onClick={() => setMenuAbierto(false)}>Capturas</a>
              <a href="#contacto" onClick={() => setMenuAbierto(false)}>Contacto</a>

              <Link
                to="/login"
                onClick={() => setMenuAbierto(false)}
                className="TopBar-btn login"
              >
                Iniciar sesión
              </Link>

              <button
                className="TopBar-btn cta"
                onClick={() => {
                  setMenuAbierto(false);
                  navigate("/?seleccionarPlan=1#packs");
                }}
              >
                Solicitar demo
              </button>
            </>
          ) : (
            <>
              {/* SUPERADMIN */}
              {user.role === "superadmin" && (
                <>
                  <Link
                    to="/superadmin"
                    className="TopBar-btn special"
                    onClick={() => setMenuAbierto(false)}
                  >
                    Panel SuperAdmin
                  </Link>

                  <button
                    onClick={() => {
                      setMenuAbierto(false);
                      navigate("/dashboard");
                    }}
                    className="TopBar-btn login"
                  >
                    Dashboard
                  </button>

                  {/* ✅ ENLACES EXTERNOS segun tipoNegocio */}
                  {!esTienda ? (
                    <>
                      <button
                        onClick={() => abrirEnNuevaPestana(tpvURL)}
                        className="TopBar-btn login"
                      >
                        TPV
                      </button>

                      <button
                        onClick={() => abrirEnNuevaPestana(cartaURL)}
                        className="TopBar-btn login"
                      >
                        Carta
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => abrirEnNuevaPestana(shopsURL)}
                      className="TopBar-btn login"
                    >
                      Alef Shops
                    </button>
                  )}

                  <Link
                    to="/perfil"
                    onClick={() => setMenuAbierto(false)}
                    className="TopBar-btn login"
                  >
                    Perfil
                  </Link>
                </>
              )}

              {/* ADMIN / ADMIN_RESTAURANTE */}
              {["admin_restaurante", "admin"].includes(user.role) && (
                <>
                  <button
                    onClick={() => {
                      setMenuAbierto(false);
                      navigate("/dashboard");
                    }}
                    className="TopBar-btn login"
                  >
                    Dashboard
                  </button>

                  {/* ✅ ENLACES EXTERNOS segun tipoNegocio */}
                  {!esTienda ? (
                    <>
                      <button
                        onClick={() => abrirEnNuevaPestana(tpvURL)}
                        className="TopBar-btn login"
                      >
                        TPV
                      </button>

                      {/* Carta SOLO si NO es esencial */}
                      {!isPlanEsencial && (
                        <button
                          onClick={() => abrirEnNuevaPestana(cartaURL)}
                          className="TopBar-btn login"
                        >
                          Carta
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => abrirEnNuevaPestana(shopsURL)}
                      className="TopBar-btn login"
                    >
                      Alef Shops
                    </button>
                  )}

                  <Link
                    to="/perfil"
                    onClick={() => setMenuAbierto(false)}
                    className="TopBar-btn login"
                  >
                    Perfil
                  </Link>

                  <Link
                    to="/ayuda"
                    onClick={() => setMenuAbierto(false)}
                    className="TopBar-btn login"
                  >
                    Ayuda
                  </Link>

                  <Link
                    to="/soporte"
                    onClick={() => setMenuAbierto(false)}
                    className="TopBar-btn login"
                  >
                    Soporte
                  </Link>
                </>
              )}

              {/* EMPLEADOS (camarero/cocinero) — en tienda quizá será "dependiente" */}
              {["camarero", "cocinero", "dependiente", "empleado"].includes(user.role) && (
                <>
                  {!esTienda ? (
                    <>
                      <button
                        onClick={() => abrirEnNuevaPestana(tpvURL)}
                        className="TopBar-btn login"
                      >
                        TPV
                      </button>

                      {!isPlanEsencial && (
                        <button
                          onClick={() => abrirEnNuevaPestana(cartaURL)}
                          className="TopBar-btn login"
                        >
                          Carta
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => abrirEnNuevaPestana(shopsURL)}
                      className="TopBar-btn login"
                    >
                      Alef Shops
                    </button>
                  )}

                  {!esTienda && (
                    <button
                      onClick={() => {
                        setMenuAbierto(false);
                        navigate("/personalizar");
                      }}
                      className="TopBar-btn login"
                    >
                      Personalizar
                    </button>
                  )}
                </>
              )}

              <button onClick={logout} className="TopBar-btn cta">
                Cerrar sesión
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
