import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import "./cliente.css";

/**
 * Layout común del área del cliente final del programa de fidelización ALEF.
 * Header fijo con marca + navegación + perfil. Footer con legales y soporte.
 */
export default function ClienteLayout({ children, narrow = false }) {
  const { cliente, logout } = useClienteAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/cliente/login");
  };

  const navItems = cliente ? [
    { to: "/cliente/perfil", label: "Mi cuenta" },
    { to: "/cliente/restaurantes", label: "Restaurantes" },
  ] : [];

  return (
    <div className="cliente-layout">
      <header className="cliente-header">
        <div className="cliente-header__inner">
          <Link to={cliente ? "/cliente/perfil" : "/"} className="cliente-brand" aria-label="Alef">
            <span className="cliente-brand__logo">Alef</span>
            <span className="cliente-brand__sep">·</span>
            <span className="cliente-brand__tag">Programa de fidelización</span>
          </Link>

          {cliente && (
            <>
              <nav className="cliente-nav cliente-nav--desktop" aria-label="Navegación principal">
                {navItems.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    className={({ isActive }) =>
                      `cliente-nav__link ${isActive ? "is-active" : ""}`
                    }
                  >
                    {it.label}
                  </NavLink>
                ))}
              </nav>

              <div className="cliente-user cliente-user--desktop">
                <div className="cliente-user__info">
                  <span className="cliente-user__nombre">{cliente.nombre}</span>
                  <button type="button" className="cliente-user__logout" onClick={handleLogout}>
                    Cerrar sesión
                  </button>
                </div>
                <div className="cliente-user__avatar" aria-hidden="true">
                  {cliente.nombre?.[0]?.toUpperCase() || "·"}
                </div>
              </div>

              <button
                type="button"
                className="cliente-burger"
                aria-label="Menú"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span /><span /><span />
              </button>
            </>
          )}
        </div>

        {cliente && menuOpen && (
          <div className="cliente-mobile-menu" onClick={() => setMenuOpen(false)}>
            {navItems.map((it) => (
              <NavLink key={it.to} to={it.to} className="cliente-mobile-menu__link">
                {it.label}
              </NavLink>
            ))}
            <button type="button" className="cliente-mobile-menu__logout" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </header>

      <main className={`cliente-main ${narrow ? "cliente-main--narrow" : ""}`}>
        {children}
      </main>

      <footer className="cliente-footer">
        <div className="cliente-footer__inner">
          <div className="cliente-footer__brand">
            <strong>Alef</strong>
            <span> · TPV y programa de fidelización para hostelería</span>
          </div>
          <nav className="cliente-footer__links">
            <Link to="/aviso-legal">Aviso legal</Link>
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/terminos">Términos</Link>
            <a href="mailto:contacto@softalef.com">Soporte</a>
          </nav>
          <div className="cliente-footer__copy">
            © {new Date().getFullYear()} Alef · softalef.com
          </div>
        </div>
      </footer>
    </div>
  );
}
