import React, { useState } from "react";
import TiemposCocina from "./TiemposCocina/TiemposCocina";
import DayReplay from "./DayReplay/DayReplay";
import AutomatizacionesPage from "./AutomatizacionesPage";
import GoogleReviewsPage from "./GoogleReviewsPage";
import SugerenciasConfigPage from "./SugerenciasConfigPage";
import AprendizajeIAPage from "./AprendizajeIAPage";
import FacturasAutomaticasPage from "./FacturasAutomaticasPage";
import InstagramPage from "./InstagramPage";
import "./OtrosPage.css";

const MODULES = [
  {
    key: "tiempos",
    label: "Tiempos cocina",
    description: "Configura tiempos, simulador, alertas y análisis del motor adaptativo.",
    component: TiemposCocina,
  },
  {
    key: "replay",
    label: "Replay del día",
    description: "Revive el servicio del día: pedidos, tiempos y flujo de cocina.",
    component: DayReplay,
  },
  {
    key: "automatizaciones",
    label: "Automatizaciones",
    description: "Pedidos a proveedores, alertas de margen, predicción de stock y más.",
    component: AutomatizacionesPage,
  },
  {
    key: "google-reviews",
    label: "Google Reviews",
    description: "Gestiona reseñas de Google Business con respuestas automáticas por IA.",
    component: GoogleReviewsPage,
  },
  {
    key: "sugerencias",
    label: "Sugerencias inteligentes",
    description: "Configura recomendaciones automáticas, reglas fijas y flujo de comida.",
    component: SugerenciasConfigPage,
  },
  {
    key: "aprendizaje-ia",
    label: "Aprendizaje IA",
    description: "Métricas del asistente IA en carta: scores de productos, propuestas y tendencias.",
    component: AprendizajeIAPage,
  },
  {
    key: "facturas-automaticas",
    label: "Facturas automáticas",
    description: "Lee facturas de tu email y las procesa automáticamente con IA.",
    component: FacturasAutomaticasPage,
  },
  {
    key: "instagram",
    label: "Instagram",
    description: "Publica automáticamente en Instagram con contenido generado por IA basado en tus datos.",
    component: InstagramPage,
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
          >Volver a Otros
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
