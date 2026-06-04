import { useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../../components/TopBar/TopBar";
import Footer from "../../components/Footer/Footer";
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
    q: "¿Cómo recibe ALEF las facturas de mis proveedores?",
    a: "Conectas tu Gmail en un clic. A partir de ahí, ALEF revisa tu bandeja cada 15 minutos y detecta automáticamente los emails con facturas o albaranes adjuntos. Si recibes un albarán en mano, le sacas foto con el móvil y el sistema lo procesa igual.",
  },
  {
    q: "¿Qué pasa si la factura viene en papel?",
    a: "Le sacas una foto con tu móvil desde la app. La inteligencia artificial lee el documento, extrae los productos, cantidades y precios, y te lo presenta para que lo confirmes con un toque.",
  },
  {
    q: "¿Actualiza el stock automáticamente?",
    a: "Sí. Cuando se aprueba una factura, el stock de cada ingrediente se actualiza al instante. Si compraste 10 kilos de pollo, tu inventario sube 10 kilos sin que tú hagas nada.",
  },
  {
    q: "¿Y si un proveedor me sube el precio?",
    a: "ALEF lo detecta automáticamente. Te avisa del cambio, te dice qué platos de tu carta se ven afectados y te sugiere ajustar precios para proteger tu margen.",
  },
  {
    q: "¿Cómo funciona el envío a mi gestoría?",
    a: "Configuras el email de tu gestor y la frecuencia que prefieras: diario, semanal o mensual. ALEF genera un resumen profesional con todas las facturas del período y se lo envía automáticamente a la hora que tú elijas. También puedes enviarlo manualmente cuando quieras.",
  },
  {
    q: "¿Qué es VeriFactu y por qué me importa?",
    a: "Es el nuevo sistema de facturación electrónica de Hacienda. A partir de julio de 2027, todos los restaurantes deben usar software certificado. Las multas llegan hasta 50.000 euros. ALEF ya cumple con todos los requisitos, incluido de serie en todos los planes.",
  },
  {
    q: "¿Cuánto tiempo ahorro con esto?",
    a: "Un restaurante medio dedica entre 1 y 2 horas diarias a gestionar facturas, actualizar stock y cuadrar costes a mano. Con ALEF, ese trabajo se hace solo. Estamos hablando de 30-60 horas al mes que recuperas.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "Está incluido en ALEF. 129 euros al mes, todo incluido, sin permanencia. La facturación automática, el stock, VeriFactu, el envío a gestoría — todo dentro del mismo plan.",
  },
];

