import { Link } from "react-router-dom";
import SEOHead from "../../components/SEO/SEOHead";
import { ArticleStructuredData, BreadcrumbStructuredData } from "../../components/SEO/StructuredData";
import "./Blog.css";

export default function PostStock() {
  return (
    <div className="BlogPost">
      <SEOHead
        title="Guia completa de control de stock para restaurantes"
        description="Como controlar el inventario de tu restaurante: desde el conteo manual hasta la prediccion con IA. Metodos, errores comunes y como automatizar los pedidos a proveedor."
        path="/blog/control-stock-restaurante-guia"
        type="article"
      />
      <ArticleStructuredData title="Guia completa de control de stock para restaurantes" description="Todo sobre control de inventario en hosteleria: metodos, frecuencia, errores y automatizacion." path="/blog/control-stock-restaurante-guia" datePublished="2026-06-04" dateModified="2026-06-04" />
      <BreadcrumbStructuredData items={[{ name: "Inicio", path: "/" }, { name: "Blog", path: "/blog" }, { name: "Control de stock", path: "/blog/control-stock-restaurante-guia" }]} />

      <header className="BlogPost-header">
        <span className="BlogPost-tag">Operaciones</span>
        <h1>Guia completa de control de stock para restaurantes</h1>
        <p>El stock es donde mas dinero se pierde en un restaurante sin que nadie se de cuenta. Esta guia te explica como pasar del caos al control.</p>
        <div className="BlogPost-meta">4 junio 2026 · 10 min lectura</div>
      </header>

      <article className="BlogPost-body">
        <h2>Por que el stock es el punto ciego de la hosteleria</h2>
        <p>La mayoria de restaurantes no saben cuanto producto tienen en cualquier momento dado. Saben lo que compraron, saben lo que vendieron (mas o menos), pero el hueco entre ambos numeros es un misterio. Ese hueco es donde se evapora el margen.</p>
        <p>Segun estudios del sector, <strong>un restaurante medio pierde entre el 5% y el 10% de sus compras</strong> en mermas, robos, porciones mal calibradas y producto caducado. En un restaurante que compra 15.000 euros al mes, eso son entre 750 y 1.500 euros que desaparecen sin dejar rastro.</p>

        <h2>Los 3 niveles del control de stock</h2>

        <h3>Nivel 1: Conteo manual periodico</h3>
        <p>El metodo clasico. Cada semana o cada mes, alguien cuenta lo que hay en la camara, el almacen y la barra. Se apunta en un Excel o en un cuaderno, se compara con lo que deberia haber segun las compras y las ventas, y se buscan las diferencias.</p>
        <p><strong>Ventajas:</strong> no necesitas tecnologia. <strong>Problemas:</strong> consume horas, los datos llegan tarde (cuando ya has perdido el producto), y los errores de conteo son frecuentes.</p>

        <h3>Nivel 2: Stock en tiempo real con recetas</h3>
        <p>Aqui es donde entra el software. Cada producto de tu carta tiene una <strong>receta</strong> con los ingredientes y las cantidades. Cuando vendes una hamburguesa, el sistema descuenta automaticamente 200g de carne, 1 pan, 30g de lechuga, etc.</p>
        <p>El stock se actualiza con cada venta y con cada compra (factura de proveedor). En cualquier momento puedes ver cuanto tienes de cada ingrediente sin contar nada.</p>
        <p><strong>Ventajas:</strong> datos en tiempo real, alertas cuando algo baja. <strong>Problemas:</strong> requiere que las recetas esten bien calibradas. Si la receta dice 200g pero el cocinero pone 250g, los numeros no cuadran.</p>

        <h3>Nivel 3: Stock predictivo con pedidos automaticos</h3>
        <p>El siguiente paso. El sistema no solo sabe cuanto tienes — <strong>predice cuanto vas a necesitar</strong>. Analiza el historico de ventas por dia de la semana, las reservas confirmadas, el clima, y calcula cuanto producto necesitaras manana, pasado, la semana que viene.</p>
        <p>Con esa prediccion, <strong>genera los pedidos a proveedor automaticamente</strong> teniendo en cuenta los plazos de entrega de cada uno. El viernes necesitas mas entrecot porque tienes 15 reservas y hace buen tiempo? El pedido sale el miercoles para que llegue a tiempo.</p>

        <h2>Los 5 errores mas comunes</h2>
        <ol>
          <li><strong>No tener recetas documentadas.</strong> Sin recetas, no hay consumo teorico. Sin consumo teorico, no sabes si pierdes producto o simplemente vendes mucho.</li>
          <li><strong>Contar solo una vez al mes.</strong> Un mes es demasiado tiempo. Para cuando descubres el problema, ya has perdido semanas de producto.</li>
          <li><strong>Ignorar las mermas.</strong> Cortar un limon, pelar una patata, limpiar un pescado — todo eso genera merma. Si no la registras, tus numeros nunca cuadran.</li>
          <li><strong>No vincular compras con stock.</strong> Si el stock no se actualiza cuando recibes mercancia, siempre vas con datos atrasados.</li>
          <li><strong>Pedir a ojo.</strong> El metodo de "miro la camara y pido lo que falta" garantiza dos cosas: o te falta producto (pierdes ventas) o te sobra (pierdes dinero en caducidades).</li>
        </ol>

        <h2>Como pasar del caos al control</h2>
        <p>La transicion no tiene que ser de golpe. Un plan realista:</p>
        <ol>
          <li><strong>Semana 1-2:</strong> documenta las recetas de tus 20 platos mas vendidos. No necesitas hacerlas todas, empieza por los que mas vendes.</li>
          <li><strong>Semana 3-4:</strong> carga las recetas en el sistema y empieza a comparar stock teorico vs real. Las diferencias te diran donde hay problemas.</li>
          <li><strong>Mes 2:</strong> vincula las compras con el stock. Cada factura de proveedor debe actualizar el inventario automaticamente.</li>
          <li><strong>Mes 3+:</strong> activa las predicciones y los pedidos automaticos. Deja que el sistema aprenda de tus datos y empiece a pedir por ti.</li>
        </ol>

        <h2>Que puede hacer un sistema inteligente por ti</h2>
        <p><Link to="/stock-predictivo-restaurante">Un sistema como ALEF</Link> automatiza todo el ciclo:</p>
        <ul>
          <li><strong>Recetas:</strong> cada plato tiene su escandallo con ingredientes, cantidades y mermas.</li>
          <li><strong>Descuento automatico:</strong> cada venta descuenta stock segun la receta. En tiempo real.</li>
          <li><strong>Compras vinculadas:</strong> <Link to="/facturacion-automatica-restaurante">las facturas de proveedores se procesan automaticamente</Link> y actualizan el inventario.</li>
          <li><strong>Prediccion:</strong> analiza 8-12 semanas de historico + reservas + clima para predecir necesidades.</li>
          <li><strong>Pedidos automaticos:</strong> genera los pedidos a proveedor con los plazos de entrega correctos.</li>
          <li><strong>Alertas de margen:</strong> si un proveedor sube un precio, te dice que platos pierden rentabilidad.</li>
        </ul>

        <blockquote>El stock no es solo cuanto tienes. Es cuanto vas a necesitar, cuanto te va a costar, y cuanto margen te va a dejar. Eso es lo que separa un restaurante que reacciona de uno que anticipa.</blockquote>
      </article>

      <section className="BlogPost-cta">
        <h2>Quieres que tu stock se gestione solo?</h2>
        <p>ALEF predice necesidades, genera pedidos y protege tus margenes. Todo automatico.</p>
        <div className="BlogPost-cta-btns">
          <a href="https://softalef.com/#contacto" className="BlogPost-cta-btn BlogPost-cta-btn--primary">Solicitar demo</a>
          <Link to="/stock-predictivo-restaurante" className="BlogPost-cta-btn BlogPost-cta-btn--ghost">Ver stock predictivo</Link>
        </div>
      </section>

      <nav className="BlogPost-related">
        <h3>Articulos relacionados</h3>
        <div className="BlogPost-related-grid">
          <Link to="/blog/calcular-margenes-restaurante" className="BlogPost-related-card">Como calcular margenes reales</Link>
          <Link to="/blog/facturacion-electronica-hosteleria" className="BlogPost-related-card">Facturacion electronica para hosteleria</Link>
          <Link to="/blog/automatizacion-restaurantes-ia" className="BlogPost-related-card">Automatizacion con IA</Link>
        </div>
      </nav>
    </div>
  );
}
