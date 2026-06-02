import { useState } from "react";
import { Link } from "react-router-dom";
import SEOHead from "../../components/SEO/SEOHead";
import {
  FAQStructuredData,
  ArticleStructuredData,
  BreadcrumbStructuredData,
} from "../../components/SEO/StructuredData";
import "./CartaQR.css";

const faqs = [
  {
    q: "¿Qué quiere decir que el restaurante piensa solo?",
    a: "Significa que ALEF vigila tu negocio las 24 horas: analiza ventas, detecta problemas de stock, responde reseñas de Google, publica en Instagram, protege tus márgenes y te avisa antes de que pase nada malo. Tú decides qué se hace solo y qué necesita tu aprobación.",
  },
  {
    q: "¿El copilot tiene acceso a mis datos reales?",
    a: "Sí. Cuando le preguntas algo, consulta tus datos reales: ventas, stock, costes, empleados, reservas, cocina. No inventa números ni da respuestas genéricas. Si no tiene datos suficientes, te lo dice.",
  },
  {
    q: "¿Puedo controlar qué se hace automáticamente y qué no?",
    a: "Todo es configurable. Para cada automatización puedes elegir entre modo automático (se ejecuta solo), modo supervisado (te propone y tú apruebas) o desactivado. Tú decides el nivel de control.",
  },
  {
    q: "¿Instagram publica sin que yo lo vea?",
    a: "Por defecto no. ALEF genera un borrador con texto e imagen, y tú lo revisas antes de publicar. Si lo prefieres, puedes activar la publicación automática para que salga sin tu intervención.",
  },
  {
    q: "¿Responde a las reseñas de Google automáticamente?",
    a: "Las reseñas positivas (4-5 estrellas) se responden automáticamente con un mensaje personalizado. Las negativas (1-2 estrellas) se guardan como borrador para que tú las revises antes de publicar. Las reseñas negativas también te llegan como notificación.",
  },
  {
    q: "¿Qué es el menu engineering automático?",
    a: "Cada semana ALEF analiza qué platos venden mucho y dan buen margen (estrellas), cuáles venden poco y dan poco margen (perros), y te sugiere acciones: destacar los buenos, eliminar los que no funcionan, promocionar los que tienen potencial.",
  },
  {
    q: "¿El copilot puede cambiar cosas de mi restaurante?",
    a: "Puede, pero siempre te pide confirmación antes. Si le dices 'sube el precio de las croquetas a 9 euros', te muestra exactamente qué va a cambiar y espera a que digas sí. Nada se modifica sin tu OK.",
  },
  {
    q: "¿Cuánto cuesta todo esto?",
    a: "Está incluido en ALEF. 129 euros al mes, todo incluido, sin permanencia. Autopilot, copilot, Instagram automático, Google Reviews, menu engineering — todo dentro del mismo plan.",
  },
];

