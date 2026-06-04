import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="Footer">
      <div className="Footer-inner">
        <div className="Footer-brand">
          <strong>Alef</strong>
          <p>
            Gestión integral para restaurantes. Costes, stock, cocina, carta, reservas,
            facturación y VeriFactu. Todo en un solo sistema.
          </p>
          <a href="https://instagram.com/softalef" target="_blank" rel="noopener noreferrer" className="Footer-social">
            📸 @softalef
          </a>
        </div>

        <nav className="Footer-links">
          <span className="Footer-links-title">Producto</span>
          <Link to="/carta-qr-restaurante">Carta QR inteligente</Link>
          <Link to="/facturacion-automatica-restaurante">Facturación automática</Link>
          <Link to="/stock-predictivo-restaurante">Stock predictivo</Link>
          <Link to="/automatizacion-restaurante">Automatización con IA</Link>
          <Link to="/verifactu">Guía VeriFactu</Link>
        </nav>

        <nav className="Footer-links">
          <span className="Footer-links-title">Legal</span>
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