export default function FacturacionAutomatica() {
  const [faqOpen, setFaqOpen] = useState(null);

  return (
    <div className="FeaturePage">
      <TopBar />
      {/* ── SEO ── */}
      <SEOHead
        title="Facturación automática para restaurantes — VeriFactu incluido"
        description="Tus proveedores mandan la factura por email y ALEF la procesa sola: extrae productos, actualiza stock, recalcula costes y envía todo a tu gestoría. VeriFactu incluido. Desde 129€/mes."
        path="/facturacion-automatica-restaurante"
        type="article"
      />
      <ArticleStructuredData
        title="Facturación automática para restaurantes — ALEF"
        description="Sistema de facturación automática que procesa facturas de proveedores con IA, actualiza stock y costes, y envía documentación a gestoría. VeriFactu incluido."
        path="/facturacion-automatica-restaurante"
        datePublished="2026-06-02"
        dateModified="2026-06-02"
      />
      <FAQStructuredData
        faqs={faqs.map((f) => ({ question: f.q, answer: f.a }))}
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Inicio", path: "/" },
          { name: "Facturación automática", path: "/facturacion-automatica-restaurante" },
        ]}
      />

      {/* ══════════════════════════════════════
         HERO (oscuro)
         ══════════════════════════════════════ */}
      <section className="FP-hero">
        <div className="FP-hero-inner">
          <span className="FP-hero-badge">Incluida en ALEF</span>
          <h1>
            Tus facturas se procesan solas.
            <br />
            Tu stock se actualiza solo.
          </h1>
          <p className="FP-hero-sub">
            Tu proveedor manda la factura por email. ALEF la lee, extrae
            los productos, actualiza tu inventario, recalcula los costes
            de tus platos y envía todo a tu gestoría. Sin que tú toques nada.
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
         PROBLEMA (claro)
         ══════════════════════════════════════ */}
      <section className="FP-section">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>Gestionar facturas a mano es tirar dinero</h2>
            <p>
              Cada día recibes facturas, albaranes, notas de entrega.
              Cada una hay que abrirla, revisarla, apuntar los productos,
              actualizar el stock y guardarla para el gestor.
              Multiplicado por todos tus proveedores, todos los días.
            </p>
          </div>

          <div className="FP-pain-grid">
            <div className="FP-pain-card">
              <strong>1-2 horas diarias perdidas</strong>
              <span>
                Abrir emails, buscar PDFs, apuntar cantidades en un Excel
                o en un cuaderno. Cada día, la misma rutina.
              </span>
            </div>
            <div className="FP-pain-card">
              <strong>Tu stock nunca cuadra</strong>
              <span>
                Porque la factura dice una cosa, el albarán otra,
                y lo que realmente llegó a cocina nadie lo apuntó.
              </span>
            </div>
            <div className="FP-pain-card">
              <strong>No sabes si te subieron precios</strong>
              <span>
                El proveedor sube el kilo de ternera un 12% y no te enteras
                hasta que tu margen ha desaparecido. Semanas después.
              </span>
            </div>
            <div className="FP-pain-card">
              <strong>El gestor siempre te pide papeles</strong>
              <span>
                Cada mes, recopilar facturas, escanearlas, mandarlas por email.
                Y si falta alguna, vuelta a empezar.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
         CÓMO FUNCIONA (oscuro)
         ══════════════════════════════════════ */}
      <section className="FP-section FP-section--dark" id="como-funciona">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>De la factura al stock en menos de un minuto</h2>
            <p>Todo ocurre automáticamente. Tú solo revisas si quieres.</p>
          </div>

          <div className="FP-flow">
            <div className="FP-flow-step">
              <div className="FP-flow-num">1</div>
              <strong>Llega la factura</strong>
              <span>Por email o foto desde el móvil</span>
            </div>
            <div className="FP-flow-arrow">&#8594;</div>
            <div className="FP-flow-step">
              <div className="FP-flow-num">2</div>
              <strong>La IA la procesa</strong>
              <span>Extrae proveedor, productos, cantidades y precios</span>
            </div>
            <div className="FP-flow-arrow">&#8594;</div>
            <div className="FP-flow-step">
              <div className="FP-flow-num">3</div>
              <strong>Stock y costes actualizados</strong>
              <span>Inventario al día, márgenes recalculados</span>
            </div>
            <div className="FP-flow-arrow">&#8594;</div>
            <div className="FP-flow-step">
              <div className="FP-flow-num">4</div>
              <strong>Tu gestor la recibe</strong>
              <span>Envío automático con el resumen del período</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
         FEATURES (claro)
         ══════════════════════════════════════ */}
      <section className="FP-section">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>Qué hace ALEF con cada factura que recibes</h2>
          </div>

          <div className="FP-features">
            {/* F1: Lectura automática */}
            <div className="FP-feature-card">
              <div className="FP-feature-icon">&#128231;</div>
              <h3>Lee tus facturas desde el email</h3>
              <p>
                Conectas tu Gmail una vez. A partir de ahí, ALEF revisa
                tu bandeja cada 15 minutos, detecta las facturas y albaranes
                automáticamente, y empieza a procesarlas sin que hagas nada.
              </p>
              <ul>
                <li>Detecta PDFs e imágenes adjuntas en los emails</li>
                <li>Filtra spam y emails que no son facturas</li>
                <li>Si te entregan un albarán en mano, le sacas foto con el móvil</li>
                <li>No repite facturas que ya ha procesado</li>
              </ul>
            </div>

            {/* F2: Extracción IA */}
            <div className="FP-feature-card">
              <div className="FP-feature-icon">&#129302;</div>
              <h3>La IA extrae todos los datos</h3>
              <p>
                La inteligencia artificial lee el documento completo y extrae
                el proveedor, los productos, las cantidades, los precios unitarios
                y el IVA de cada línea. Funciona con PDFs, fotos e imágenes escaneadas.
              </p>
              <ul>
                <li>Reconoce facturas de cualquier proveedor, sin configuración previa</li>
                <li>Cruza cada producto con tu inventario automáticamente</li>
                <li>Detecta si el proveedor ha cambiado algún precio</li>
                <li>Muestra los datos extraídos para que los revises antes de aprobar</li>
              </ul>
            </div>

            {/* F3: Stock y costes */}
            <div className="FP-feature-card">
              <div className="FP-feature-icon">&#128230;</div>
              <h3>Stock y costes actualizados al instante</h3>
              <p>
                Cuando apruebas una factura, el stock sube automáticamente.
                Si un ingrediente cambió de precio, ALEF recalcula el coste
                de todos los platos que lo usan. Sin hojas de cálculo,
                sin fórmulas, sin errores.
              </p>
              <ul>
                <li>Convierte unidades automáticamente (cajas a kilos, botellas a litros)</li>
                <li>Si sube el precio del huevo, recalcula el coste de la tortilla, los huevos rotos y todo lo que lleve huevo</li>
                <li>Cada movimiento queda registrado con fecha, cantidad y origen</li>
                <li>Modo automático o con aprobación manual, tú eliges</li>
              </ul>
            </div>

            {/* F4: Gestoría */}
            <div className="FP-feature-card">
              <div className="FP-feature-icon">&#128233;</div>
              <h3>Tu gestoría recibe todo sin que tú hagas nada</h3>
              <p>
                Configuras el email de tu gestor y la frecuencia: diaria,
                semanal o mensual. ALEF genera un resumen profesional
                con todas las facturas del período y se lo envía
                automáticamente a la hora que elijas.
              </p>
              <ul>
                <li>Email profesional con tabla resumen + CSV descargable</li>
                <li>Incluye proveedor, CIF, número de factura, base, IVA y total</li>
                <li>Configuras día y hora de envío según tu preferencia</li>
                <li>También puedes enviar manualmente cuando necesites</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
         VERIFACTU (oscuro)
         ══════════════════════════════════════ */}
      <section className="FP-section FP-section--dark">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>VeriFactu incluido. Sin coste extra.</h2>
            <p>
              A partir de julio de 2027, todos los restaurantes deben emitir
              facturas con software certificado. Las multas llegan hasta
              50.000 euros. ALEF ya cumple con todo.
            </p>
          </div>

          <div className="FP-pain-grid">
            <div className="FP-pain-card" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(148,163,184,0.15)", borderLeftColor: "var(--color-primario)" }}>
              <strong style={{ color: "#fff" }}>Facturación encadenada</strong>
              <span style={{ color: "rgba(226,232,240,0.75)" }}>
                Cada ticket y factura está vinculado al anterior.
                Imposible borrar o modificar sin dejar rastro.
              </span>
            </div>
            <div className="FP-pain-card" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(148,163,184,0.15)", borderLeftColor: "var(--color-primario)" }}>
              <strong style={{ color: "#fff" }}>Hash antifraude</strong>
              <span style={{ color: "rgba(226,232,240,0.75)" }}>
                Cada documento lleva una huella digital única
                que garantiza que no se ha manipulado.
              </span>
            </div>
            <div className="FP-pain-card" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(148,163,184,0.15)", borderLeftColor: "var(--color-primario)" }}>
              <strong style={{ color: "#fff" }}>Preparado para la AEAT</strong>
              <span style={{ color: "rgba(226,232,240,0.75)" }}>
                Cuando Hacienda active el envío automático,
                ALEF estará listo desde el primer día.
              </span>
            </div>
            <div className="FP-pain-card" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(148,163,184,0.15)", borderLeftColor: "var(--color-primario)" }}>
              <strong style={{ color: "#fff" }}>Sin coste de adaptación</strong>
              <span style={{ color: "rgba(226,232,240,0.75)" }}>
                Muchos TPVs cobran la adaptación como extra.
                Con ALEF, VeriFactu viene incluido en todos los planes.
              </span>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link to="/verifactu" className="FP-btn FP-btn--ghost">
              Leer guía completa sobre VeriFactu
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
         COMPARATIVA (claro)
         ══════════════════════════════════════ */}
      <section className="FP-section">
        <div className="FP-section-inner">
          <div className="FP-section-header">
            <h2>ALEF vs gestión manual de facturas</h2>
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
                <td>Lectura automática de facturas</td>
                <td className="FP-compare-alef FP-check">Email + foto</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">Manual</td>
              </tr>
              <tr>
                <td>Extracción de datos con IA</td>
                <td className="FP-compare-alef FP-check">Automático</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">A ojo</td>
              </tr>
              <tr>
                <td>Actualización de stock</td>
                <td className="FP-compare-alef FP-check">Instantáneo</td>
                <td className="FP-partial">Manual</td>
                <td className="FP-cross">Cuaderno</td>
              </tr>
              <tr>
                <td>Recálculo de costes de platos</td>
                <td className="FP-compare-alef FP-check">En cascada</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">Imposible</td>
              </tr>
              <tr>
                <td>Alerta de cambio de precio</td>
                <td className="FP-compare-alef FP-check">Automática</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">Semanas después</td>
              </tr>
              <tr>
                <td>Envío a gestoría</td>
                <td className="FP-compare-alef FP-check">Automático</td>
                <td className="FP-cross">No</td>
                <td className="FP-cross">Tú a mano</td>
              </tr>
              <tr>
                <td>VeriFactu</td>
                <td className="FP-compare-alef FP-check">Incluido</td>
                <td className="FP-partial">Coste extra</td>
                <td className="FP-cross">No cumple</td>
              </tr>
              <tr>
                <td>Tiempo diario</td>
                <td className="FP-compare-alef FP-check">5-10 min</td>
                <td className="FP-partial">30-60 min</td>
                <td className="FP-cross">1-2 horas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ══════════════════════════════════════
         FAQ (oscuro)
         ══════════════════════════════════════ */}
      <section className="FP-section FP-section--dark">
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
         CTA FINAL (claro con gradiente)
         ══════════════════════════════════════ */}
      <section className="FP-cta-section FP-cta-section--light">
        <h2>¿Quieres dejar de perder tiempo con facturas?</h2>
        <p>
          Te hacemos una demo de 10 minutos con datos de un restaurante real.
          Sin compromiso. Por WhatsApp, email o videollamada.
        </p>
        <div className="FP-hero-ctas">
          <a href="https://softalef.com/#contacto" className="FP-btn FP-btn--primary">
            Solicitar demo
          </a>
          <a
            href="https://wa.me/34623754328?text=Hola%2C%20quiero%20ver%20la%20facturaci%C3%B3n%20autom%C3%A1tica%20de%20ALEF"
            target="_blank"
            rel="noopener noreferrer"
            className="FP-btn FP-btn--ghost"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </section>

      <nav className="FP-crosslinks">
        <span className="FP-crosslinks-label">Ver también:</span>
        <Link to="/carta-qr-restaurante">Carta QR inteligente</Link>
        <Link to="/stock-predictivo-restaurante">Stock predictivo</Link>
        <Link to="/automatizacion-restaurante">Automatización con IA</Link>
      </nav>
      <Footer />
    </div>
  );
}
