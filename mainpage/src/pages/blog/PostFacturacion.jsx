import { Link } from "react-router-dom";
import TopBar from "../../components/TopBar/TopBar";
import Footer from "../../components/Footer/Footer";
import SEOHead from "../../components/SEO/SEOHead";
import { ArticleStructuredData, BreadcrumbStructuredData } from "../../components/SEO/StructuredData";
import "./Blog.css";

export default function PostFacturacion() {
  return (
    <div className="FeaturePage">
      <TopBar />
      <SEOHead
        title="Facturacion electronica para hosteleria: guia practica"
        description="Que cambia con la facturacion electronica para restaurantes y bares. Requisitos legales, como automatizar el proceso y como dejar de perder horas con facturas de proveedores."
        path="/blog/facturacion-electronica-hosteleria"
        type="article"
      />
      <ArticleStructuredData title="Facturacion electronica para hosteleria: guia practica" description="Guia sobre facturacion electronica en restaurantes: normativa, automatizacion, gestion de proveedores y envio a gestoria." path="/blog/facturacion-electronica-hosteleria" datePublished="2026-06-04" dateModified="2026-06-04" />
      <BreadcrumbStructuredData items={[{ name: "Inicio", path: "/" }, { name: "Blog", path: "/blog" }, { name: "Facturacion electronica", path: "/blog/facturacion-electronica-hosteleria" }]} />

      <header className="BlogPost-header">
        <span className="BlogPost-tag">Legal</span>
        <h1>Facturacion electronica para hosteleria: guia practica</h1>
        <p>Las facturas de proveedores, los tickets de venta, el envio a gestoria — todo esta cambiando. Esto es lo que necesitas saber y hacer.</p>
        <div className="BlogPost-meta">4 junio 2026 · 7 min lectura</div>
      </header>

      <article className="BlogPost-body">
        <h2>El doble problema de la facturacion en hosteleria</h2>
        <p>Un restaurante tiene dos flujos de facturacion que le quitan tiempo todos los dias:</p>
        <ol>
          <li><strong>Facturas de venta</strong> (tickets, facturas a clientes): cada ticket que emites tiene que cumplir con la normativa fiscal. Con <Link to="/blog/que-es-verifactu-restaurantes">VeriFactu</Link>, ademas tiene que generar un registro electronico.</li>
          <li><strong>Facturas de compra</strong> (proveedores): cada factura que recibes hay que revisarla, registrarla, actualizar stock y mandarla a gestoria. Si tienes 8-10 proveedores, son 40-60 facturas al mes.</li>
        </ol>
        <p>El restaurante medio dedica <strong>entre 1 y 2 horas al dia</strong> a gestionar facturas. Eso son 30-60 horas al mes que podrias dedicar a tu negocio.</p>

        <h2>Que cambia con la normativa</h2>
        <p>Hay dos grandes cambios normativos en marcha:</p>

        <h3>VeriFactu (julio 2027)</h3>
        <p>Afecta a las <strong>facturas que emites</strong> (tickets de venta). Tu software tiene que generar un registro electronico firmado y encadenado por cada operacion, y enviarlo a Hacienda. <Link to="/blog/que-es-verifactu-restaurantes">Lee la guia completa de VeriFactu</Link>.</p>

        <h3>Factura electronica B2B (en desarrollo)</h3>
        <p>Afectara a las <strong>facturas entre empresas</strong>. Tus proveedores tendran que enviarte facturas en formato electronico estandar (Facturae). Todavia no hay fecha firme, pero el ecosistema se esta preparando.</p>

        <h2>Como automatizar las facturas de proveedores</h2>
        <p>El proceso manual clasico: recibes la factura por email o en papel, la abres, la revisas, apuntas los productos y cantidades, actualizas el stock, la guardas, y al final del mes las mandas al gestor. Repetir 50 veces al mes.</p>
        <p>El proceso automatizado:</p>
        <ol>
          <li><strong>Recepcion automatica:</strong> el sistema conecta con tu email (Gmail, Outlook) y detecta los emails con facturas o albaranes adjuntos.</li>
          <li><strong>Extraccion con IA:</strong> lee el PDF o la foto, identifica productos, cantidades, precios y proveedor.</li>
          <li><strong>Matching con tu inventario:</strong> vincula cada producto de la factura con el ingrediente correcto de tu stock.</li>
          <li><strong>Actualizacion de stock:</strong> las cantidades se suman al inventario automaticamente.</li>
          <li><strong>Deteccion de cambios de precio:</strong> si un proveedor te sube un precio, el sistema te avisa y te dice que platos se ven afectados.</li>
          <li><strong>Envio a gestoria:</strong> un resumen profesional con todas las facturas se envia automaticamente a tu gestor con la frecuencia que elijas.</li>
        </ol>
        <p><Link to="/facturacion-automatica-restaurante">ALEF automatiza todo este proceso</Link>. Desde la recepcion del email hasta el envio al gestor.</p>

        <h2>Las facturas en papel</h2>
        <p>No todos los proveedores mandan email. Algunos te dejan la factura en mano con el albaran de entrega. La solucion: <strong>foto con el movil</strong>.</p>
        <p>La misma inteligencia artificial que lee PDFs puede leer fotos. Sacas la foto, el sistema extrae los datos, y el flujo es el mismo: matching, stock, contabilidad.</p>
        <p>Lo importante es que <strong>todo acabe en el mismo sitio</strong>. No importa si la factura llego por email, por WhatsApp o en un papel arrugado. El resultado es un registro digital limpio, vinculado a tu inventario y disponible para tu gestor.</p>

        <h2>Que buscar en un sistema de facturacion para hosteleria</h2>
        <ul>
          <li><strong>Integracion con email:</strong> que revise tu bandeja automaticamente, sin que tengas que subir archivos a mano.</li>
          <li><strong>OCR con IA:</strong> que lea PDFs y fotos, no solo XMLs perfectos.</li>
          <li><strong>Vinculacion con stock:</strong> que cada factura actualice tu inventario automaticamente.</li>
          <li><strong>Deteccion de precios:</strong> que te avise cuando un proveedor cambia un precio.</li>
          <li><strong>Envio a gestoria:</strong> automatico, con la documentacion organizada.</li>
          <li><strong>VeriFactu incluido:</strong> que tus tickets de venta cumplan con la normativa sin esfuerzo extra.</li>
        </ul>

        <blockquote>Si todavia estas registrando facturas a mano y mandando PDFs por email a tu gestor, estas invirtiendo tiempo en algo que la tecnologia ya sabe hacer sola. Ese tiempo vale mas en tu cocina o con tus clientes.</blockquote>
      </article>

      <section className="BlogPost-cta">
        <h2>Quieres dejar de perder tiempo con facturas?</h2>
        <p>ALEF procesa facturas de proveedores automaticamente y envia todo a tu gestoria.</p>
        <div className="BlogPost-cta-btns">
          <a href="https://softalef.com/#contacto" className="BlogPost-cta-btn BlogPost-cta-btn--primary">Solicitar demo</a>
          <Link to="/facturacion-automatica-restaurante" className="BlogPost-cta-btn BlogPost-cta-btn--ghost">Ver facturacion automatica</Link>
        </div>
      </section>

      <nav className="BlogPost-related">
        <h3>Artículos relacionados</h3>
        <div className="BlogPost-related-grid">
          <Link to="/blog/que-es-verifactu-restaurantes" className="BlogPost-related-card">Qué es VeriFactu</Link>
          <Link to="/blog/control-stock-restaurante-guia" className="BlogPost-related-card">Guía de control de stock</Link>
          <Link to="/blog/automatizacion-restaurantes-ia" className="BlogPost-related-card">Automatización con IA</Link>
        </div>
      </nav>
      <Footer />
    </div>
  );
}
