import { Link } from "react-router-dom";
import SEOHead from "../../components/SEO/SEOHead";
import { ArticleStructuredData, BreadcrumbStructuredData } from "../../components/SEO/StructuredData";
import "./Blog.css";

export default function PostMargenes() {
  return (
    <div className="BlogPost">
      <SEOHead
        title="Como calcular los margenes reales de tu restaurante"
        description="El escandallo no basta. Aprende a calcular el coste real por plato incluyendo mermas, extras y variaciones de proveedor. Detecta fugas de margen antes de que sea tarde."
        path="/blog/calcular-margenes-restaurante"
        type="article"
      />
      <ArticleStructuredData title="Como calcular los margenes reales de tu restaurante" description="Guia practica de calculo de margenes en hosteleria: food cost, escandallo, mermas, pricing y proteccion de rentabilidad." path="/blog/calcular-margenes-restaurante" datePublished="2026-06-04" dateModified="2026-06-04" />
      <BreadcrumbStructuredData items={[{ name: "Inicio", path: "/" }, { name: "Blog", path: "/blog" }, { name: "Margenes de restaurante", path: "/blog/calcular-margenes-restaurante" }]} />

      <header className="BlogPost-header">
        <span className="BlogPost-tag">Finanzas</span>
        <h1>Como calcular los margenes reales de tu restaurante</h1>
        <p>La diferencia entre un restaurante rentable y uno que cierra en 3 anos suele estar en los margenes. Y la mayoria no los calcula bien.</p>
        <div className="BlogPost-meta">4 junio 2026 · 9 min lectura</div>
      </header>

      <article className="BlogPost-body">
        <h2>El problema: crees que ganas mas de lo que ganas</h2>
        <p>La mayoria de restauradores calcula el food cost dividiendo el coste de ingredientes entre el precio de venta. Si una hamburguesa cuesta 3 euros de ingredientes y la vendes a 12, tu food cost es del 25%. Genial. Pero ese numero miente.</p>
        <p>No incluye la merma (el 15-20% de producto que se pierde en limpieza, corte y preparacion). No incluye las porciones extra que el cocinero pone de mas. No incluye el producto que caduca y se tira. No incluye que el proveedor te subio un 8% hace dos meses y no te diste cuenta.</p>
        <p><strong>El food cost real suele ser entre 5 y 10 puntos superior al food cost teorico.</strong> Y esos puntos son tu margen evaporandose.</p>

        <h2>Los 4 componentes del coste real</h2>

        <h3>1. Coste de materia prima (escandallo)</h3>
        <p>Es el basico: cuanto cuestan los ingredientes de un plato. Para calcularlo bien necesitas:</p>
        <ul>
          <li>Lista de ingredientes con cantidades exactas (gramos, mililitros, unidades)</li>
          <li>Precio actualizado de cada ingrediente (no el de hace 6 meses)</li>
          <li>Factor de merma por ingrediente (un kilo de gambas peladas no es un kilo de gambas con cascara)</li>
        </ul>

        <h3>2. Merma de produccion</h3>
        <p>Pelar patatas, filetear pescado, cortar verdura — todo genera residuo. Un factor de merma del 10-30% es normal dependiendo del producto. Si no lo cuentas, tu escandallo esta mal desde la base.</p>
        <table>
          <thead><tr><th>Producto</th><th>Merma tipica</th></tr></thead>
          <tbody>
            <tr><td>Patata</td><td>15-20%</td></tr>
            <tr><td>Cebolla</td><td>10-15%</td></tr>
            <tr><td>Pescado entero</td><td>40-50%</td></tr>
            <tr><td>Carne con hueso</td><td>20-30%</td></tr>
            <tr><td>Lechuga</td><td>20-25%</td></tr>
          </tbody>
        </table>

        <h3>3. Desviacion en porciones</h3>
        <p>La receta dice 200g de carne. El cocinero pone 230g porque "queda mejor". Multiplicado por 50 hamburguesas al dia, 6 dias a la semana, son 9 kilos de carne extra al mes. A 12 euros el kilo, son 108 euros al mes en un solo plato.</p>
        <p>La solucion no es ser tacano — es saber que pasa. Si decides que la porcion sea 230g, perfecto, pero el escandallo tiene que reflejarlo.</p>

        <h3>4. Variaciones de proveedor</h3>
        <p>Los precios de tus proveedores cambian. A veces te avisan, a veces no. Si no revisas las facturas con frecuencia, puedes estar pagando un 10% mas que hace tres meses sin saberlo.</p>
        <p><Link to="/facturacion-automatica-restaurante">Un sistema que procesa facturas automaticamente</Link> detecta estos cambios al momento y te avisa antes de que se coman tu margen.</p>

        <h2>Como calcular el margen real por plato</h2>
        <p>Formula completa:</p>
        <blockquote>
          Coste real = (Ingredientes x Factor merma) + Desviacion porciones<br />
          Margen bruto = Precio venta - Coste real<br />
          Food cost real (%) = Coste real / Precio venta x 100
        </blockquote>
        <p>Ejemplo con la hamburguesa:</p>
        <table>
          <thead><tr><th>Concepto</th><th>Valor</th></tr></thead>
          <tbody>
            <tr><td>Ingredientes (escandallo)</td><td>3.00 EUR</td></tr>
            <tr><td>Merma (15%)</td><td>+0.45 EUR</td></tr>
            <tr><td>Desviacion porcion (+15%)</td><td>+0.52 EUR</td></tr>
            <tr><td><strong>Coste real</strong></td><td><strong>3.97 EUR</strong></td></tr>
            <tr><td>Precio venta</td><td>12.00 EUR</td></tr>
            <tr><td>Food cost real</td><td>33.1%</td></tr>
          </tbody>
        </table>
        <p>Pasamos del 25% teorico al 33% real. 8 puntos de diferencia. En un restaurante que vende 200 hamburguesas al mes, eso son casi 200 euros de margen perdido en un solo plato.</p>

        <h2>Que food cost es aceptable</h2>
        <table>
          <thead><tr><th>Tipo de restaurante</th><th>Food cost objetivo</th></tr></thead>
          <tbody>
            <tr><td>Fast food / casual</td><td>25-30%</td></tr>
            <tr><td>Restaurante medio</td><td>28-35%</td></tr>
            <tr><td>Fine dining</td><td>30-40%</td></tr>
            <tr><td>Barra / tapas</td><td>22-28%</td></tr>
          </tbody>
        </table>
        <p>Lo importante no es el numero absoluto sino <strong>que lo conozcas y lo controles</strong>. Un food cost del 35% esta bien si lo sabes y lo has decidido. Un food cost del 35% que tu crees que es del 25% te va a llevar a cerrar.</p>

        <h2>Como proteger tus margenes de forma automatica</h2>
        <p><Link to="/stock-predictivo-restaurante">ALEF calcula el food cost real de cada plato</Link> cruzando las recetas con los precios reales de las facturas de tus proveedores. Si un precio sube, te avisa al momento y te dice exactamente que platos pierden margen y cuanto.</p>
        <p>El <Link to="/automatizacion-restaurante">menu engineering automatico</Link> analiza cada semana que platos venden mucho y dan margen (estrellas), cuales venden poco y no dan margen (perros), y te sugiere acciones concretas: subir precio, promocionar, reformular o retirar.</p>

        <blockquote>El margen no se protege con intuicion. Se protege con datos actualizados, alertas automaticas y decisiones informadas.</blockquote>
      </article>

      <section className="BlogPost-cta">
        <h2>Quieres saber el margen real de cada plato?</h2>
        <p>ALEF calcula el food cost real cruzando recetas con facturas de proveedor. Automatico.</p>
        <div className="BlogPost-cta-btns">
          <a href="https://softalef.com/#contacto" className="BlogPost-cta-btn BlogPost-cta-btn--primary">Solicitar demo</a>
          <Link to="/stock-predictivo-restaurante" className="BlogPost-cta-btn BlogPost-cta-btn--ghost">Ver control de margenes</Link>
        </div>
      </section>

      <nav className="BlogPost-related">
        <h3>Articulos relacionados</h3>
        <div className="BlogPost-related-grid">
          <Link to="/blog/control-stock-restaurante-guia" className="BlogPost-related-card">Guia de control de stock</Link>
          <Link to="/blog/facturacion-electronica-hosteleria" className="BlogPost-related-card">Facturacion electronica</Link>
          <Link to="/blog/que-es-verifactu-restaurantes" className="BlogPost-related-card">Que es VeriFactu</Link>
        </div>
      </nav>
    </div>
  );
}