export default function AutopilotIA() {
  const [faqOpen, setFaqOpen] = useState(null);

  return (
    <div className="FeaturePage">
      <SEOHead
        title="Automatización inteligente para restaurantes con IA"
        description="ALEF automatiza tu restaurante: copilot IA que responde con datos reales, Instagram automático, Google Reviews, menu engineering, alertas y pedidos a proveedor. Todo incluido desde 129€/mes."
        path="/automatizacion-restaurante"
        type="article"
      />
      <ArticleStructuredData
        title="Automatización inteligente para restaurantes — ALEF"
        description="Sistema de automatización con IA para restaurantes: copilot conversacional, Instagram automático, respuestas a Google Reviews, menu engineering y protección de márgenes."
        path="/automatizacion-restaurante"
        datePublished="2026-06-02"
        dateModified="2026-06-02"
      />
      <FAQStructuredData
        faqs={faqs.map((f) => ({ question: f.q, answer: f.a }))}
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Inicio", path: "/" },
          { name: "Automatización inteligente", path: "/automatizacion-restaurante" },
        ]}
      />

      {/* ── HERO (oscuro) ── */}
      <section className="FP-hero">
        <div className="FP-hero-inner">
          <span className="FP-hero-badge">Incluido en ALEF</span>
          <h1>
            Tu restaurante piensa solo.
            <br />
            Tú decides cuánto.
          </h1>
          <p className="FP-hero-sub">
            ALEF vigila tu negocio las 24 horas: analiza ventas, responde
            reseñas, publica en Instagram, protege tus márgenes y te avisa
            antes de que pase nada. Y si tienes una duda, le preguntas
            como si fuera tu socio.
          </p>
          <div className="FP-hero-ctas">
            <a href="https://softalef.com/#contacto" className="FP-btn FP-btn--primary">
              Solicitar demo
            </a>
            <a href="#que-automatiza" className="FP-btn FP-btn--ghost">
              Ver qué automatiza
            </a>
          </div>
        </div>
      </section>

      {/* ── PROBLEMA (claro) ── */}
      <section className="FP-section">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>No puedes estar pendiente de todo a la vez</h2>
            <p>
              Gestionar un restaurante es gestionar 20 cosas a la vez.
              Mientras atiendes mesas, se te acumula el stock, las reseñas
              sin responder, las redes sin publicar y los márgenes
              que bajan sin que nadie avise.
            </p>
          </div>

          <div className="FP-pain-grid">
            <div className="FP-pain-card">
              <strong>Reseñas sin responder</strong>
              <span>
                Un cliente deja una queja en Google y nadie la responde
                en días. Tu reputación baja mientras estás sirviendo mesas.
              </span>
            </div>
            <div className="FP-pain-card">
              <strong>Instagram abandonado</strong>
              <span>
                Sabes que deberías publicar, pero entre el servicio
                y la gestión no encuentras el momento. Semanas sin contenido.
              </span>
            </div>
            <div className="FP-pain-card">
              <strong>No sabes qué platos funcionan</strong>
              <span>
                ¿Cuál da más margen? ¿Cuál deberías quitar? ¿Cuál promocionar?
                Sin datos, decides por intuición.
              </span>
            </div>
            <div className="FP-pain-card">
              <strong>Los números los ves tarde</strong>
              <span>
                Te enteras de que fue mal mes cuando ya pasó.
                No tienes un resumen diario claro de cómo va el negocio.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUÉ AUTOMATIZA (oscuro) ── */}
      <section className="FP-section FP-section--dark" id="que-automatiza">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>Todo esto ocurre sin que tú hagas nada</h2>
            <p>Cada día, mientras tú te centras en lo que importa.</p>
          </div>

          <div className="FP-features">
            <div className="FP-feature-card" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(148,163,184,0.15)" }}>
              <div className="FP-feature-icon">&#128241;</div>
              <h3 style={{ color: "#fff" }}>Instagram se publica solo</h3>
              <p style={{ color: "rgba(226,232,240,0.75)" }}>
                ALEF genera posts con fotos de tus platos y textos
                adaptados al tono de tu restaurante. Tú lo revisas y apruebas,
                o dejas que se publique automáticamente.
              </p>
              <ul>
                <li style={{ color: "rgba(226,232,240,0.7)" }}>Elige qué publicar según tus platos más vendidos</li>
                <li style={{ color: "rgba(226,232,240,0.7)" }}>Programa horario de publicación</li>
                <li style={{ color: "rgba(226,232,240,0.7)" }}>Usa las fotos de tu galería, no genéricas</li>
              </ul>
            </div>

            <div className="FP-feature-card" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(148,163,184,0.15)" }}>
              <div className="FP-feature-icon">&#11088;</div>
              <h3 style={{ color: "#fff" }}>Google Reviews se responden solas</h3>
              <p style={{ color: "rgba(226,232,240,0.75)" }}>
                Cada reseña nueva se responde automáticamente con un
                mensaje personalizado. Las negativas te llegan como
                notificación para que las revises antes de publicar.
              </p>
              <ul>
                <li style={{ color: "rgba(226,232,240,0.7)" }}>Reseñas positivas: respuesta automática y cálida</li>
                <li style={{ color: "rgba(226,232,240,0.7)" }}>Reseñas negativas: borrador pendiente de tu aprobación</li>
                <li style={{ color: "rgba(226,232,240,0.7)" }}>Alerta inmediata si recibes 1-2 estrellas</li>
              </ul>
            </div>

            <div className="FP-feature-card" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(148,163,184,0.15)" }}>
              <div className="FP-feature-icon">&#127775;</div>
              <h3 style={{ color: "#fff" }}>Tu carta se optimiza cada semana</h3>
              <p style={{ color: "rgba(226,232,240,0.75)" }}>
                Cada domingo, ALEF analiza qué platos venden bien y dan
                buen margen, cuáles no funcionan, y cuáles tienen
                potencial. Destaca las estrellas automáticamente y te
                propone eliminar lo que no rinde.
              </p>
              <ul>
                <li style={{ color: "rgba(226,232,240,0.7)" }}>Marca automáticamente los platos estrella en tu carta</li>
                <li style={{ color: "rgba(226,232,240,0.7)" }}>Te propone quitar los que no venden ni dan margen</li>
                <li style={{ color: "rgba(226,232,240,0.7)" }}>Análisis basado en ventas reales de las últimas 4 semanas</li>
              </ul>
            </div>

            <div className="FP-feature-card" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(148,163,184,0.15)" }}>
              <div className="FP-feature-icon">&#128232;</div>
              <h3 style={{ color: "#fff" }}>Resúmenes que llegan solos</h3>
              <p style={{ color: "rgba(226,232,240,0.75)" }}>
                Cada noche recibes un email con lo que pasó hoy:
                ventas, ticket medio, comensales, plato estrella del día.
                Cada lunes, un análisis semanal con comparativa.
                Sin buscar nada, sin abrir ningún panel.
              </p>
              <ul>
                <li style={{ color: "rgba(226,232,240,0.7)" }}>Resumen diario automático por email</li>
                <li style={{ color: "rgba(226,232,240,0.7)" }}>Análisis semanal con comparativa y tendencias</li>
                <li style={{ color: "rgba(226,232,240,0.7)" }}>Alertas solo cuando algo necesita tu atención</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── COPILOT (claro) ── */}
      <section className="FP-section">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>Pregúntale lo que quieras. Tiene tus datos.</h2>
            <p>
              El copilot de ALEF no es un chatbot genérico.
              Tiene acceso a todas las ventas, costes, stock, reservas
              y empleados de tu restaurante. Pregúntale como
              le preguntarías a un socio que lo sabe todo.
            </p>
          </div>

          <div className="FP-pain-grid">
            <div className="FP-pain-card" style={{ borderLeftColor: "var(--color-primario)" }}>
              <strong>"¿Por qué vendí menos esta semana?"</strong>
              <span>
                Compara con la semana anterior, cruza con el clima,
                revisa las reservas y te dice exactamente qué pasó.
              </span>
            </div>
            <div className="FP-pain-card" style={{ borderLeftColor: "var(--color-primario)" }}>
              <strong>"¿Qué plato me da más margen?"</strong>
              <span>
                Te da el ranking completo: unidades vendidas, coste real,
                margen por plato. Con datos de las últimas 4 semanas.
              </span>
            </div>
            <div className="FP-pain-card" style={{ borderLeftColor: "var(--color-primario)" }}>
              <strong>"Sube las croquetas a 9 euros"</strong>
              <span>
                Te muestra el impacto en el margen, te pide
                confirmación y lo aplica al instante. Todo en una frase.
              </span>
            </div>
            <div className="FP-pain-card" style={{ borderLeftColor: "var(--color-primario)" }}>
              <strong>"¿Cuántos comensales espero el viernes?"</strong>
              <span>
                Mira el histórico de los últimos viernes, las reservas
                confirmadas y te da una estimación con nivel de confianza.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARATIVA (oscuro) ── */}
      <section className="FP-section FP-section--dark">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>ALEF vs gestionar todo tú solo</h2>
            <p>Comparativa honesta. Sin letra pequeña.</p>
          </div>

          <table className="FP-compare-table">
            <thead>
              <tr>
                <th></th>
                <th className="FP-compare-alef">ALEF</th>
                <th>Otros TPVs</th>
                <th>A mano</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Copilot IA con datos reales</td>
                <td className="FP-compare-alef FP-check">30+ consultas</td>
                <td className="FP-cross">No existe</td>
                <td className="FP-cross">No existe</td>
              </tr>
              <tr>
                <td>Instagram automático</td>
                <td className="FP-compare-alef FP-check">Genera y publica</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">Tú cada día</td>
              </tr>
              <tr>
                <td>Respuesta a reseñas Google</td>
                <td className="FP-compare-alef FP-check">Automático</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">Tú a mano</td>
              </tr>
              <tr>
                <td>Menu engineering</td>
                <td className="FP-compare-alef FP-check">Semanal automático</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">Imposible</td>
              </tr>
              <tr>
                <td>Protección de márgenes</td>
                <td className="FP-compare-alef FP-check">Automática</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">Semanas después</td>
              </tr>
              <tr>
                <td>Resumen diario del negocio</td>
                <td className="FP-compare-alef FP-check">Email automático</td>
                <td className="FP-partial">Dashboard manual</td>
                <td className="FP-cross">Cuaderno</td>
              </tr>
              <tr>
                <td>Productos agotados en carta</td>
                <td className="FP-compare-alef FP-check">Se ocultan solos</td>
                <td className="FP-partial">Manual</td>
                <td className="FP-cross">El cliente se entera</td>
              </tr>
              <tr>
                <td>Nivel de automatización</td>
                <td className="FP-compare-alef FP-check">Configurable</td>
                <td className="FP-cross">No aplica</td>
                <td className="FP-cross">Todo manual</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FAQ (claro) ── */}
      <section className="FP-section">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>Preguntas frecuentes</h2>
          </div>

          <div className="FP-faq-list">
            {faqs.map((f, i) => (
              <div className={`FP-faq-item ${faqOpen === i ? "FP-faq-item--open" : ""}`} key={i}>
                <button
                  className="FP-faq-q"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  <span>{f.q}</span>
                  <span className="FP-faq-arrow">{faqOpen === i ? "−" : "+"}</span>
                </button>
                {faqOpen === i && <div className="FP-faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA (oscuro) ── */}
      <section className="FP-cta-section">
        <h2>¿Quieres ver cómo piensa tu restaurante solo?</h2>
        <p>
          Te hacemos una demo de 10 minutos con datos de un restaurante real.
          Sin compromiso. Por WhatsApp, email o videollamada.
        </p>
        <div className="FP-hero-ctas">
          <a href="https://softalef.com/#contacto" className="FP-btn FP-btn--primary">
            Solicitar demo
          </a>
          <a
            href="https://wa.me/34623754328?text=Hola%2C%20quiero%20ver%20el%20autopilot%20de%20ALEF"
            target="_blank"
            rel="noopener noreferrer"
            className="FP-btn FP-btn--ghost"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </section>

      <footer style={{ textAlign: "center", padding: "2rem", background: "#050815", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
        <Link to="/" style={{ color: "var(--color-primario)", textDecoration: "none", fontWeight: 600 }}>
          Volver a ALEF
        </Link>
        <span style={{ margin: "0 1rem" }}>·</span>
        <span>&copy; {new Date().getFullYear()} ALEF</span>
      </footer>
    </div>
  );
}
