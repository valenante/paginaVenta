import React from "react";
import "./SocialAuto.css";

export default function SocialAuto() {
  return (
    <section className="Social" id="social">
      <div className="Social-inner">
        <span className="Social-kicker">Incluido en tu suscripción, sin coste extra</span>
        <h2 className="Social-titulo">Herramientas adicionales que otros cobran aparte</h2>

        <div className="Social-grid">
          {/* Instagram */}
          <div className="Social-card">
            <div className="Social-card-header">
              <span className="Social-card-icon">📸</span>
              <span className="Social-card-badge">Instagram automático</span>
            </div>
            <h3 className="Social-card-title">Tu Instagram se mantiene activo sin que nadie toque el móvil</h3>
            <ul className="Social-card-list">
              <li>Genera posts con fotos de tu carta y textos profesionales</li>
              <li>Publica automáticamente según tu calendario</li>
              <li>Adapta el tono y estilo a tu marca</li>
            </ul>
            <a
              href="https://instagram.com/softalef"
              target="_blank"
              rel="noopener noreferrer"
              className="Social-card-link"
            >
              Ver ejemplo en @softalef &rarr;
            </a>
          </div>

          {/* Google Reviews */}
          <div className="Social-card">
            <div className="Social-card-header">
              <span className="Social-card-icon">⭐</span>
              <span className="Social-card-badge Social-card-badge--green">Reseñas de Google</span>
            </div>
            <h3 className="Social-card-title">Cada reseña respondida automáticamente con el tono adecuado</h3>
            <ul className="Social-card-list">
              <li>Respuestas personalizadas según la valoración del cliente</li>
              <li>Las reseñas negativas generan alerta inmediata</li>
              <li>Restaurantes con reseñas respondidas suben un 15% en visibilidad</li>
            </ul>
          </div>

          {/* Sugerencias carta */}
          <div className="Social-card">
            <div className="Social-card-header">
              <span className="Social-card-icon">🍽️</span>
              <span className="Social-card-badge Social-card-badge--blue">Carta inteligente</span>
            </div>
            <h3 className="Social-card-title">Tu carta QR recomienda platos basándose en lo que piden otros clientes</h3>
            <ul className="Social-card-list">
              <li>Sugerencias inteligentes durante el pedido</li>
              <li>Multiidioma automático para turistas</li>
              <li>Pedido directo a cocina sin camarero</li>
            </ul>
          </div>
        </div>

        <p className="Social-nota">
          Estas herramientas complementan la gestión diaria. No son la razón de compra — son la razón por la que no necesitas nada más.
        </p>
      </div>
    </section>
  );
}
