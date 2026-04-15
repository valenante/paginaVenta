import React, { useState } from "react";

export default function PreciosHelpModal({ open, onClose }) {
  const [tab, setTab] = useState("precios");

  if (!open) return null;

  const Tab = ({ id, label }) => (
    <button
      type="button"
      className={`help-tab ${tab === id ? "is-active" : ""}`}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );

  return (
    <div className="precios-help-overlay" onClick={onClose}>
      <div
        className="precios-help-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="help-tabs">
          <Tab id="precios" label="💰 Variantes de precio" />
          <Tab id="adicionales" label="➕ Adicionales/Extras" />
          <Tab id="receta" label="🧪 Receta por variante" />
          <Tab id="compuesto" label="🧩 Productos compuestos" />
        </div>

        {tab === "precios" && (
          <>
        <h3>💡 Cómo funcionan las variantes de precio</h3>
        <p>
          Cada producto puede tener una o varias variantes (ej: una botella de vino que también
          se vende por copa). Cada variante tiene su precio, su coste y su peso sobre el stock.
        </p>

        <h4>Campos</h4>
        <ul>
          <li>
            <strong>Clave</strong>: identificador interno (sin espacios). Ejemplos:{" "}
            <code>copa</code>, <code>botella</code>, <code>tapa</code>, <code>racion</code>,{" "}
            <code>precioBase</code>. Sirve para que el sistema identifique la variante en
            cocina, ticket y reportes. La etiqueta visible al cliente se genera automáticamente
            a partir de la clave (<code>copa</code> → "Copa").
          </li>
          <li>
            <strong>Detalle</strong> (opcional): texto aclaratorio que se muestra junto al
            precio. Ejemplos: <code>200 ml</code>, <code>6 croquetas</code>,{" "}
            <code>media ración</code>.
          </li>
          <li>
            <strong>Precio (€)</strong>: lo que paga el cliente por esta variante (con IVA si lo
            aplicas en carta).
          </li>
          <li>
            <strong>Coste (€)</strong>: lo que te cuesta a ti producir/comprar una unidad de
            esta variante. Lo usa el módulo Finanzas para calcular margen real.
          </li>
          <li>
            <strong>Factor stock</strong>: qué fracción de stock consume cada venta de esta
            variante. Botella entera = <code>1</code>. Si una botella da 5 copas, Copa ={" "}
            <code>0.2</code>. Si una ración se sirve también como media, Media ={" "}
            <code>0.5</code>.
          </li>
        </ul>

        <h4>Ejemplo: vino "Aire de Protos Rosé"</h4>
        <table className="precios-help-table">
          <thead>
            <tr>
              <th>Variante</th>
              <th>Precio</th>
              <th>Coste</th>
              <th>Factor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Copa</td>
              <td>5 €</td>
              <td>2,40 €</td>
              <td>0.2</td>
            </tr>
            <tr>
              <td>Botella</td>
              <td>25 €</td>
              <td>12 €</td>
              <td>1</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "0.5rem" }}>
          Con stock = <code>5</code> botellas: vender 1 copa lo deja en <code>4.8</code>{" "}
          (mostrado como "4 botellas + 4 copas"). Vender 1 botella lo deja en <code>3.8</code>.
        </p>

        <h4>Notas</h4>
        <ul>
          <li>
            La <strong>primera variante</strong> es la principal: aparece por defecto en la
            carta y como "precio base".
          </li>
          <li>
            Si tu producto solo tiene un precio (ej: una tapa fija), deja una sola variante con
            clave <code>precioBase</code> y factor <code>1</code>.
          </li>
        </ul>
          </>
        )}

        {tab === "adicionales" && (
          <>
            <h3>➕ Adicionales y Extras con stock</h3>
            <p>
              Los <strong>adicionales</strong> son opciones que el cliente puede añadir al
              producto: <em>extra queso</em>, <em>pan aparte</em>, <em>sin cebolla</em>…
            </p>
            <p>
              Cada adicional puede ser de dos tipos, controlado por el toggle{" "}
              <strong>Descuenta stock</strong>:
            </p>

            <h4>1. Modificador de precio (toggle OFF)</h4>
            <ul>
              <li>Solo suma al precio del plato. No toca stock.</li>
              <li>
                Uso típico: opciones conceptuales como <code>Sin cebolla</code>,{" "}
                <code>Bien hecho</code>, <code>Poco hecho</code>.
              </li>
            </ul>

            <h4>2. Con descuento de stock (toggle ON)</h4>
            <ul>
              <li>
                Se vincula a un <strong>producto del catálogo</strong> (ej: el producto{" "}
                <code>Queso mozzarella</code> con su stock y/o receta).
              </li>
              <li>
                Al vender el plato con este adicional, el sistema descuenta del stock del
                producto vinculado: <code>cantidad × unidades vendidas</code>.
              </li>
              <li>
                La <strong>cantidad por unidad</strong> es cuánto consume cada adicional:
                <ul>
                  <li>Extra queso de 30 g → pon <code>30</code>.</li>
                  <li>1 pan extra → pon <code>1</code>.</li>
                </ul>
              </li>
            </ul>

            <h4>Ejemplo: hamburguesa con "Extra queso"</h4>
            <ul>
              <li>Adicional "Extra queso" precio = <code>1.50 €</code>.</li>
              <li>Toggle ON, vinculado a producto "Queso mozzarella", cantidad = <code>30</code>.</li>
              <li>
                Si vendes 2 hamburguesas con el adicional → "Queso mozzarella" pierde{" "}
                <code>60 g</code> de stock.
              </li>
            </ul>

            <h4>Diferencia entre "Adicionales" y "Extras"</h4>
            <ul>
              <li>
                <strong>Adicionales</strong>: definidos POR producto. "Extra queso" solo aparece
                en la hamburguesa.
              </li>
              <li>
                <strong>Extras</strong>: definidos en la sección "Extras" del panel. Se pueden
                reutilizar en cualquier producto. Misma lógica de vincular a producto + stock.
              </li>
            </ul>
          </>
        )}

        {tab === "receta" && (
          <>
            <h3>🧪 Recetas con cantidad por variante</h3>
            <p>
              Si tu producto tiene varias variantes (tapa/ración, copa/botella…) con consumos
              distintos, cada ingrediente de la receta puede aplicar a:
            </p>
            <ul>
              <li>
                <strong>Universal</strong>: aplica a TODAS las variantes. Ej: la mayonesa de la
                ensalada rusa va en tapa y en ración.
              </li>
              <li>
                <strong>Solo una variante</strong>: aplica únicamente cuando se vende esa variante.
                Ej: la ración usa 160 g de patata, la tapa usa 80 g → dos líneas separadas.
              </li>
            </ul>

            <h4>Ejemplo: ensalada rusa</h4>
            <table className="precios-help-table">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Cantidad</th>
                  <th>Aplica a</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Mayonesa</td><td>50 g</td><td>Universal</td></tr>
                <tr><td>Patata</td><td>80 g</td><td>Solo tapa</td></tr>
                <tr><td>Patata</td><td>160 g</td><td>Solo ración</td></tr>
              </tbody>
            </table>

            <h4>factorStock con recetas por variante</h4>
            <p>
              Cuando activas recetas por variante (alguna línea con "Solo X"), los ingredientes{" "}
              <strong>universales</strong> se multiplican por el <code>factorStock</code> de la
              variante vendida. Si tu ración tiene factorStock = 2 y tapa = 1, la mayonesa
              universal descuenta <code>50 g × 1 = 50 g</code> en tapa y{" "}
              <code>50 g × 2 = 100 g</code> en ración.
            </p>
            <p>
              <strong>Si prefieres que un universal sea fijo</strong> en todas las variantes,
              marca el ingrediente como específico en cada variante con la misma cantidad (ej:
              mayonesa 50 g solo tapa + mayonesa 50 g solo ración).
            </p>
          </>
        )}

        {tab === "compuesto" && (
          <>
            <h3>🧩 Productos compuestos: menús y surtidos</h3>
            <p>
              Un producto compuesto agrupa varios productos hijos. El <strong>precio del padre
              manda</strong>; cada hijo descuenta stock de su producto real del catálogo al
              vender.
            </p>

            <h4>Componentes fijos (menú del día)</h4>
            <p>
              Hijos que <strong>siempre acompañan</strong> al padre. El camarero no elige nada,
              se añaden automáticamente.
            </p>
            <ul>
              <li>
                Ejemplo: Menú del día <code>15 €</code> con componentes:
                <code>Ensalada</code> × 1, <code>Plato del día</code> × 1, <code>Postre</code>{" "}
                × 1, <code>Bebida</code> × 1.
              </li>
              <li>
                Al vender 1 menú se crea una venta con el precio del padre (15 €) y el stock
                baja en cada uno de los 4 hijos.
              </li>
              <li>
                El padre NO tiene receta propia — los hijos llevan la contabilidad real.
              </li>
            </ul>

            <h4>Grupos seleccionables (surtido)</h4>
            <p>
              El cliente <strong>elige entre varias opciones</strong> hasta completar un total.
            </p>
            <ul>
              <li>
                Ejemplo: "Elige 6 croquetas" con opciones{" "}
                <code>[Jamón, Rabo, Cochinillo]</code>.
              </li>
              <li>
                <strong>Total a elegir</strong>: cuántos slots hay que distribuir (6 en el
                ejemplo).
              </li>
              <li>
                <strong>Mín./máx. por opción</strong>: opcional. Ej: mín. 2 de cada → obliga a
                variedad. Máx. 4 de cada → evita pedir 6 del mismo.
              </li>
              <li>
                <strong>Cantidad por slot</strong>: normalmente 1. Si cada slot descuenta 2
                unidades del producto elegido, pon 2.
              </li>
              <li>
                En el TPV aparece un bloque con +/− donde el camarero distribuye hasta llegar
                al total. "Agregar" se desbloquea cuando la suma = total.
              </li>
            </ul>

            <h4>Reglas importantes</h4>
            <ul>
              <li>
                <strong>Precio</strong>: el del padre. La suma de precios de los hijos se
                ignora.
              </li>
              <li>
                <strong>Stock</strong>: cada hijo descuenta del suyo (receta o directo con{" "}
                <code>factorStock</code>).
              </li>
              <li>
                <strong>Venta</strong>: se crea UNA venta con el producto padre (no se duplica
                con ventas de hijos).
              </li>
              <li>
                Un producto puede ser padre e hijo a la vez (ej: "Plato del día" aparece en el
                menú y también se vende suelto).
              </li>
              <li>
                Los adicionales del hijo (si los tiene) se procesan cuando el hijo se vende
                suelto, no automáticamente por aparecer en un padre.
              </li>
            </ul>
          </>
        )}

        <button type="button" className="help-close" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}
