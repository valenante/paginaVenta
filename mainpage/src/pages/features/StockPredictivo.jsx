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
    q: "¿Cómo sabe ALEF cuánto voy a necesitar?",
    a: "Analiza tus ventas de las últimas 12 semanas, día por día. Sabe que un viernes vendes más que un martes, y que si tienes 8 reservas para el jueves, necesitarás más producto. Cuantas más semanas uses ALEF, más precisa es la predicción.",
  },
  {
    q: "¿Y si un día tengo un evento especial o más gente de lo normal?",
    a: "Las reservas confirmadas se integran automáticamente en la predicción. Si tienes un grupo de 20 personas el sábado, ALEF ajusta la previsión de stock para ese día.",
  },
  {
    q: "¿Los pedidos se mandan solos al proveedor?",
    a: "Tú eliges. Puedes usar el modo semiautomático, donde ALEF genera los pedidos como borradores y tú los revisas antes de enviar. O el modo automático, donde ALEF los envía directamente al proveedor por email.",
  },
  {
    q: "¿Qué pasa si un proveedor me sube un precio?",
    a: "ALEF lo detecta automáticamente cuando procesa la siguiente factura. Te avisa al instante, te dice qué platos de tu carta pierden margen, y te sugiere un nuevo precio de venta para mantener tu rentabilidad.",
  },
  {
    q: "¿Funciona con todos los proveedores?",
    a: "Sí. Cada proveedor se configura con su plazo de entrega, sus productos y sus precios. ALEF tiene en cuenta esos plazos para pedirte con suficiente antelación.",
  },
  {
    q: "¿Puedo seguir haciendo pedidos a mano si quiero?",
    a: "Por supuesto. ALEF es una herramienta, no una obligación. Puedes usarlo solo como sugerencia, o dejar que lo haga todo él. Tú decides el nivel de automatización.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "Está incluido en ALEF. 129 euros al mes, todo incluido, sin permanencia. Stock predictivo, pedidos automáticos, alertas de margen — todo dentro del mismo plan.",
  },
];

