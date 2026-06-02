import { useState } from "react";
import { Link } from "react-router-dom";
import SEOHead from "../../components/SEO/SEOHead";
import {
  FAQStructuredData,
  ArticleStructuredData,
  BreadcrumbStructuredData,
} from "../../components/SEO/StructuredData";
import "./CartaQR.css";

/* ── FAQ data ── */
const faqs = [
  {
    q: "¿Necesito comprar hardware especial?",
    a: "No. La carta funciona en cualquier móvil con cámara y navegador. Tus clientes escanean el QR y acceden directamente, sin descargar ninguna aplicación.",
  },
  {
    q: "¿Cuánto se tarda en tener la carta funcionando?",
    a: "Un día. Subes tus productos, generas el QR y lo pones en la mesa. Si ya usas ALEF como TPV, la carta se alimenta de los mismos productos automáticamente.",
  },
  {
    q: "¿En qué idiomas funciona?",
    a: "Español, inglés y francés. El cliente ve la carta en su idioma automáticamente según la configuración de su móvil. Sin que tú tengas que traducir nada.",
  },
  {
    q: "¿Mis clientes tienen que descargar una app?",
    a: "No. Es una página web que se abre al escanear el QR. Funciona en cualquier iPhone o Android, sin instalar nada.",
  },
  {
    q: "¿El pedido llega directo a cocina?",
    a: "Sí. Cuando el cliente confirma su pedido desde el móvil, cocina lo recibe al instante en su pantalla. Sin camarero de por medio, sin errores de transcripción.",
  },
  {
    q: "¿Puedo usar solo la carta QR sin el resto de ALEF?",
    a: "La carta QR forma parte de ALEF. No se vende por separado porque su inteligencia depende de los datos del restaurante: ventas, stock, recetas, valoraciones. Eso es lo que la hace inteligente.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "Está incluida en ALEF. 129 euros al mes, todo incluido, sin permanencia. Cancelas cuando quieras.",
  },
  {
    q: "¿Qué pasa si se cae internet?",
    a: "Los pedidos que ya están en cocina siguen funcionando. Cuando vuelve la conexión, todo se sincroniza automáticamente.",
  },
];

