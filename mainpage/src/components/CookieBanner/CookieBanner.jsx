import { useEffect, useState } from "react";
import "./CookieBanner.css";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("alef_cookies_ok");
    if (!accepted) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("alef_cookies_ok", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="alef-cookie">
      <div className="alef-cookie__content">
        <p className="alef-cookie__text">
          Utilizamos únicamente <strong>cookies técnicas necesarias</strong> para
          el funcionamiento del sistema.  
          No usamos cookies analíticas ni publicitarias.
          <a href="/cookies" className="alef-cookie__link">
            Más información
          </a>
        </p>

        <button
          className="alef-cookie__button"
          onClick={handleAccept}
          aria-label="Aceptar cookies"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