export default function StockPredictivo() {
  const [faqOpen, setFaqOpen] = useState(null);

  return (
    <div className="FeaturePage">
      <SEOHead
        title="Stock predictivo para restaurantes — pedidos automáticos a proveedor"
        description="ALEF predice cuánto stock necesitas cada día, genera pedidos a proveedor antes de que te falte producto y te avisa si suben los precios. Incluido desde 129€/mes."
        path="/stock-predictivo-restaurante"
        type="article"
      />
      <ArticleStructuredData
        title="Stock predictivo para restaurantes — ALEF"
        description="Sistema de stock predictivo que analiza ventas, reservas y consumo para predecir necesidades, generar pedidos automáticos a proveedor y proteger márgenes."
        path="/stock-predictivo-restaurante"
        datePublished="2026-06-02"
        dateModified="2026-06-02"
      />
      <FAQStructuredData
        faqs={faqs.map((f) => ({ question: f.q, answer: f.a }))}
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Inicio", path: "/" },
          { name: "Stock predictivo", path: "/stock-predictivo-restaurante" },
        ]}
      />

      {/* ── HERO (oscuro) ── */}
      <section className="FP-hero">
        <div className="FP-hero-inner">
          <span className="FP-hero-badge">Incluido en ALEF</span>
          <h1>
            Tu restaurante nunca se queda
            <br />
            sin producto. Nunca.
          </h1>
          <p className="FP-hero-sub">
            ALEF analiza tus ventas día a día, predice cuánto vas a necesitar
            esta semana y genera los pedidos a tus proveedores antes de que
            te falte nada. Si alguien te sube un precio, te enteras al instante.
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

      {/* ── PROBLEMA (claro) ── */}
      <section className="FP-section">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>Quedarte sin producto en mitad del servicio es inaceptable</h2>
            <p>
              Pero pasa. Pasa porque el stock se lleva en la cabeza, en un
              cuaderno, o en un Excel que nadie actualiza. Y cuando pasa,
              pierdes ventas, pierdes clientes y pierdes credibilidad.
            </p>
          </div>

          <div className="FP-pain-grid">
            <div className="FP-pain-card">
              <strong>Pides de más o de menos</strong>
              <span>
                Sin datos reales, pides por intuición. Unas semanas sobra
                producto y se tira, otras falta y hay que improvisar.
              </span>
            </div>
            <div className="FP-pain-card">
              <strong>No sabes cuándo pedir</strong>
              <span>
                Cada proveedor tiene un plazo de entrega distinto. Si no
                lo tienes en cuenta, el pedido llega tarde o demasiado pronto.
              </span>
            </div>
            <div className="FP-pain-card">
              <strong>Te suben precios y no te enteras</strong>
              <span>
                El proveedor sube un ingrediente un 15% y tú sigues vendiendo
                al mismo precio. Tu margen desaparece sin que lo notes.
              </span>
            </div>
            <div className="FP-pain-card">
              <strong>Llamar proveedor por proveedor</strong>
              <span>
                Cada mañana, repasar qué falta, llamar a tres o cuatro
                proveedores, dictar cantidades por teléfono. Media hora mínimo.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA (oscuro) ── */}
      <section className="FP-section FP-section--dark" id="como-funciona">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>ALEF hace el trabajo por ti cada mañana</h2>
            <p>Antes de que abras, ya sabe qué necesitas y a quién pedirlo.</p>
          </div>

          <div className="FP-flow">
            <div className="FP-flow-step">
              <div className="FP-flow-num">1</div>
              <strong>Analiza</strong>
              <span>12 semanas de ventas + reservas + día de la semana</span>
            </div>
            <div className="FP-flow-arrow">&#8594;</div>
            <div className="FP-flow-step">
              <div className="FP-flow-num">2</div>
              <strong>Predice</strong>
              <span>Cuánto necesitas de cada ingrediente los próximos 7 días</span>
            </div>
            <div className="FP-flow-arrow">&#8594;</div>
            <div className="FP-flow-step">
              <div className="FP-flow-num">3</div>
              <strong>Avisa</strong>
              <span>Te alerta si algo se va a agotar antes de que llegue el pedido</span>
            </div>
            <div className="FP-flow-arrow">&#8594;</div>
            <div className="FP-flow-step">
              <div className="FP-flow-num">4</div>
              <strong>Pide</strong>
              <span>Genera el pedido al proveedor, tú revisas o se envía solo</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES (claro) ── */}
      <section className="FP-section">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>Stock inteligente, no stock a ojo</h2>
          </div>

          <div className="FP-features">
            <div className="FP-feature-card">
              <div className="FP-feature-icon">&#128202;</div>
              <h3>Predicción real basada en tu negocio</h3>
              <p>
                ALEF no usa promedios simples. Analiza tus ventas por día
                de la semana, da más peso a las semanas recientes, y cruza
                los datos con las reservas confirmadas. Cada viernes
                no es igual que cada martes, y el sistema lo sabe.
              </p>
              <ul>
                <li>12 semanas de histórico ponderado: lo reciente pesa más</li>
                <li>Predicción a 7 días vista, día por día</li>
                <li>Integra reservas confirmadas automáticamente</li>
                <li>Cuantas más semanas lo usas, más preciso se vuelve</li>
              </ul>
            </div>

            <div className="FP-feature-card">
              <div className="FP-feature-icon">&#128230;</div>
              <h3>Pedidos automáticos a proveedor</h3>
              <p>
                Cuando un ingrediente baja del mínimo, ALEF calcula cuánto
                pedir teniendo en cuenta el plazo de entrega del proveedor,
                el consumo previsto para los próximos días, y un margen
                de seguridad. Tú decides si lo revisas antes o se envía solo.
              </p>
              <ul>
                <li>Modo semiautomático: genera borradores para que los revises</li>
                <li>Modo automático: envía el pedido al proveedor directamente</li>
                <li>Tiene en cuenta el plazo de entrega de cada proveedor</li>
                <li>Agrupa los pedidos por proveedor para no mandar 10 emails</li>
              </ul>
            </div>

            <div className="FP-feature-card">
              <div className="FP-feature-icon">&#128176;</div>
              <h3>Protección de márgenes automática</h3>
              <p>
                Si un proveedor sube el precio de un ingrediente, ALEF te
                avisa al instante. Te dice exactamente qué platos de tu carta
                pierden rentabilidad y te sugiere un precio nuevo para mantener
                tu margen. Con un toque, lo aplicas.
              </p>
              <ul>
                <li>Detecta cambios de precio en las últimas 48 horas</li>
                <li>Calcula el impacto en cada plato que usa ese ingrediente</li>
                <li>Sugiere precio de venta con redondeo inteligente (ej: 12,90€)</li>
                <li>Alerta inmediata si algún plato se vende por debajo de coste</li>
              </ul>
            </div>

            <div className="FP-feature-card">
              <div className="FP-feature-icon">&#128203;</div>
              <h3>Alertas antes de que pase nada</h3>
              <p>
                Cada mañana recibes un resumen claro: qué ingredientes bajan,
                cuáles se agotan esta semana, cuáles no llegarán a tiempo
                aunque pidas hoy. Tres niveles de urgencia para que actúes
                sobre lo importante primero.
              </p>
              <ul>
                <li>Alerta crítica: se agota antes de que llegue el proveedor</li>
                <li>Alerta alta: stock por debajo del mínimo</li>
                <li>Alerta media: bajando, pero aún hay margen</li>
                <li>Resumen por email cada mañana entre las 8 y las 11</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARATIVA (oscuro) ── */}
      <section className="FP-section FP-section--dark">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>ALEF vs control de stock tradicional</h2>
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
                <td>Predicción de demanda</td>
                <td className="FP-compare-alef FP-check">7 días, por DOW</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">Intuición</td>
              </tr>
              <tr>
                <td>Pedidos automáticos a proveedor</td>
                <td className="FP-compare-alef FP-check">Semi o auto</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">Llamar 1 a 1</td>
              </tr>
              <tr>
                <td>Umbrales de stock</td>
                <td className="FP-compare-alef FP-check">Calculados por IA</td>
                <td className="FP-partial">Manuales</td>
                <td className="FP-cross">No hay</td>
              </tr>
              <tr>
                <td>Alerta de ruptura anticipada</td>
                <td className="FP-compare-alef FP-check">7 días vista</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">Cuando ya falta</td>
              </tr>
              <tr>
                <td>Lead time de proveedor</td>
                <td className="FP-compare-alef FP-check">Integrado</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">De memoria</td>
              </tr>
              <tr>
                <td>Protección de márgenes</td>
                <td className="FP-compare-alef FP-check">Automática</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">Imposible</td>
              </tr>
              <tr>
                <td>Trazabilidad de movimientos</td>
                <td className="FP-compare-alef FP-check">Completa</td>
                <td className="FP-partial">Básica</td>
                <td className="FP-cross">Cuaderno</td>
              </tr>
              <tr>
                <td>Tiempo diario</td>
                <td className="FP-compare-alef FP-check">0 minutos</td>
                <td className="FP-partial">15-30 min</td>
                <td className="FP-cross">30-60 min</td>
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
        <h2>¿Quieres que tu stock se gestione solo?</h2>
        <p>
          Te hacemos una demo de 10 minutos con datos de un restaurante real.
          Sin compromiso. Por WhatsApp, email o videollamada.
        </p>
        <div className="FP-hero-ctas">
          <a href="https://softalef.com/#contacto" className="FP-btn FP-btn--primary">
            Solicitar demo
          </a>
          <a
            href="https://wa.me/34623754328?text=Hola%2C%20quiero%20ver%20el%20stock%20predictivo%20de%20ALEF"
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
