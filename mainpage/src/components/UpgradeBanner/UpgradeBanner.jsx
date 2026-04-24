import { useTenant } from "../../context/TenantContext";
import "./UpgradeBanner.css";

const DEFAULT_MSG = "Desbloquea esta funcionalidad con el plan Premium.";
const DEFAULT_CTA = "Me interesa";
const WA_NUMBER = "34623754328";
const WA_BASE = `https://wa.me/${WA_NUMBER}?text=`;

export default function UpgradeBanner({ title, message, cta, waText }) {
  const { tenant } = useTenant();
  const nombre = tenant?.nombre || tenant?.slug || "mi restaurante";

  const handleClick = () => {
    const text = waText
      ? waText.replace("{nombre}", nombre)
      : `Hola, soy de ${nombre}. Me interesa activar funcionalidades Premium en Alef.`;
    window.open(WA_BASE + encodeURIComponent(text), "_blank");
  };

  return (
    <div className="upgrade-banner">
      {title && <h4 className="upgrade-banner__title">{title}</h4>}
      <p className="upgrade-banner__msg">{message || DEFAULT_MSG}</p>
      <button className="upgrade-banner__btn" onClick={handleClick}>
        {cta || DEFAULT_CTA}
      </button>
    </div>
  );
}
