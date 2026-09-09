// src/utils/pdfs/pedidoProveedorPDF.js
//
// Genera un PDF A4 "Pedido a proveedor": banda con el celeste de Alef, emisor/receptor,
// tabla de líneas y notas. Se usa desde el flujo "Hacer pedido".
//
// ⚖️ D-451 · ESTE DOCUMENTO NO LLEVA PRECIOS, y es deliberado. Es lo que se le manda al
// PROVEEDOR para decirle QUÉ se le pide; el precio lo pone él y viaja en SU factura, que es
// el documento contra el que después se concilia. Nuestro precio estimado en este papel
// invita a leerlo como un precio acordado. Los importes siguen existiendo dentro de la
// aplicación: lo que no hacen es salir de casa.
//
// Entrada:
//   - emisor: { nombre, nif, email, telefono, direccion }
//   - proveedor: { nombre, nif, email, telefono, direccion }
//   - pedido: {
//       numeroPedido,
//       fechaPedido (Date|string),
//       fechaEsperada (Date|string|null),
//       notas,
//       lineas: [{ nombre, formato, cantidad }],   // ⚠️ los importes NO se imprimen (D-451)
//     }
//
// Salida: el PDF se descarga al disco con `doc.save(...)`. Si `opts.returnDoc`
// está en true, devuelve el jsPDF sin guardar para casos avanzados.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function fmtDate(v) {
  if (!v) return "—";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

function shortFromId(id) {
  if (!id) return String(Date.now()).slice(-8);
  return String(id).slice(-8).toUpperCase();
}

