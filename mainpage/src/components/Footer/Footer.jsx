import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="Footer">
      <div className="Footer-inner">
        <div className="Footer-brand">
          <strong>Alef</strong>
          <p>
            Gestion inteligente para restaurantes.
            Automatizacion, IA, carta digital, cocina coordinada y facturacion — en un solo sistema.
          </p>
        </div>

        <nav className="Footer-links">
          <Link to="/terminos">Condiciones</Link>
          <Link to="/privacidad">Privacidad</Link>
          <Link to="/dpa">DPA</Link>
          <Link to="/subencargados">Subencargados</Link>
          <Link to="/aviso-legal">Aviso legal</Link>
          <Link to="/cookies">Cookies</Link>
        </nav>
      </div>

      <div className="Footer-bottom">
        © {new Date().getFullYear()} Alef · Todos los derechos reservados
      </div>
    </footer>
  );
}
