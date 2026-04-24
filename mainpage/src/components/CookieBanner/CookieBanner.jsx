import { useEffect, useState } from "react";
import "./CookieBanner.css";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("alef_cookies_ok");
    if (!accepted) setVisible(true);
  }, []);

  /** Accept only necessary cookies (no analytics). */
  const handleNecessaryOnly = () => {
    localStorage.setItem("alef_cookies_ok", "true");
    localStorage.setItem("alef_cookies_analytics", "false");
    setVisible(false);
  };

  /** Accept all cookies including analytics (GA4). */
  const handleAcceptAll = () => {
    localStorage.setItem("alef_cookies_ok", "true");
    localStorage.setItem("alef_cookies_analytics", "true");
    window.dispatchEvent(new Event("alef:cookies-analytics"));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="alef-cookie">
      <div className="alef-cookie__content">
        <p className="alef-cookie__text">
          Usamos <strong>cookies técnicas necesarias</strong> para el
          funcionamiento del sistema y <strong>cookies analíticas</strong>{" "}
          (Google Analytics) para mejorar la experiencia.
          <a href="/cookies" className="alef-cookie__link">
            Más información
          </a>
        </p>

        <div className="alef-cookie__buttons">
          <button
            className="alef-cookie__button alef-cookie__button--secondary"
            onClick={handleNecessaryOnly}
            aria-label="Solo cookies necesarias"
          >
            Solo necesarias
          </button>
          <button
            className="alef-cookie__button"
            onClick={handleAcceptAll}
            aria-label="Aceptar todas las cookies"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
