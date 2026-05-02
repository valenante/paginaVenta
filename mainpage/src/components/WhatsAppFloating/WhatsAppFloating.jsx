import React from "react";
import { trackEvent } from "../../utils/trackEvent";
import "./WhatsAppFloating.css";

const WHATSAPP_NUMBER = "34623754328";

export default function WhatsAppFloating() {
  const msg =
    "Hola Alef! Quiero una demo rápida de 10 min. Mi negocio es: ";

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

  return (
    <a
      className="wa-float"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Hablar por WhatsApp"
      title="Hablar por WhatsApp"
      onClick={() => trackEvent("click_whatsapp", { location: "floating" })}
    >
      <span className="wa-float-icon" aria-hidden="true">💬</span>
      <span className="wa-float-text">WhatsApp</span>
    </a>
  );
}