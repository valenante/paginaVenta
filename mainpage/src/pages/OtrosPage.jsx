import React, { useState } from "react";
import TiemposCocina from "./TiemposCocina/TiemposCocina";
import DayReplay from "./DayReplay/DayReplay";
import AutomatizacionesPage from "./AutomatizacionesPage";
import GoogleReviewsPage from "./GoogleReviewsPage";
import SugerenciasConfigPage from "./SugerenciasConfigPage";
import "./OtrosPage.css";

const MODULES = [
  {
    key: "tiempos",
    icon: "⏱️",
    label: "Tiempos cocina",
    description: "Configura tiempos, simulador, alertas y análisis del motor adaptativo.",
    component: TiemposCocina,
  },
  {
    key: "replay",
    icon: "🔄",
    label: "Replay del día",
    description: "Revive el servicio del día: pedidos, tiempos y flujo de cocina.",
    component: DayReplay,
  },
  {
    key: "automatizaciones",
    icon: "🤖",
    label: "Automatizaciones",
    description: "Pedidos a proveedores, alertas de margen, predicción de stock y más.",
    component: AutomatizacionesPage,
  },
  {
    key: "google-reviews",
    icon: "⭐",
    label: "Google Reviews",
    description: "Gestiona reseñas de Google Business con respuestas automáticas por IA.",
    component: GoogleReviewsPage,
  },
  {
    key: "sugerencias",
    icon: "💡",
    label: "Sugerencias inteligentes",
    description: "Configura recomendaciones automáticas, reglas fijas y flujo de comida.",
    component: SugerenciasConfigPage,
  },
];

export default function OtrosPage() {
  const [activeModule, setActiveModule] = useState(null);

  if (activeModule) {
    const mod = MODULES.find((m) => m.key === activeModule);
    if (mod?.component) {
      const Component = mod.component;
      return (
        <div>
          <button
            className="otros-back"
            onClick={() => setActiveModule(null)}
          >
            ← Volver a Otros
          </button>
          <Component />
        </div>
      );
    }
  }

  return (
    <div className="otros-root">
      <div className="otros-header">
        <h2>Otros módulos</h2>
        <p className="otros-subtitle">Herramientas avanzadas y configuración de automatizaciones.</p>
      </div>

      <div className="otros-grid">
        {MODULES.map((mod) => (
          <button
            key={mod.key}
            className={`otros-card ${!mod.component ? "otros-card--disabled" : ""}`}
            onClick={() => mod.component && setActiveModule(mod.key)}
            disabled={!mod.component}
          >
            <span className="otros-card__icon">{mod.icon}</span>
            <div className="otros-card__body">
              <span className="otros-card__label">{mod.label}</span>
              <span className="otros-card__desc">{mod.description}</span>
            </div>
            {!mod.component && <span className="otros-card__badge">Próximamente</span>}
            {mod.component && <span className="otros-card__arrow">→</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
