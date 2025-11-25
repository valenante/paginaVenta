import React from "react";
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

  // 👉 Ir a la sección de planes ("Packs")
  const irAPacks = () => {
    setMenuAbierto(false);
    // Navegamos a la landing con hash #packs
    navigate("/#packs");
  };

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

              <Link
                to="/login"
                onClick={() => setMenuAbierto(false)}
                className="TopBar-btn login"
              >
                Iniciar sesión
              </Link>

              {/* 🔥 Ahora "Solicitar demo" baja al bloque de planes */}
              <button
                className="TopBar-btn cta"
                onClick={() => {
                  setMenuAbierto(false);
                  // Navega a la home indicando que queremos ir a los planes
                  navigate("/?seleccionarPlan=1#packs");
                }}
              >
                Solicitar demo
              </button>
            </>
          ) : (
            <>
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
                    onClick={() => { setMenuAbierto(false); navigate("/dashboard"); }}
                    className="TopBar-btn login"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() =>
                      abrirEnNuevaPestana(
                        `http://tpv.local.softalef.com/tpv/login/${user.tenantId || "demo"}`
                      )
                    }
                    className="TopBar-btn login"
                  >
                    TPV
                  </button>
                  <button
                    onClick={() =>
                      abrirEnNuevaPestana(
                        `http://carta.local.softalef.com/${user.tenantId || "demo"}`
                      )
                    }
                    className="TopBar-btn login"
                  >
                    Carta
                  </button>
                  <Link
                    to="/perfil"
                    onClick={() => setMenuAbierto(false)}
                    className="TopBar-btn login"
                  >
                    Perfil
                  </Link>
                </>
              )}

              {user.role === "admin_restaurante" && (
                <>
                  <button
                    onClick={() => { setMenuAbierto(false); navigate("/dashboard"); }}
                    className="TopBar-btn login"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() =>
                      abrirEnNuevaPestana(
                        `http://tpv.local.softalef.com/tpv/login/${user.tenantId || "demo"}`
                      )
                    }
                    className="TopBar-btn login"
                  >
                    TPV
                  </button>
                  <button
                    onClick={() =>
                      abrirEnNuevaPestana(
                        `http://carta.local.softalef.com/${user.tenantId || "demo"}`
                      )
                    }
                    className="TopBar-btn login"
                  >
                    Carta
                  </button>
                  <Link
                    to="/perfil"
                    onClick={() => setMenuAbierto(false)}
                    className="TopBar-btn login"
                  >
                    Perfil
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

              {["camarero", "cocinero"].includes(user.role) && (
                <>
                  <button
                    onClick={() =>
                      abrirEnNuevaPestana(
                        `http://localhost:3002/tpv/login/${user.tenantId || "demo"}`
                      )
                    }
                    className="TopBar-btn login"
                  >
                    TPV
                  </button>

                  <button
                    onClick={() =>
                      abrirEnNuevaPestana(
                        `http://localhost:3001/${user.tenantId || "demo"}`
                      )
                    }
                    className="TopBar-btn login"
                  >
                    Carta
                  </button>

                  <button
                    onClick={() => {
                      setMenuAbierto(false);
                      navigate("/personalizar");
                    }}
                    className="TopBar-btn login"
                  >
                    Personalizar
                  </button>
                </>
              )}

              <button
                onClick={logout}
                className="TopBar-btn cta"
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
