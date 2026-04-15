// src/utils/pdfs/pedidoProveedorPDF.js
//
// Genera un PDF A4 "Pedido a proveedor" con la plantilla estándar (banda púrpura
// + emisor/receptor + tabla de líneas + totales + notas). Se usa tanto desde el
// modal de detalle de pedido como desde el flujo nuevo "Hacer pedido" bulk.
//
// Entrada:
//   - emisor: { nombre, nif, email, telefono, direccion }
//   - proveedor: { nombre, nif, email, telefono, direccion }
//   - pedido: {
//       numeroPedido,
//       fechaPedido (Date|string),
//       fechaEsperada (Date|string|null),
//       notas,
//       lineas: [{ nombre, formato, cantidad, precioUnitario, iva, totalLinea }],
//       subtotal, totalIva, total,
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

export function generarPedidoProveedorPDF({ emisor, proveedor, pedido, opts = {} }) {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;

  const purple = [106, 13, 173];
  const darkText = [30, 30, 30];
  const grayText = [120, 120, 120];

  const fechaPedido = fmtDate(pedido.fechaPedido || new Date());
  const fechaEsp = fmtDate(pedido.fechaEsperada);
  const numPedido = pedido.numeroPedido || shortFromId(pedido._id);

  // Header púrpura
  doc.setFillColor(...purple);
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

  // Tabla
  const body = (pedido.lineas || []).map((l, i) => [
    String(i + 1),
    l.nombre || "—",
    l.formato || "",
    String(Number(l.cantidad || 0)),
    `${Number(l.precioUnitario || 0).toFixed(2)} €`,
    `${Number(l.iva || 0)}%`,
    `${Number(l.totalLinea || 0).toFixed(2)} €`,
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["#", "Producto", "Formato", "Cant.", "Precio ud.", "IVA", "Total"]],
    body,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: purple, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      3: { halign: "center", cellWidth: 14 },
      4: { halign: "right", cellWidth: 24 },
      5: { halign: "center", cellWidth: 14 },
      6: { halign: "right", cellWidth: 24 },
    },
    alternateRowStyles: { fillColor: [250, 248, 255] },
  });

  // Totales
  const finalY = doc.lastAutoTable.finalY + 6;
  const drawTotal = (label, value, yPos, bold) => {
    doc.setFontSize(bold ? 11 : 9.5);
    doc.setFont(undefined, bold ? "bold" : "normal");
    doc.setTextColor(...(bold ? darkText : grayText));
    doc.text(label, pageW - margin - 50, yPos, { align: "right" });
    doc.setTextColor(...darkText);
    doc.text(`${Number(value || 0).toFixed(2)} €`, pageW - margin, yPos, { align: "right" });
  };
  drawTotal("Subtotal", pedido.subtotal, finalY, false);
  drawTotal("IVA", pedido.totalIva, finalY + 6, false);
  doc.setDrawColor(...purple);
  doc.setLineWidth(0.5);
  doc.line(pageW - margin - 60, finalY + 10, pageW - margin, finalY + 10);
  drawTotal("TOTAL", pedido.total, finalY + 17, true);

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
