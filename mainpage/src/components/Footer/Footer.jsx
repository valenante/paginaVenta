import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="Footer">
      <div className="Footer-inner">
        <div className="Footer-brand">
          <strong>Alef TPV</strong>
          <p>
            Plataforma web para restaurantes y tiendas.
            TPV, carta digital, facturación y gestión en un solo sistema.
          </p>
        </div>

        <nav className="Footer-links">
          <Link to="/aviso-legal">Aviso legal</Link>
          <Link to="/privacidad">Privacidad</Link>
          <Link to="/cookies">Cookies</Link>
        </nav>
      </div>

      <div className="Footer-bottom">
        © {new Date().getFullYear()} Alef TPV · Todos los derechos reservados
      </div>
    </footer>
  );
}
