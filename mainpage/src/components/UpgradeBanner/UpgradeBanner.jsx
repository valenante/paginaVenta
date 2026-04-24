import "./UpgradeBanner.css";

const DEFAULT_MSG = "Desbloquea esta funcionalidad con el plan Premium.";
const DEFAULT_CTA = "Me interesa";
const WA_BASE = "https://wa.me/34624163497?text=";

export default function UpgradeBanner({ title, message, cta, waText }) {
  const handleClick = () => {
    const text = waText || "Hola, me interesa activar funcionalidades Premium en Alef.";
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
