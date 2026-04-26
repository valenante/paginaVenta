import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import logoAlef from "../../assets/imagenes/alef.png";
import "./cliente.css";

/**
 * Layout del área cliente final del programa de fidelización ALEF.
 * Replica la identidad visual de la landing Alef: TopBar blanca con logo
 * real, gradiente oscuro azul/naranja en hero, tipografía y badges
 * coherentes.
 */
export default function ClienteLayout({ children, hero = null, narrow = false }) {
  const { cliente, logout } = useClienteAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/cliente/login");
  };

  const navItems = cliente ? [
    { to: "/cliente/perfil", label: "Mi cuenta" },
    { to: "/cliente/restaurantes", label: "Restaurantes" },
    { to: "/cliente/configuracion", label: "Configuración" },
  ] : [];

  return (
    <div className="cli-shell">
      <header className="cli-topbar">
        <div className="cli-topbar__inner">
          <Link to={cliente ? "/cliente/perfil" : "/"} className="cli-topbar__logo">
            <img src={logoAlef} alt="" className="cli-topbar__logo-img" />
            <span className="cli-topbar__logo-text">
              Alef <strong>Club</strong>
            </span>
          </Link>

          <button
            type="button"
            className={`cli-topbar__burger ${menuOpen ? "is-open" : ""}`}
            aria-label="Menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>

          <nav className={`cli-topbar__nav ${menuOpen ? "is-open" : ""}`}>
            {cliente ? (
              <>
                {navItems.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `cli-topbar__link ${isActive ? "is-active" : ""}`
                    }
                  >
                    {it.label}
                  </NavLink>
                ))}
                <span className="cli-topbar__sep" aria-hidden="true" />
                <span className="cli-topbar__user">
                  <span className="cli-topbar__avatar" aria-hidden="true">
                    {cliente.nombre?.[0]?.toUpperCase() || "·"}
                  </span>
                  <span className="cli-topbar__user-name">{cliente.nombre.split(" ")[0]}</span>
                </span>
                <button type="button" onClick={handleLogout} className="cli-topbar__btn cli-topbar__btn--cta">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <NavLink to="/cliente/login" onClick={() => setMenuOpen(false)} className="cli-topbar__link">
                  Iniciar sesión
                </NavLink>
                <Link to="/cliente/registro" onClick={() => setMenuOpen(false)} className="cli-topbar__btn cli-topbar__btn--cta">
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {hero && <div className="cli-hero-wrap">{hero}</div>}

      <main className={`cli-main ${narrow ? "cli-main--narrow" : ""} ${hero ? "cli-main--with-hero" : ""}`}>
        {children}
      </main>

      <footer className="cli-footer">
        <div className="cli-footer__inner">
          <div className="cli-footer__brand">
            <img src={logoAlef} alt="" className="cli-footer__logo" />
            <div>
              <strong>Alef Club</strong>
              <p>El programa que te premia por comer en tus restaurantes favoritos.</p>
            </div>
          </div>
          <nav className="cli-footer__links">
            <Link to="/aviso-legal">Aviso legal</Link>
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/terminos">Términos</Link>
            <a href="mailto:contacto@softalef.com">Soporte</a>
          </nav>
          <div className="cli-footer__copy">
            © {new Date().getFullYear()} Alef · softalef.com
          </div>
        </div>
      </footer>
    </div>
  );
}
