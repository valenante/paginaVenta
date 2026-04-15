import React from "react";

export default function PreciosHelpModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="precios-help-overlay" onClick={onClose}>
      <div
        className="precios-help-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
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

        <button type="button" className="help-close" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}
