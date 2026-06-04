import { Link } from "react-router-dom";
import SEOHead from "../../components/SEO/SEOHead";
import { ArticleStructuredData, FAQStructuredData, BreadcrumbStructuredData } from "../../components/SEO/StructuredData";
import "./Blog.css";

const faqs = [
  { question: "Cuando entra en vigor VeriFactu?", answer: "El 1 de julio de 2027 para la mayoria de empresas y autonomos, incluidos restaurantes y bares." },
  { question: "Que pasa si no cumplo con VeriFactu?", answer: "Las multas van desde 10.000 hasta 50.000 euros por ejercicio fiscal, dependiendo de la gravedad." },
  { question: "Necesito cambiar de TPV?", answer: "Si tu TPV actual no esta certificado para VeriFactu, si. Algunos proveedores estan adaptando su software, pero conviene comprobarlo pronto." },
  { question: "VeriFactu obliga a enviar facturas a Hacienda en tiempo real?", answer: "No en tiempo real, pero si de forma automatica y con un formato estandar. El sistema debe generar un registro por cada operacion y enviarlo a la AEAT." },
];

export default function PostVerifactu() {
  return (
    <div className="BlogPost">
      <SEOHead
        title="Que es VeriFactu y como afecta a tu restaurante en 2027"
        description="Guia completa sobre VeriFactu: que es, cuando entra en vigor, que requisitos tiene, cuanto cuestan las multas y como preparar tu restaurante sin complicaciones."
        path="/blog/que-es-verifactu-restaurantes"
        type="article"
      />
      <ArticleStructuredData title="Que es VeriFactu y como afecta a tu restaurante en 2027" description="Guia completa sobre la nueva ley de facturacion electronica VeriFactu para restaurantes y hosteleria." path="/blog/que-es-verifactu-restaurantes" datePublished="2026-06-04" dateModified="2026-06-04" />
      <FAQStructuredData faqs={faqs} />
      <BreadcrumbStructuredData items={[{ name: "Inicio", path: "/" }, { name: "Blog", path: "/blog" }, { name: "VeriFactu para restaurantes", path: "/blog/que-es-verifactu-restaurantes" }]} />

      <header className="BlogPost-header">
        <span className="BlogPost-tag">Legal</span>
        <h1>Que es VeriFactu y como afecta a tu restaurante en 2027</h1>
        <p>La nueva ley de facturacion electronica ya tiene fecha. Si tienes un restaurante, bar o cafeteria en Espana, esto te afecta directamente.</p>
        <div className="BlogPost-meta">4 junio 2026 · 8 min lectura</div>
      </header>

      <article className="BlogPost-body">
        <h2>Que es VeriFactu</h2>
        <p>VeriFactu es el sistema de verificacion de facturas que la Agencia Tributaria (AEAT) pone en marcha como parte del Reglamento de facturacion. Su nombre oficial es <strong>Sistema de Emision de Facturas Verificables</strong>, pero todo el sector lo conoce como VeriFactu o VERI*FACTU.</p>
        <p>En terminos simples: a partir de julio de 2027, todo software de facturacion tiene que generar un <strong>registro digital por cada operacion</strong>, firmarlo, encadenarlo con el anterior (como un blockchain simplificado) y enviarlo a Hacienda. El objetivo es eliminar la facturacion en B y el software de doble contabilidad.</p>

        <h2>Cuando entra en vigor</h2>
        <p>El plazo actual es el <strong>1 de julio de 2027</strong>. Todos los autonomos y empresas que usen software de facturacion deben usar un sistema certificado antes de esa fecha. No hay periodo de gracia.</p>
        <p>Esto incluye restaurantes, bares, cafeterias, chiringuitos, food trucks — cualquier negocio de hosteleria que emita tickets o facturas.</p>

        <h2>Que requisitos tiene</h2>
        <p>Tu software de gestion (TPV, ERP, o lo que uses para facturar) debe cumplir estos requisitos:</p>
        <ul>
          <li><strong>Registro por operacion:</strong> cada venta genera un registro con los datos fiscales del ticket/factura.</li>
          <li><strong>Encadenamiento:</strong> cada registro se vincula al anterior con un hash (resumen criptografico). Si alguien modifica o borra un registro, la cadena se rompe.</li>
          <li><strong>Envio a la AEAT:</strong> los registros se envian a Hacienda de forma automatica. No en tiempo real, pero si con una frecuencia razonable.</li>
          <li><strong>Inalterabilidad:</strong> una vez generado el registro, no se puede modificar ni eliminar. Las correcciones se hacen con registros nuevos (abonos, rectificativas).</li>
          <li><strong>Certificacion del software:</strong> el proveedor del software debe declarar responsablemente que su sistema cumple con el reglamento.</li>
        </ul>

        <h2>Cuanto cuestan las multas</h2>
        <p>Las sanciones por no cumplir son severas:</p>
        <table>
          <thead><tr><th>Infraccion</th><th>Multa</th></tr></thead>
          <tbody>
            <tr><td>Usar software no certificado</td><td>Hasta 50.000 EUR por ejercicio</td></tr>
            <tr><td>No enviar registros a la AEAT</td><td>Hasta 10.000 EUR</td></tr>
            <tr><td>Alterar o destruir registros</td><td>Hasta 50.000 EUR</td></tr>
          </tbody>
        </table>
        <p>No es algo que se pueda ignorar. Las multas son por ejercicio fiscal, no por incidencia.</p>

        <h2>Como afecta a tu restaurante</h2>
        <p>Si usas un TPV, una caja registradora con software, o cualquier sistema informatico para emitir tickets, tienes que asegurarte de que ese sistema cumple con VeriFactu antes de julio de 2027.</p>
        <p>Lo que necesitas comprobar:</p>
        <ol>
          <li><strong>Tu proveedor de TPV ha confirmado que sera compatible?</strong> Preguntale directamente. Si no te da una respuesta clara, empieza a buscar alternativas.</li>
          <li><strong>Tu sistema genera registros encadenados?</strong> No basta con imprimir tickets. Tiene que haber un registro digital firmado por cada operacion.</li>
          <li><strong>Puede enviar datos a la AEAT?</strong> El envio tiene que ser automatico. No vale mandarlo a mano.</li>
        </ol>

        <h2>Como prepararte sin complicaciones</h2>
        <p>Lo mejor que puedes hacer es migrar a un sistema que ya cumpla con VeriFactu antes de la fecha limite. Asi evitas prisas de ultima hora y multas.</p>
        <p><Link to="/facturacion-automatica-restaurante">ALEF ya incluye VeriFactu de serie</Link> en todos sus planes. Cada ticket que emites genera un registro encadenado, firmado y listo para enviar a Hacienda. No tienes que hacer nada — el sistema se encarga solo.</p>
        <p>Ademas, ALEF automatiza toda la facturacion de proveedores: <Link to="/facturacion-automatica-restaurante">lee las facturas por email, extrae productos y actualiza tu stock</Link>. Dos problemas resueltos con un solo sistema.</p>

        <blockquote>Si vas a tener que cambiar de software igualmente, mejor hacerlo ahora y aprovechar para modernizar toda la gestion. No solo la facturacion.</blockquote>

        <h2>Preguntas frecuentes</h2>
        {faqs.map((f, i) => (
          <div key={i}>
            <h3>{f.question}</h3>
            <p>{f.answer}</p>
          </div>
        ))}
      </article>

      <section className="BlogPost-cta">
        <h2>Tu restaurante ya cumple con VeriFactu?</h2>
        <p>ALEF incluye VeriFactu de serie en todos los planes. Sin coste extra, sin configuracion.</p>
        <div className="BlogPost-cta-btns">
          <a href="https://softalef.com/#contacto" className="BlogPost-cta-btn BlogPost-cta-btn--primary">Solicitar demo</a>
          <Link to="/verifactu" className="BlogPost-cta-btn BlogPost-cta-btn--ghost">Leer guia tecnica VeriFactu</Link>
        </div>
      </section>

      <nav className="BlogPost-related">
        <h3>Articulos relacionados</h3>
        <div className="BlogPost-related-grid">
          <Link to="/blog/facturacion-electronica-hosteleria" className="BlogPost-related-card">Facturacion electronica para hosteleria</Link>
          <Link to="/blog/calcular-margenes-restaurante" className="BlogPost-related-card">Como calcular margenes reales</Link>
          <Link to="/blog/control-stock-restaurante-guia" className="BlogPost-related-card">Guia de control de stock</Link>
        </div>
      </nav>
    </div>
  );
}
