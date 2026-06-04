import { Link } from "react-router-dom";
import TopBar from "../../components/TopBar/TopBar";
import Footer from "../../components/Footer/Footer";
import SEOHead from "../../components/SEO/SEOHead";
import { ArticleStructuredData, FAQStructuredData, BreadcrumbStructuredData } from "../../components/SEO/StructuredData";
import "./Blog.css";

const faqs = [
  { question: "¿Cuándo entra en vigor VeriFactu?", answer: "El 1 de julio de 2027 para la mayoría de empresas y autónomos, incluidos restaurantes y bares." },
  { question: "¿Qué pasa si no cumplo con VeriFactu?", answer: "Las multas van desde 10.000 hasta 50.000 euros por ejercicio fiscal, dependiendo de la gravedad." },
  { question: "¿Necesito cambiar de TPV?", answer: "Si tu TPV actual no está certificado para VeriFactu, sí. Algunos proveedores están adaptando su software, pero conviene comprobarlo pronto." },
  { question: "¿VeriFactu obliga a enviar facturas a Hacienda en tiempo real?", answer: "No en tiempo real, pero sí de forma automática y con un formato estándar. El sistema debe generar un registro por cada operación y enviarlo a la AEAT." },
];

export default function PostVerifactu() {
  return (
    <div className="BlogPost">
      <TopBar />
      <SEOHead
        title="Qué es VeriFactu y cómo afecta a tu restaurante en 2027"
        description="Guía completa sobre VeriFactu: qué es, cuándo entra en vigor, qué requisitos tiene, cuánto cuestan las multas y cómo preparar tu restaurante sin complicaciones."
        path="/blog/que-es-verifactu-restaurantes"
        type="article"
      />
      <ArticleStructuredData title="Qué es VeriFactu y cómo afecta a tu restaurante en 2027" description="Guía completa sobre la nueva ley de facturación electrónica VeriFactu para restaurantes y hostelería." path="/blog/que-es-verifactu-restaurantes" datePublished="2026-06-04" dateModified="2026-06-04" />
      <FAQStructuredData faqs={faqs} />
      <BreadcrumbStructuredData items={[{ name: "Inicio", path: "/" }, { name: "Blog", path: "/blog" }, { name: "VeriFactu para restaurantes", path: "/blog/que-es-verifactu-restaurantes" }]} />

      <header className="BlogPost-header">
        <span className="BlogPost-tag">Legal</span>
        <h1>Qué es VeriFactu y cómo afecta a tu restaurante en 2027</h1>
        <p>La nueva ley de facturación electrónica ya tiene fecha. Si tienes un restaurante, bar o cafetería en España, esto te afecta directamente.</p>
        <div className="BlogPost-meta">4 junio 2026 · 8 min lectura</div>
      </header>

      <article className="BlogPost-body">
        <h2>Qué es VeriFactu</h2>
        <p>VeriFactu es el sistema de verificación de facturas que la Agencia Tributaria (AEAT) pone en marcha como parte del Reglamento de facturación. Su nombre oficial es <strong>Sistema de Emisión de Facturas Verificables</strong>, pero todo el sector lo conoce como VeriFactu o VERI*FACTU.</p>
        <p>En términos simples: a partir de julio de 2027, todo software de facturación tiene que generar un <strong>registro digital por cada operación</strong>, firmarlo, encadenarlo con el anterior (como un blockchain simplificado) y enviarlo a Hacienda. El objetivo es eliminar la facturación en B y el software de doble contabilidad.</p>

        <h2>Cuándo entra en vigor</h2>
        <p>El plazo actual es el <strong>1 de julio de 2027</strong>. Todos los autónomos y empresas que usen software de facturación deben usar un sistema certificado antes de esa fecha. No hay periodo de gracia.</p>
        <p>Esto incluye restaurantes, bares, cafeterías, chiringuitos, food trucks — cualquier negocio de hostelería que emita tickets o facturas.</p>

        <h2>Qué requisitos tiene</h2>
        <p>Tu software de gestión (TPV, ERP, o lo que uses para facturar) debe cumplir estos requisitos:</p>
        <ul>
          <li><strong>Registro por operación:</strong> cada venta genera un registro con los datos fiscales del ticket/factura.</li>
          <li><strong>Encadenamiento:</strong> cada registro se vincula al anterior con un hash (resumen criptográfico). Si alguien modifica o borra un registro, la cadena se rompe.</li>
          <li><strong>Envío a la AEAT:</strong> los registros se envían a Hacienda de forma automática. No en tiempo real, pero sí con una frecuencia razonable.</li>
          <li><strong>Inalterabilidad:</strong> una vez generado el registro, no se puede modificar ni eliminar. Las correcciones se hacen con registros nuevos (abonos, rectificativas).</li>
          <li><strong>Certificación del software:</strong> el proveedor del software debe declarar responsablemente que su sistema cumple con el reglamento.</li>
        </ul>

        <h2>Cuánto cuestan las multas</h2>
        <p>Las sanciones por no cumplir son severas:</p>
        <table>
          <thead><tr><th>Infracción</th><th>Multa</th></tr></thead>
          <tbody>
            <tr><td>Usar software no certificado</td><td>Hasta 50.000 EUR por ejercicio</td></tr>
            <tr><td>No enviar registros a la AEAT</td><td>Hasta 10.000 EUR</td></tr>
            <tr><td>Alterar o destruir registros</td><td>Hasta 50.000 EUR</td></tr>
          </tbody>
        </table>
        <p>No es algo que se pueda ignorar. Las multas son por ejercicio fiscal, no por incidencia.</p>

        <h2>Cómo afecta a tu restaurante</h2>
        <p>Si usas un TPV, una caja registradora con software, o cualquier sistema informático para emitir tickets, tienes que asegurarte de que ese sistema cumple con VeriFactu antes de julio de 2027.</p>
        <p>Lo que necesitas comprobar:</p>
        <ol>
          <li><strong>¿Tu proveedor de TPV ha confirmado que será compatible?</strong> Pregúntale directamente. Si no te da una respuesta clara, empieza a buscar alternativas.</li>
          <li><strong>¿Tu sistema genera registros encadenados?</strong> No basta con imprimir tickets. Tiene que haber un registro digital firmado por cada operación.</li>
          <li><strong>¿Puede enviar datos a la AEAT?</strong> El envío tiene que ser automático. No vale mandarlo a mano.</li>
        </ol>

        <h2>Cómo prepararte sin complicaciones</h2>
        <p>Lo mejor que puedes hacer es migrar a un sistema que ya cumpla con VeriFactu antes de la fecha límite. Así evitas prisas de última hora y multas.</p>
        <p><Link to="/facturacion-automatica-restaurante">ALEF ya incluye VeriFactu de serie</Link> en todos sus planes. Cada ticket que emites genera un registro encadenado, firmado y listo para enviar a Hacienda. No tienes que hacer nada — el sistema se encarga solo.</p>
        <p>Además, ALEF automatiza toda la facturación de proveedores: <Link to="/facturacion-automatica-restaurante">lee las facturas por email, extrae productos y actualiza tu stock</Link>. Dos problemas resueltos con un solo sistema.</p>

        <blockquote>Si vas a tener que cambiar de software igualmente, mejor hacerlo ahora y aprovechar para modernizar toda la gestión. No solo la facturación.</blockquote>

        <h2>Preguntas frecuentes</h2>
        {faqs.map((f, i) => (
          <div key={i}>
            <h3>{f.question}</h3>
            <p>{f.answer}</p>
          </div>
        ))}
      </article>

      <section className="BlogPost-cta">
        <h2>¿Tu restaurante ya cumple con VeriFactu?</h2>
        <p>ALEF incluye VeriFactu de serie en todos los planes. Sin coste extra, sin configuración.</p>
        <div className="BlogPost-cta-btns">
          <a href="https://softalef.com/#contacto" className="BlogPost-cta-btn BlogPost-cta-btn--primary">Solicitar demo</a>
          <Link to="/verifactu" className="BlogPost-cta-btn BlogPost-cta-btn--ghost">Leer guía técnica VeriFactu</Link>
        </div>
      </section>

      <nav className="BlogPost-related">
        <h3>Artículos relacionados</h3>
        <div className="BlogPost-related-grid">
          <Link to="/blog/facturacion-electronica-hosteleria" className="BlogPost-related-card">Facturación electrónica para hostelería</Link>
          <Link to="/blog/calcular-margenes-restaurante" className="BlogPost-related-card">Cómo calcular márgenes reales</Link>
          <Link to="/blog/control-stock-restaurante-guia" className="BlogPost-related-card">Guía de control de stock</Link>
        </div>
      </nav>
      <Footer />
    </div>
  );
}