export default function CartaQR() {
  const [faqOpen, setFaqOpen] = useState(null);

  return (
    <div className="FeaturePage">
      {/* ── SEO ── */}
      <SEOHead
        title="Carta QR inteligente para restaurantes con IA"
        description="Carta digital QR que aprende cómo piden tus clientes, sugiere platos con inteligencia artificial, se traduce sola a 3 idiomas y envía pedidos directo a cocina. Incluida en ALEF."
        path="/carta-qr-restaurante"
        type="article"
      />
      <ArticleStructuredData
        title="Carta QR inteligente para restaurantes — ALEF"
        description="Carta digital con inteligencia artificial integrada. Sugerencias personalizadas, analytics por plato, multiidioma automático y pedidos directos a cocina."
        path="/carta-qr-restaurante"
        datePublished="2026-06-02"
        dateModified="2026-06-02"
      />
      <FAQStructuredData
        faqs={faqs.map((f) => ({ question: f.q, answer: f.a }))}
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Inicio", path: "/" },
          { name: "Carta QR inteligente", path: "/carta-qr-restaurante" },
        ]}
      />

      {/* ══════════════════════════════════════
         HERO
         ══════════════════════════════════════ */}
      <section className="FP-hero">
        <div className="FP-hero-inner">
          <span className="FP-hero-badge">Incluida en ALEF</span>
          <h1>
            Tu carta no muestra platos.
            <br />
            Aprende cómo piden tus clientes.
          </h1>
          <p className="FP-hero-sub">
            Una carta QR con inteligencia artificial que sugiere platos,
            se traduce sola a tres idiomas, te dice qué funciona y qué no,
            y envía los pedidos directo a cocina. Sin apps. Sin papel. Sin errores.
          </p>
          <div className="FP-hero-ctas">
            <a href="https://softalef.com/#contacto" className="FP-btn FP-btn--primary">
              Solicitar demo
            </a>
            <a href="#como-funciona" className="FP-btn FP-btn--ghost">
              Ver cómo funciona
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
         PROBLEMA
         ══════════════════════════════════════ */}
      <section className="FP-section">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>Un QR con un PDF dentro no es una carta digital</h2>
            <p>
              El 90% de los restaurantes que dicen tener carta digital
              simplemente colgaron un PDF. Eso no vende más, no te da información
              y tus clientes siguen preguntando al camarero qué les recomienda.
            </p>
          </div>

          <div className="FP-pain-grid">
            <div className="FP-pain-card">
              <strong>No sabes qué miran</strong>
              <span>
                Un PDF no te dice qué platos abren, cuáles ignoran
                ni cuánto tardan en decidirse. Vendes a ciegas.
              </span>
            </div>
            <div className="FP-pain-card">
              <strong>Los turistas no entienden tu carta</strong>
              <span>
                Sin traducción, el cliente extranjero pide lo más seguro
                o directamente se va. Pierdes ticket medio cada día.
              </span>
            </div>
            <div className="FP-pain-card">
              <strong>El camarero repite lo mismo 50 veces</strong>
              <span>
                "¿Qué me recomiendas?" "¿Esto tiene gluten?" "¿Qué lleva?"
                Cada pregunta son 2-3 minutos de servicio perdido.
              </span>
            </div>
            <div className="FP-pain-card">
              <strong>Los errores cuestan dinero</strong>
              <span>
                Pedido mal apuntado, plato equivocado, alergia no comunicada.
                Un error en cocina puede costarte un cliente para siempre.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
         CÓMO FUNCIONA (flujo visual)
         ══════════════════════════════════════ */}
      <section className="FP-section FP-section--dark" id="como-funciona">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>Así funciona para tu cliente</h2>
            <p>Tres pasos. Menos de un minuto. Sin descargar nada.</p>
          </div>

          <div className="FP-flow">
            <div className="FP-flow-step">
              <div className="FP-flow-num">1</div>
              <strong>Escanea el QR</strong>
              <span>Abre la cámara, apunta al código de la mesa</span>
            </div>
            <div className="FP-flow-arrow">&#8594;</div>
            <div className="FP-flow-step">
              <div className="FP-flow-num">2</div>
              <strong>Elige con ayuda</strong>
              <span>Ve la carta en su idioma, pide sugerencias a la IA</span>
            </div>
            <div className="FP-flow-arrow">&#8594;</div>
            <div className="FP-flow-step">
              <div className="FP-flow-num">3</div>
              <strong>Cocina recibe</strong>
              <span>El pedido llega a cocina al instante, sin intermediarios</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
         4 FEATURES PRINCIPALES (claro)
         ══════════════════════════════════════ */}
      <section className="FP-section">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>Lo que hace la carta de ALEF que ninguna otra puede</h2>
          </div>

          <div className="FP-features">
            {/* F1: Sugerencias inteligentes */}
            <div className="FP-feature-card">
              <div className="FP-feature-icon">&#129504;</div>
              <h3>Sugiere platos porque aprende de tu restaurante</h3>
              <p>
                La carta no muestra lo mismo a todos. Observa cómo piden
                tus clientes, semana tras semana, y afina las sugerencias
                con datos reales de tu negocio. No son recomendaciones genéricas:
                son las de tu restaurante.
              </p>
              <ul>
                <li>Detecta combinaciones habituales ("con el pulpo suelen pedir vino blanco")</li>
                <li>Adapta las sugerencias a la hora: no recomienda lo mismo a las 13h que a las 21h</li>
                <li>Sabe cuántos platos pide cada tipo de grupo (parejas, familias, grupos)</li>
                <li>Cada restaurante tiene su propio perfil de aprendizaje, entrenado con sus datos</li>
              </ul>
            </div>

            {/* F2: Camarero IA */}
            <div className="FP-feature-card">
              <div className="FP-feature-icon">&#128172;</div>
              <h3>Un camarero virtual que habla 3 idiomas</h3>
              <p>
                Tu cliente abre un chat dentro de la carta y pregunta lo que quiera:
                "¿Qué me recomiendas para dos sin gluten?" La IA responde con
                platos reales de tu carta, en menos de un segundo, en su idioma.
              </p>
              <ul>
                <li>Responde en español, inglés y francés automáticamente</li>
                <li>Tiene en cuenta alergias, hora del día y hasta el clima</li>
                <li>Puede montar una propuesta completa para toda la mesa</li>
                <li>El cliente puede añadir platos al carrito directamente desde el chat</li>
              </ul>
            </div>

            {/* F3: Carrito sincronizado */}
            <div className="FP-feature-card">
              <div className="FP-feature-icon">&#128260;</div>
              <h3>El cliente elige, el camarero lo ve al instante</h3>
              <p>
                Tú decides cómo funciona. El cliente puede mandar el pedido
                directo a cocina desde su móvil, o simplemente ir añadiendo
                platos a su carrito mientras el camarero lo ve en tiempo real
                en su tablet y lo confirma cuando está listo.
              </p>
              <ul>
                <li>Modo directo: el cliente pide y cocina lo recibe sin intermediarios</li>
                <li>Modo asistido: el cliente monta el carrito, el camarero revisa y confirma</li>
                <li>El camarero puede ajustar cantidades o añadir notas antes de enviar</li>
                <li>Tú eliges qué modo usar según el estilo de tu restaurante</li>
              </ul>
            </div>

            {/* F4: Analytics */}
            <div className="FP-feature-card">
              <div className="FP-feature-icon">&#128200;</div>
              <h3>Analíticas que nunca has tenido</h3>
              <p>
                Por primera vez sabes qué platos miran tus clientes pero no piden.
                Qué categorías convierten más. Cuánto tardan en decidirse.
                Información que antes era imposible de obtener.
              </p>
              <ul>
                <li>Conversión real por plato: cuántos lo ven vs cuántos lo piden</li>
                <li>Ticket medio por franja horaria</li>
                <li>Desglose por idioma y por alérgenos filtrados</li>
                <li>Comparativa automática con la semana anterior</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
         COMPARATIVA (oscuro)
         ══════════════════════════════════════ */}
      <section className="FP-section FP-section--dark">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>ALEF vs otras cartas digitales</h2>
            <p>Comparativa honesta. Sin letra pequeña.</p>
          </div>

          <table className="FP-compare-table">
            <thead>
              <tr>
                <th></th>
                <th className="FP-compare-alef">ALEF</th>
                <th>Cartas QR gratuitas</th>
                <th>Cartas QR de pago</th>
                <th>PDF en papel</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Carta digital con QR</td>
                <td className="FP-compare-alef FP-check">Incluida</td>
                <td className="FP-check">Si</td>
                <td className="FP-check">Si</td>
                <td className="FP-cross">No</td>
              </tr>
              <tr>
                <td>Camarero virtual con IA</td>
                <td className="FP-compare-alef FP-check">Si</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">No</td>
              </tr>
              <tr>
                <td>Sugerencias personalizadas</td>
                <td className="FP-compare-alef FP-check">Con aprendizaje</td>
                <td className="FP-cross">No</td>
                <td className="FP-partial">Manuales</td>
                <td className="FP-cross">No</td>
              </tr>
              <tr>
                <td>Traducción automática</td>
                <td className="FP-compare-alef FP-check">3 idiomas</td>
                <td className="FP-partial">Manual</td>
                <td className="FP-partial">1-2 idiomas</td>
                <td className="FP-cross">No</td>
              </tr>
              <tr>
                <td>Analytics por plato</td>
                <td className="FP-compare-alef FP-check">Detallado</td>
                <td className="FP-cross">No</td>
                <td className="FP-partial">Básico</td>
                <td className="FP-cross">No</td>
              </tr>
              <tr>
                <td>Pedido directo a cocina</td>
                <td className="FP-compare-alef FP-check">Si</td>
                <td className="FP-cross">No</td>
                <td className="FP-partial">Algunos</td>
                <td className="FP-cross">No</td>
              </tr>
              <tr>
                <td>Carrito sincronizado con camarero</td>
                <td className="FP-compare-alef FP-check">Tiempo real</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">No</td>
              </tr>
              <tr>
                <td>Conectada con stock y costes</td>
                <td className="FP-compare-alef FP-check">Automático</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">No</td>
              </tr>
              <tr>
                <td>Valoraciones de clientes</td>
                <td className="FP-compare-alef FP-check">Integradas</td>
                <td className="FP-cross">No</td>
                <td className="FP-partial">Algunos</td>
                <td className="FP-cross">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ══════════════════════════════════════
         FAQ (claro)
         ══════════════════════════════════════ */}
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

      {/* ══════════════════════════════════════
         CTA FINAL
         ══════════════════════════════════════ */}
      <section className="FP-cta-section">
        <h2>¿Quieres ver tu carta funcionando con IA?</h2>
        <p>
          Te hacemos una demo de 10 minutos con datos de un restaurante real.
          Sin compromiso. Por WhatsApp, email o videollamada.
        </p>
        <div className="FP-hero-ctas">
          <a href="https://softalef.com/#contacto" className="FP-btn FP-btn--primary">
            Solicitar demo
          </a>
          <a
            href="https://wa.me/34623754328?text=Hola%2C%20quiero%20ver%20la%20carta%20QR%20de%20ALEF"
            target="_blank"
            rel="noopener noreferrer"
            className="FP-btn FP-btn--ghost"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </section>

      {/* ── Footer mínimo ── */}
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
