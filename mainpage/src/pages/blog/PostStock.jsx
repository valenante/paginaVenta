import { Link } from "react-router-dom";
import TopBar from "../../components/TopBar/TopBar";
import Footer from "../../components/Footer/Footer";
import SEOHead from "../../components/SEO/SEOHead";
import { ArticleStructuredData, BreadcrumbStructuredData } from "../../components/SEO/StructuredData";
import "./Blog.css";

export default function PostStock() {
  return (
    <div className="BlogPost">
      <TopBar />
      <SEOHead
        title="Guía completa de control de stock para restaurantes"
        description="Cómo controlar el inventario de tu restaurante: desde el conteo manual hasta la predicción con IA. Métodos, errores comunes y cómo automatizar los pedidos a proveedor."
        path="/blog/control-stock-restaurante-guia"
        type="article"
      />
      <ArticleStructuredData title="Guía completa de control de stock para restaurantes" description="Todo sobre control de inventario en hostelería: métodos, frecuencia, errores y automatización." path="/blog/control-stock-restaurante-guia" datePublished="2026-05-27" dateModified="2026-05-27" />
      <BreadcrumbStructuredData items={[{ name: "Inicio", path: "/" }, { name: "Blog", path: "/blog" }, { name: "Control de stock", path: "/blog/control-stock-restaurante-guia" }]} />

      <header className="BlogPost-header">
        <span className="BlogPost-tag">Operaciones</span>
        <h1>Guía completa de control de stock para restaurantes</h1>
        <p>El stock es donde más dinero se pierde en un restaurante sin que nadie se dé cuenta. Esta guía te explica cómo pasar del caos al control.</p>
        <div className="BlogPost-meta">27 mayo 2026 · 10 min lectura</div>
      </header>

      <article className="BlogPost-body">
        <h2>Por qué el stock es el punto ciego de la hostelería</h2>
        <p>La mayoría de restaurantes no saben cuánto producto tienen en cualquier momento dado. Saben lo que compraron, saben lo que vendieron (más o menos), pero el hueco entre ambos números es un misterio. Ese hueco es donde se evapora el margen.</p>
        <p>Según estudios del sector, <strong>un restaurante medio pierde entre el 5% y el 10% de sus compras</strong> en mermas, robos, porciones mal calibradas y producto caducado. En un restaurante que compra 15.000 euros al mes, eso son entre 750 y 1.500 euros que desaparecen sin dejar rastro.</p>

        <h2>Los 3 niveles del control de stock</h2>

        <h3>Nivel 1: Conteo manual periódico</h3>
        <p>El método clásico. Cada semana o cada mes, alguien cuenta lo que hay en la cámara, el almacén y la barra. Se apunta en un Excel o en un cuaderno, se compara con lo que debería haber según las compras y las ventas, y se buscan las diferencias.</p>
        <p><strong>Ventajas:</strong> no necesitas tecnología. <strong>Problemas:</strong> consume horas, los datos llegan tarde (cuando ya has perdido el producto), y los errores de conteo son frecuentes.</p>

        <h3>Nivel 2: Stock en tiempo real con recetas</h3>
        <p>Aquí es donde entra el software. Cada producto de tu carta tiene una <strong>receta</strong> con los ingredientes y las cantidades. Cuando vendes una hamburguesa, el sistema descuenta automáticamente 200g de carne, 1 pan, 30g de lechuga, etc.</p>
        <p>El stock se actualiza con cada venta y con cada compra (factura de proveedor). En cualquier momento puedes ver cuánto tienes de cada ingrediente sin contar nada.</p>
        <p><strong>Ventajas:</strong> datos en tiempo real, alertas cuando algo baja. <strong>Problemas:</strong> requiere que las recetas estén bien calibradas. Si la receta dice 200g pero el cocinero pone 250g, los números no cuadran.</p>

        <h3>Nivel 3: Stock predictivo con pedidos automáticos</h3>
        <p>El siguiente paso. El sistema no solo sabe cuánto tienes — <strong>predice cuánto vas a necesitar</strong>. Analiza el histórico de ventas por día de la semana, las reservas confirmadas, el clima, y calcula cuánto producto necesitarás mañana, pasado, la semana que viene.</p>
        <p>Con esa predicción, <strong>genera los pedidos a proveedor automáticamente</strong> teniendo en cuenta los plazos de entrega de cada uno. El viernes necesitas más entrecot porque tienes 15 reservas y hace buen tiempo? El pedido sale el miércoles para que llegue a tiempo.</p>

        <h2>Los 5 errores más comunes</h2>
        <ol>
          <li><strong>No tener recetas documentadas.</strong> Sin recetas, no hay consumo teórico. Sin consumo teórico, no sabes si pierdes producto o simplemente vendes mucho.</li>
          <li><strong>Contar solo una vez al mes.</strong> Un mes es demasiado tiempo. Para cuando descubres el problema, ya has perdido semanas de producto.</li>
          <li><strong>Ignorar las mermas.</strong> Cortar un limón, pelar una patata, limpiar un pescado — todo eso genera merma. Si no la registras, tus números nunca cuadran.</li>
          <li><strong>No vincular compras con stock.</strong> Si el stock no se actualiza cuando recibes mercancía, siempre vas con datos atrasados.</li>
          <li><strong>Pedir a ojo.</strong> El método de "miro la cámara y pido lo que falta" garantiza dos cosas: o te falta producto (pierdes ventas) o te sobra (pierdes dinero en caducidades).</li>
        </ol>

        <h2>Cómo pasar del caos al control</h2>
        <p>La transición no tiene que ser de golpe. Un plan realista:</p>
        <ol>
          <li><strong>Semana 1-2:</strong> documenta las recetas de tus 20 platos más vendidos. No necesitas hacerlas todas, empieza por los que más vendes.</li>
          <li><strong>Semana 3-4:</strong> carga las recetas en el sistema y empieza a comparar stock teórico vs real. Las diferencias te dirán dónde hay problemas.</li>
          <li><strong>Mes 2:</strong> vincula las compras con el stock. Cada factura de proveedor debe actualizar el inventario automáticamente.</li>
          <li><strong>Mes 3+:</strong> activa las predicciones y los pedidos automáticos. Deja que el sistema aprenda de tus datos y empiece a pedir por ti.</li>
        </ol>

        <h2>Qué puede hacer un sistema inteligente por ti</h2>
        <p><Link to="/stock-predictivo-restaurante">Un sistema como ALEF</Link> automatiza todo el ciclo:</p>
        <ul>
          <li><strong>Recetas:</strong> cada plato tiene su escandallo con ingredientes, cantidades y mermas.</li>
          <li><strong>Descuento automático:</strong> cada venta descuenta stock según la receta. En tiempo real.</li>
          <li><strong>Compras vinculadas:</strong> <Link to="/facturacion-automatica-restaurante">las facturas de proveedores se procesan automáticamente</Link> y actualizan el inventario.</li>
          <li><strong>Predicción:</strong> analiza 8-12 semanas de histórico + reservas + clima para predecir necesidades.</li>
          <li><strong>Pedidos automáticos:</strong> genera los pedidos a proveedor con los plazos de entrega correctos.</li>
          <li><strong>Alertas de margen:</strong> si un proveedor sube un precio, te dice qué platos pierden rentabilidad.</li>
        </ul>

        <blockquote>El stock no es solo cuánto tienes. Es cuánto vas a necesitar, cuánto te va a costar, y cuánto margen te va a dejar. Eso es lo que separa un restaurante que reacciona de uno que anticipa.</blockquote>
      </article>

      <section className="BlogPost-cta">
        <h2>¿Quieres que tu stock se gestione solo?</h2>
        <p>ALEF predice necesidades, genera pedidos y protege tus márgenes. Todo automático.</p>
        <div className="BlogPost-cta-btns">
          <a href="https://softalef.com/#contacto" className="BlogPost-cta-btn BlogPost-cta-btn--primary">Solicitar demo</a>
          <Link to="/stock-predictivo-restaurante" className="BlogPost-cta-btn BlogPost-cta-btn--ghost">Ver stock predictivo</Link>
        </div>
      </section>

      <nav className="BlogPost-related">
        <h3>Artículos relacionados</h3>
        <div className="BlogPost-related-grid">
          <Link to="/blog/calcular-margenes-restaurante" className="BlogPost-related-card">Cómo calcular márgenes reales</Link>
          <Link to="/blog/facturacion-electronica-hosteleria" className="BlogPost-related-card">Facturación electrónica para hostelería</Link>
          <Link to="/blog/automatizacion-restaurantes-ia" className="BlogPost-related-card">Automatización con IA</Link>
        </div>
      </nav>
      <Footer />
    </div>
  );
}
