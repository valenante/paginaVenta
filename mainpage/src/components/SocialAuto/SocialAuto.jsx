import React from "react";
import "./SocialAuto.css";

export default function SocialAuto() {
  return (
    <section className="Social" id="social">
      <div className="Social-inner">
        <span className="Social-kicker">Vale 300–700€/mes. Incluido en Alef.</span>
        <h2 className="Social-titulo">Tu Instagram y tus reseñas de Google, en piloto automático</h2>

        <div className="Social-grid">
          {/* Instagram */}
          <div className="Social-card">
            <div className="Social-card-header">
              <span className="Social-card-icon">📸</span>
              <span className="Social-card-badge">Auto Instagram</span>
            </div>
            <h3 className="Social-card-title">Publica contenido profesional sin community manager</h3>
            <ul className="Social-card-list">
              <li>Alef genera posts con fotos de tus platos y copy profesional</li>
              <li>Publica automaticamente segun tu calendario</li>
              <li>Adapta el tono y estilo a tu marca</li>
              <li>Un community manager cobra 300–700€/mes por esto</li>
            </ul>
            <a
              href="https://instagram.com/softalef"
              target="_blank"
              rel="noopener noreferrer"
              className="Social-card-link"
            >
              Sigue a @softalef en Instagram &rarr;
            </a>
          </div>

          {/* Google Reviews */}
          <div className="Social-card">
            <div className="Social-card-header">
              <span className="Social-card-icon">⭐</span>
              <span className="Social-card-badge Social-card-badge--green">Google Reviews IA</span>
            </div>
            <h3 className="Social-card-title">Cada reseña respondida. Con personalidad. Sin esfuerzo.</h3>
            <ul className="Social-card-list">
              <li>La IA lee la reseña y genera una respuesta personalizada</li>
              <li>Respeta el tono y personalidad de tu restaurante</li>
              <li>Reseñas negativas generan alerta inmediata al dueño</li>
              <li>Restaurantes con reseñas respondidas suben un 15% en visibilidad</li>
            </ul>
          </div>
        </div>

        <a href="#contacto" className="btn btn-primario Social-cta">
          Quiero que mi restaurante se gestione solo
        </a>
      </div>
    </section>
  );
}
