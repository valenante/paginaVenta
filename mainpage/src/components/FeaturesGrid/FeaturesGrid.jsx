import React from "react";
import "./FeaturesGrid.css";

const modulos = [
  { icono: "🍽️", titulo: "Sugerencias inteligentes", desc: "Motor de 7 señales que recomienda upselling automático al cliente en carta y TPV" },
  { icono: "📱", titulo: "Carta digital QR", desc: "3 idiomas, pedidos directos, análisis de qué miran y qué ignoran tus clientes" },
  { icono: "🤖", titulo: "Camarero IA en carta", desc: "Guía al cliente por la carta, responde preguntas de alérgenos y sugiere platos" },
  { icono: "✅", titulo: "Facturación VeriFactu", desc: "Facturas certificadas con hash antifraude. Obligatorio desde julio 2027" },
  { icono: "🗣️", titulo: "Cocina coordinada con voz", desc: "Comandas por voz en horas de máximo ritmo. Anuncios automáticos en cocina" },
  { icono: "💳", titulo: "Programa de fidelidad", desc: "Puntos, recompensas, multiplicadores y comunicación automática con tus clientes" },
  { icono: "👥", titulo: "Turnos y horarios", desc: "Planificación semanal de personal con detección de conflictos automática" },
  { icono: "📅", titulo: "Reservas inteligentes", desc: "Confirmación automática, gestión de no-shows, recordatorio 24h al cliente" },
  { icono: "📈", titulo: "Estadísticas avanzadas", desc: "Hora punta, productos estrella, tendencias mensuales, matriz BCG automática" },
  { icono: "🔔", titulo: "Alertas proactivas", desc: "Margen erosionado, stock bajo, viernes flojos, facturas vencidas — antes de que lo notes" },
];

export default function FeaturesGrid() {
  return (
    <section className="FGrid" id="mas-funciones">
      <div className="FGrid-inner">
        <span className="FGrid-kicker">Y esto es solo el principio</span>
        <h2 className="FGrid-titulo">39 módulos. 25 automatizaciones. Un solo sistema.</h2>
        <p className="FGrid-sub">Todo lo que un restaurante necesita para funcionar, crecer y cumplir la ley.</p>

        <div className="FGrid-grid">
          {modulos.map((m, i) => (
            <div key={i} className="FGrid-card">
              <span className="FGrid-card-icon">{m.icono}</span>
              <div>
                <h3 className="FGrid-card-title">{m.titulo}</h3>
                <p className="FGrid-card-desc">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
