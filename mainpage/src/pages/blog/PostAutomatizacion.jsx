import { Link } from "react-router-dom";
import TopBar from "../../components/TopBar/TopBar";
import Footer from "../../components/Footer/Footer";
import SEOHead from "../../components/SEO/SEOHead";
import { ArticleStructuredData, BreadcrumbStructuredData } from "../../components/SEO/StructuredData";
import "./Blog.css";

export default function PostAutomatizacion() {
  return (
    <div className="BlogPost">
      <TopBar />
      <SEOHead
        title="Automatización de restaurantes con IA: qué se puede hacer hoy"
        description="Instagram automático, pedidos a proveedor, respuestas a reseñas de Google, predicción de demanda. Qué funciona de verdad y qué es solo marketing."
        path="/blog/automatizacion-restaurantes-ia"
        type="article"
      />
      <ArticleStructuredData title="Automatización de restaurantes con IA: qué se puede hacer hoy" description="Análisis real de las automatizaciones disponibles para restaurantes: qué funciona, qué no, y qué esperar de la IA en hostelería." path="/blog/automatizacion-restaurantes-ia" datePublished="2026-06-17" dateModified="2026-06-17" />
      <BreadcrumbStructuredData items={[{ name: "Inicio", path: "/" }, { name: "Blog", path: "/blog" }, { name: "Automatización con IA", path: "/blog/automatizacion-restaurantes-ia" }]} />

      <header className="BlogPost-header">
        <span className="BlogPost-tag">Tecnología</span>
        <h1>Automatización de restaurantes con IA: qué se puede hacer hoy</h1>
        <p>La IA en hostelería no es ciencia ficción. Hay cosas que ya funcionan, cosas que casi funcionan, y cosas que son puro humo. Vamos a separar la paja del grano.</p>
        <div className="BlogPost-meta">17 junio 2026 · 9 min lectura</div>
      </header>

      <article className="BlogPost-body">
        <h2>El estado real de la IA en restaurantes</h2>
        <p>Hay mucho ruido sobre inteligencia artificial en hostelería. Cada semana sale un nuevo "TPV con IA" que promete revolucionar tu negocio. La realidad es más matizada: <strong>hay automatizaciones que ya funcionan bien, otras que están madurando, y muchas que son solo buzzwords</strong>.</p>
        <p>Vamos a repasar las que realmente puedes usar hoy en un restaurante real.</p>

        <h2>Lo que ya funciona de verdad</h2>

        <h3>1. Procesamiento automático de facturas</h3>
        <p>La IA puede leer una factura (PDF o foto), extraer productos, cantidades, precios y proveedor, y vincular todo con tu inventario. La tasa de acierto con facturas bien formateadas supera el 95%.</p>
        <p><strong>Impacto real:</strong> 1-2 horas al día que dejas de perder con papeleo. <Link to="/facturacion-automatica-restaurante">Así funciona en ALEF</Link>.</p>

        <h3>2. Predicción de demanda</h3>
        <p>Analizando el histórico de ventas por día de la semana, las reservas confirmadas, el clima y eventos especiales, la IA puede predecir cuántos comensales tendrás y qué van a pedir. No con precisión milimétrica, pero sí lo suficiente para hacer pedidos a proveedor inteligentes.</p>
        <p><strong>Impacto real:</strong> menos producto caducado, menos roturas de stock, pedidos que se generan solos. <Link to="/stock-predictivo-restaurante">Ver stock predictivo</Link>.</p>

        <h3>3. Menú engineering automático</h3>
        <p>Cruzar datos de ventas con datos de coste para clasificar platos en 4 categorías: estrellas (venden mucho + buen margen), caballos (venden mucho + mal margen), incógnitas (venden poco + buen margen) y perros (venden poco + mal margen).</p>
        <p><strong>Impacto real:</strong> decisiones de carta basadas en datos, no en intuición. Saber qué platos promocionar, cuáles subir de precio y cuáles eliminar.</p>

        <h3>4. Respuestas automáticas a reseñas de Google</h3>
        <p>Las reseñas positivas (4-5 estrellas) se pueden responder automáticamente con un mensaje personalizado que menciona detalles del restaurante. Las negativas se guardan como borrador para revisión humana.</p>
        <p><strong>Impacto real:</strong> mantener un perfil de Google activo sin dedicarle tiempo. Las reseñas respondidas mejoran el posicionamiento local.</p>

        <h3>5. Publicación automática en Instagram</h3>
        <p>Generar posts con texto e imagen a partir de los datos del restaurante: plato del día, promoción, evento especial. El sistema genera el contenido, tú lo revisas (o lo dejas publicar solo).</p>
        <p><strong>Impacto real:</strong> mantener redes sociales activas sin un community manager dedicado.</p>

        <h3>6. Carta QR inteligente</h3>
        <p>No es solo un QR con un PDF. Una <Link to="/carta-qr-restaurante">carta QR inteligente</Link> sugiere platos según el contexto (hora, clima, historial), se traduce automáticamente a varios idiomas, y envía pedidos directo a cocina desde el móvil del cliente.</p>
        <p><strong>Impacto real:</strong> ticket medio más alto por sugerencias relevantes, menos errores de pedido, datos de comportamiento del cliente.</p>

        <h2>Lo que está madurando</h2>

        <h3>Copilot conversacional</h3>
        <p>Preguntarle al sistema en lenguaje natural: "¿qué plato me da más margen?", "¿cuánto vendí el sábado?", "¿qué proveedor me sale más caro?". La tecnología funciona, pero la calidad depende de que el copilot tenga acceso a datos reales y actualizados, no a respuestas genéricas.</p>
        <p><Link to="/automatizacion-restaurante">ALEF incluye un copilot con acceso a todos tus datos</Link>: ventas, stock, costes, empleados, reservas, cocina. Cuando le preguntas algo, consulta datos reales.</p>

        <h3>Pricing dinámico</h3>
        <p>Ajustar precios según demanda, día de la semana, meteorología o stock disponible. Funciona bien en delivery y en promociones, pero todavía es delicado en carta fija.</p>

        <h2>Lo que es humo (por ahora)</h2>
        <ul>
          <li><strong>"IA que gestiona todo tu restaurante sola"</strong> — No existe. La IA automatiza tareas concretas, no sustituye al restaurador.</li>
          <li><strong>"Chatbot que sustituye al camarero"</strong> — Los chatbots genéricos no entienden la complejidad de un servicio real. Funcionan para reservas y consultas, no para atender mesas.</li>
          <li><strong>"Predicción de tendencias gastronómicas"</strong> — Demasiado genérico para ser útil. Lo que funciona es analizar TUS datos, no datos globales.</li>
        </ul>

        <h2>Cómo elegir qué automatizar</h2>
        <p>La regla es simple: <strong>automatiza lo que te quita tiempo sin añadirte valor</strong>.</p>
        <ul>
          <li>Registrar facturas no te añade valor → automatiza.</li>
          <li>Contar stock no te añade valor → automatiza.</li>
          <li>Responder reseñas de 5 estrellas no te añade valor → automatiza.</li>
          <li>Decidir el menú de la semana SÍ te añade valor → que la IA te sugiera, pero decides tú.</li>
          <li>Hablar con un cliente insatisfecho SÍ te añade valor → que la IA prepare el borrador, pero mandas tú.</li>
        </ul>

        <blockquote>La mejor automatización es la que no notas. El restaurante funciona mejor, tú tienes más tiempo, y el cliente no sabe que hay IA detrás. Solo nota que el servicio es mejor.</blockquote>
      </article>

      <section className="BlogPost-cta">
        <h2>¿Quieres ver qué puede automatizar tu restaurante?</h2>
        <p>Demo de 10 minutos con datos reales. Sin compromiso.</p>
        <div className="BlogPost-cta-btns">
          <a href="https://softalef.com/#contacto" className="BlogPost-cta-btn BlogPost-cta-btn--primary">Solicitar demo</a>
          <Link to="/automatizacion-restaurante" className="BlogPost-cta-btn BlogPost-cta-btn--ghost">Ver automatización ALEF</Link>
        </div>
      </section>

      <nav className="BlogPost-related">
        <h3>Artículos relacionados</h3>
        <div className="BlogPost-related-grid">
          <Link to="/blog/control-stock-restaurante-guia" className="BlogPost-related-card">Guía de control de stock</Link>
          <Link to="/blog/calcular-margenes-restaurante" className="BlogPost-related-card">Calcular márgenes reales</Link>
          <Link to="/blog/que-es-verifactu-restaurantes" className="BlogPost-related-card">Qué es VeriFactu</Link>
        </div>
      </nav>
      <Footer />
    </div>
  );
}