// ⚠️ AQUI HABIA UN `currencySymbol` Y LO HE QUITADO YO, en el mismo lote que lo dejo inutil.
// Al retirar los precios (abajo) la variable se quedo declarada y sin consumir, y el comentario
// que la justificaba —«el importe tiene que ir en la moneda del restaurante»— paso a hablar de
// unos importes que ya no se imprimen. Es D-446 exacto, cometido por mi: una variable muerta
// mas un comentario que la respalda es peor que la variable sola, porque el comentario convence.
// Si algun dia este documento vuelve a llevar importes, la moneda vuelve con ellos.
export function generarPedidoProveedorPDF({ emisor, proveedor, pedido, opts = {} }) {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;

  // ⚖️ D-451 · EL CELESTE DE ALEF, no el morado que habia.
  // `#60b5ff` es el color de marca del panel: 225 apariciones en su CSS, con variable propia
  // `--cli-primary`. El morado [106,13,173] no aparece en ninguna otra parte del producto: por
  // eso este PDF desentonaba con todo lo demas que ve el cliente.
  const alef = [96, 181, 255];        // #60b5ff
  const alefDark = [47, 126, 216];    // #2f7ed8 — el mismo tono oscuro que usa el panel
  const darkText = [30, 30, 30];
  const grayText = [120, 120, 120];

  const fechaPedido = fmtDate(pedido.fechaPedido || new Date());
  const fechaEsp = fmtDate(pedido.fechaEsperada);
  const numPedido = pedido.numeroPedido || shortFromId(pedido._id);

  // Header púrpura
  doc.setFillColor(...alef);
  doc.rect(0, 0, pageW, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text("PEDIDO A PROVEEDOR", margin, 16);
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(`N.º ${numPedido}`, margin, 24);
  doc.text(`Fecha: ${fechaPedido}`, margin, 30);
  doc.text(`Entrega estimada: ${fechaEsp}`, pageW - margin, 24, { align: "right" });

  // Emisor + proveedor
  let y = 46;
  const drawBlock = (title, data, x, maxW) => {
    doc.setFontSize(7);
    doc.setTextColor(...grayText);
    doc.setFont(undefined, "bold");
    doc.text(title.toUpperCase(), x, y);
    doc.setFontSize(11);
    doc.setTextColor(...darkText);
    doc.setFont(undefined, "bold");
    doc.text(data.nombre || "—", x, y + 6);
    doc.setFontSize(8.5);
    doc.setFont(undefined, "normal");
    doc.setTextColor(...grayText);
    let lineY = y + 12;
    if (data.nif) { doc.text(`NIF/CIF: ${data.nif}`, x, lineY); lineY += 4.5; }
    if (data.direccion) {
      const lines = doc.splitTextToSize(data.direccion, maxW);
      doc.text(lines, x, lineY);
      lineY += lines.length * 4.5;
    }
    if (data.telefono) { doc.text(`Tel: ${data.telefono}`, x, lineY); lineY += 4.5; }
    if (data.email) { doc.text(data.email, x, lineY); lineY += 4.5; }
    return lineY;
  };

  const half = (pageW - margin * 2) / 2;
  const y1 = drawBlock("De", emisor, margin, half - 5);
  const y2 = drawBlock("Para", proveedor, margin + half + 5, half - 5);
  y = Math.max(y1, y2) + 6;

  doc.setDrawColor(220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // ⚖️ D-451 · SIN PRECIOS. Decision de Valen, y es correcta: este documento se le manda al
  // PROVEEDOR para decirle QUE se le pide. El precio lo pone el, y se ve en SU factura — que es
  // el documento que despues se concilia contra el pedido. Poner aqui nuestro precio estimado
  // invita justo al error que no queremos: que alguien lo lea como un precio acordado.
  // ⚠️ Los importes NO se borran del pedido: siguen en la aplicacion (`Analytics`, `Facturado`,
  // conciliacion). Lo que cambia es que no viajan en el papel que sale de casa.
  const body = (pedido.lineas || []).map((l, i) => [
    String(i + 1),
    l.nombre || "—",
    l.formato || "",
    String(Number(l.cantidad || 0)),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["#", "Producto", "Formato / presentacion", "Cantidad"]],
    body,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: alef, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      3: { halign: "center", cellWidth: 26, fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [240, 248, 255] }, // celeste muy claro, no lila
  });

  // ⚖️ D-451 · Donde estaban los totales va ahora lo que un pedido SI tiene que dejar claro:
  // cuantas lineas y cuantas unidades, para que quien prepara la mercancia pueda cuadrarlo de un
  // vistazo, y donde entregar. Sin importes.
  const finalY = doc.lastAutoTable.finalY + 8;
  const nLineas = (pedido.lineas || []).length;
  const nUds = (pedido.lineas || []).reduce((a, l) => a + Number(l.cantidad || 0), 0);

  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...darkText);
  doc.text(`${nLineas} ${nLineas === 1 ? "referencia" : "referencias"}  ·  ${nUds} ${nUds === 1 ? "unidad" : "unidades"}`, margin, finalY);

  doc.setDrawColor(...alefDark);
  doc.setLineWidth(0.5);
  doc.line(margin, finalY + 3, margin + 70, finalY + 3);

  // Direccion de entrega: es el dato que el proveedor necesita y que antes no se destacaba.
  if (emisor.direccion) {
    doc.setFontSize(7);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...grayText);
    doc.text("ENTREGAR EN", pageW - margin - 70, finalY - 4);
    doc.setFontSize(8.5);
    doc.setFont(undefined, "normal");
    doc.setTextColor(...darkText);
    doc.text(doc.splitTextToSize(emisor.direccion, 70), pageW - margin - 70, finalY);
  }

  // Notas
  if (pedido.notas && String(pedido.notas).trim()) {
    const notasY = finalY + 28;
    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...grayText);
    doc.text("OBSERVACIONES", margin, notasY);
    doc.setFont(undefined, "normal");
    const notasLines = doc.splitTextToSize(String(pedido.notas).trim(), pageW - margin * 2);
    doc.text(notasLines, margin, notasY + 5);
  }

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(180);
  doc.text(`Generado el ${new Date().toLocaleString("es-ES")} — ${emisor.nombre || ""}`, margin, pageH - 8);
  doc.text("softalef.com", pageW - margin, pageH - 8, { align: "right" });

  if (opts.returnDoc) return doc;

  const safeProv = String(proveedor.nombre || "proveedor").replace(/\s+/g, "_");
  doc.save(`pedido_${safeProv}_${numPedido}.pdf`);
  return doc;
}
