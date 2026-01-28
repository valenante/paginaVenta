import { Link } from "react-router-dom";
import logoAlef from "../../assets/imagenes/alef.png";
import "./Legal.css";

export default function LegalLayout({ title, children }) {
  return (
    <div className="legal-wrapper">
      <div className="legal-card">
        <header className="legal-header">
          <img src={logoAlef} alt="Alef TPV" className="legal-logo" />
          <h1>{title}</h1>
        </header>

        <div className="legal-content">
          {children}
        </div>

        <footer className="legal-footer">
          <Link to="/">Volver a Alef</Link>
        </footer>
      </div>
    </div>
  );
}