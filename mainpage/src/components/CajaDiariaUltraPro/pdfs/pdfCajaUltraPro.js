// ./pdfs/pdfCajaUltraPro.js
// PDF profesional de Caja Diaria — sin capturas de gráficos, datos puros.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const money = (n) =>
  new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(Number(n || 0)) + " €";

const fmtDate = (iso) => {
  if (!iso) return "—";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "—";
};

const safePct = (v) => (Number.isFinite(v) ? `${v > 0 ? "+" : ""}${v.toFixed(1)}%` : "—");

export const generarPDFCaja = ({
  datos = [],
  fechaInicio,
  fechaFin,
  brand = { nombre: "Restaurante", primary: "#1a1a2e" },
}) => {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16; // margen
  let y = 0;

  // ── HEADER ──
  doc.setFillColor(26, 26, 46); // dark navy
  doc.rect(0, 0, W, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Informe de Caja", M, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(brand?.nombre || "Restaurante", M, 22);
  doc.text(`${fmtDate(fechaInicio)}  —  ${fmtDate(fechaFin)}`, M, 27);

  doc.setFontSize(8);
  doc.setTextColor(180, 180, 200);
  doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, W - M, 27, { align: "right" });

  y = 40;

  // ── KPIs ──
  const totalIngresos = datos.reduce((s, d) => s + Number(d.total || 0), 0);
  const totalTickets = datos.reduce((s, d) => s + Number(d.numTickets || 0), 0);
  const ticketMedio = totalTickets > 0 ? totalIngresos / totalTickets : 0;
  const dias = datos.length;
  const mediaDiaria = dias > 0 ? totalIngresos / dias : 0;

  const mejor = datos.length ? datos.reduce((a, b) => (Number(a.total) > Number(b.total) ? a : b)) : null;
  const peor = datos.length ? datos.reduce((a, b) => (Number(a.total) < Number(b.total) ? a : b)) : null;

  // KPI grid: 3 columnas × 2 filas
  const kpis = [
    { label: "INGRESOS TOTALES", value: money(totalIngresos) },
    { label: "TICKETS", value: String(totalTickets) },
    { label: "TICKET MEDIO", value: money(ticketMedio) },
    { label: "MEDIA DIARIA", value: money(mediaDiaria) },
    { label: "MEJOR DÍA", value: mejor ? `${fmtDate(mejor.fecha)} (${money(mejor.total)})` : "—" },
    { label: "PEOR DÍA", value: peor ? `${fmtDate(peor.fecha)} (${money(peor.total)})` : "—" },
  ];

  const cols = 3;
  const cellW = (W - M * 2 - 6) / cols;
  const cellH = 14;

  kpis.forEach((kpi, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = M + col * (cellW + 3);
    const yy = y + row * (cellH + 4);

    // Fondo suave
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(x, yy, cellW, cellH, 2, 2, "F");

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 140);
    doc.text(kpi.label, x + 3, yy + 5);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 46);
    doc.text(kpi.value, x + 3, yy + 11);
  });

  y += Math.ceil(kpis.length / cols) * (cellH + 4) + 8;

  // ── Separador ──
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 6;

  // ── TABLA DIARIA ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(26, 26, 46);
  doc.text("Desglose diario", M, y);
  y += 5;

  const rows = datos.map((d, i) => {
    const curr = Number(d.total || 0);
    const prev = i > 0 ? Number(datos[i - 1]?.total || 0) : curr;
    const pct = i === 0 ? 0 : (prev > 0 ? ((curr - prev) / prev) * 100 : 0);

    return [
      fmtDate(d.fecha),
      money(curr),
      String(d.numTickets || 0),
      d.numTickets > 0 ? money(curr / d.numTickets) : "—",
      i === 0 ? "—" : safePct(pct),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Fecha", "Ingresos", "Tickets", "Ticket medio", "vs anterior"]],
    body: rows,
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [40, 40, 50],
      lineColor: [230, 230, 235],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [26, 26, 46],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 252],
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { halign: "right", fontStyle: "bold" },
      2: { halign: "center" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: M, right: M },
    didParseCell: (data) => {
      // Color variación: verde positivo, rojo negativo
      if (data.section === "body" && data.column.index === 4) {
        const val = data.cell.raw;
        if (val && val.startsWith("+")) data.cell.styles.textColor = [22, 163, 74];
        else if (val && val.startsWith("-")) data.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  // ── FOOTER en todas las páginas ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 170);
    doc.text(
      `${brand?.nombre || "Restaurante"}  ·  Informe de Caja  ·  Página ${i}/${pages}`,
      W / 2, H - 6, { align: "center" }
    );
  }

  doc.save(`caja_${fechaInicio || "inicio"}_${fechaFin || "fin"}.pdf`);
};
