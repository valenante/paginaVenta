import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./TopBar.css";

export default function TopBar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const abrirEnNuevaPestana = (url) => {
    const nuevaVentana = window.open(url, "_blank", "noopener,noreferrer");
    if (nuevaVentana) nuevaVentana.focus();
  };

  // Cierra el menú al cambiar el tamaño de pantalla
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
        <div className="TopBar-logo" onClick={() => navigate("/")}>
          TPV <span>ALEF</span>
        </div>

        {/* Botón hamburguesa */}
        <button
          className={`TopBar-menu ${menuAbierto ? "active" : ""}`}
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label="Abrir menú"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Menú desplegable */}
        <div className={`TopBar-dropdown ${menuAbierto ? "open" : ""}`}>
          {!user ? (
            <>
              <a href="#inicio" onClick={() => setMenuAbierto(false)}>Inicio</a>
              <a href="#ventajas" onClick={() => setMenuAbierto(false)}>Ventajas</a>
              <a href="#packs" onClick={() => setMenuAbierto(false)}>Packs</a>
              <a href="#capturas" onClick={() => setMenuAbierto(false)}>Capturas</a>
              <a href="#contacto" onClick={() => setMenuAbierto(false)}>Contacto</a>
              <Link to="/login" onClick={() => setMenuAbierto(false)} className="TopBar-btn login">Iniciar sesión</Link>
              <Link to="/registro" onClick={() => setMenuAbierto(false)} className="TopBar-btn cta">Solicitar demo</Link>
            </>
          ) : (
            <>
              {user.role === "superadmin" && (
                <>
                  <Link to="/superadmin" className="TopBar-btn special" onClick={() => setMenuAbierto(false)}>Panel SuperAdmin</Link>
                  <button onClick={() => navigate("/dashboard")} className="TopBar-btn login">Dashboard</button>
                  <button onClick={() => abrirEnNuevaPestana(`http://localhost:3002/tpv/login/${user.tenantId || "demo"}`)} className="TopBar-btn login">TPV</button>
                  <button onClick={() => abrirEnNuevaPestana(`http://localhost:3001/${user.tenantId || "demo"}`)} className="TopBar-btn login">Carta</button>
                  <Link to="/perfil" onClick={() => setMenuAbierto(false)} className="TopBar-btn login">Perfil</Link>
                </>
              )}
              {user.role === "admin_restaurante" && (
                <>
                  <button onClick={() => navigate("/dashboard")} className="TopBar-btn login">Dashboard</button>
                  <button onClick={() => abrirEnNuevaPestana(`http://localhost:3002/tpv/login/${user.tenantId || "demo"}`)} className="TopBar-btn login">TPV</button>
                  <button onClick={() => abrirEnNuevaPestana(`http://localhost:3001/${user.tenantId || "demo"}`)} className="TopBar-btn login">Carta</button>
                  <Link to="/perfil" onClick={() => setMenuAbierto(false)} className="TopBar-btn login">Perfil</Link>
                </>
              )}
              <button onClick={logout} className="TopBar-btn cta">Cerrar sesión</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
