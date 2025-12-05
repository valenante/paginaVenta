import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import logoAlef from "../../assets/imagenes/alef.png";
import "./TopBar.css";

export default function TopBar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const abrirEnNuevaPestana = (url) => {
    const nuevaVentana = window.open(url, "_blank", "noopener,noreferrer");
    if (nuevaVentana) nuevaVentana.focus();
  };

  // =============================
  //  GENERADOR DE URLs DINÁMICAS
  // =============================
  const getTenantURL = (type) => {
    const tenant = user?.tenantId || "demo";
    const domain = import.meta.env.VITE_MAIN_DOMAIN;

    const isLocal = window.location.hostname.includes("local.");

    // === LOCALHOST ===
    if (isLocal) {
      if (type === "tpv") return `http://tpv.local.softalef.com/${tenant}`;
      if (type === "carta") return `http://carta.local.softalef.com/${tenant}`;
      if (type === "panel") return `http://panel.local.softalef.com/${tenant}`;
    }

    // === PRODUCCIÓN ===
    if (type === "tpv") return `https://${tenant}-tpv.${domain}`;
    if (type === "carta") return `https://${tenant}-carta.${domain}`;
    if (type === "panel") return `https://${tenant}-panel.${domain}`;
  };

  // =============================
  // Cerrar menú en resize
  // =============================
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
            Alef <strong>TPV</strong>
          </span>
        </button>

        {/* Hamburguesa */}
        <button
          className={`TopBar-menu ${menuAbierto ? "active" : ""}`}
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          <span></span><span></span><span></span>
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

              <Link to="/login" onClick={() => setMenuAbierto(false)} className="TopBar-btn login">
                Iniciar sesión
              </Link>

              <button
                className="TopBar-btn cta"
                onClick={() => { setMenuAbierto(false); navigate("/?seleccionarPlan=1#packs"); }}
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

                  <button onClick={() => navigate("/dashboard")} className="TopBar-btn login">
                    Dashboard
                  </button>

                  <button onClick={() => abrirEnNuevaPestana(getTenantURL("tpv"))} className="TopBar-btn login">
                    TPV
                  </button>

                  <button onClick={() => abrirEnNuevaPestana(getTenantURL("carta"))} className="TopBar-btn login">
                    Carta
                  </button>

                  <Link to="/perfil" className="TopBar-btn login" onClick={() => setMenuAbierto(false)}>
                    Perfil
                  </Link>
                </>
              )}

              {/* ADMIN / ADMIN_RESTAURANTE */}
              {["admin_restaurante", "admin"].includes(user.role) && (
                <>
                  <button onClick={() => navigate("/dashboard")} className="TopBar-btn login">
                    Dashboard
                  </button>

                  <button onClick={() => abrirEnNuevaPestana(getTenantURL("tpv"))} className="TopBar-btn login">
                    TPV
                  </button>

                  <button onClick={() => abrirEnNuevaPestana(getTenantURL("carta"))} className="TopBar-btn login">
                    Carta
                  </button>

                  <Link to="/perfil" className="TopBar-btn login">Perfil</Link>
                  <Link to="/ayuda" className="TopBar-btn login">Ayuda</Link>
                  <Link to="/soporte" className="TopBar-btn login">Soporte</Link>
                </>
              )}

              {/* CAMARERO / COCINERO */}
              {["camarero", "cocinero"].includes(user.role) && (
                <>
                  <button
                    onClick={() => abrirEnNuevaPestana(getTenantURL("tpv"))}
                    className="TopBar-btn login"
                  >
                    TPV
                  </button>

                  <button
                    onClick={() => abrirEnNuevaPestana(getTenantURL("carta"))}
                    className="TopBar-btn login"
                  >
                    Carta
                  </button>

                  <button
                    onClick={() => navigate("/personalizar")}
                    className="TopBar-btn login"
                  >
                    Personalizar
                  </button>
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
