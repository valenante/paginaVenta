// ./pdfs/pdfCajaUltraPro.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const money = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
    Number(n || 0)
  );

const fmtISOToES = (iso) => {
  if (!iso) return "—";
  // iso esperado: YYYY-MM-DD
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "—";
  return `${m[3]}/${m[2]}/${m[1]}`;
};

const safePct = (v) => (Number.isFinite(v) ? `${v.toFixed(1)}%` : "0.0%");

const hexToRgb = (hex) => {
  if (!hex) return [0, 0, 0];

  const h = hex.replace("#", "");

  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
};

export const generarPDFCaja = ({
  datos = [],
  fechaInicio,
  fechaFin,
  heatmapDataURL = null,
  chartDataURL = null,
  brand = { nombre: "Alef", primary: "#60b5ff", accent: "#ff9149" },
}) => {
  const PRIMARY = brand?.primary || "#60b5ff";
  const ACCENT = brand?.accent || "#ff9149";

  const PRIMARY_RGB = hexToRgb(PRIMARY);

  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const margin = 14;
  let y = 18;

  // ===== Header pro (barra morada + acento naranja) =====
  doc.setFillColor(PRIMARY);
  doc.rect(0, 0, pageW, 26, "F");

  doc.setFillColor(ACCENT);
  doc.rect(0, 26, pageW, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Caja Diaria", margin, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${brand?.nombre || "Alef"}`, pageW - margin, 12, { align: "right" });
  doc.text(
    `Periodo: ${fmtISOToES(fechaInicio)} → ${fmtISOToES(fechaFin)}`,
    pageW - margin,
    18,
    { align: "right" }
  );

  y = 36;

  // ===== KPIs =====
  const totalIngresos = datos.reduce((acc, d) => acc + Number(d.total || 0), 0);
  const totalTickets = datos.reduce((acc, d) => acc + Number(d.numTickets || 0), 0);
  const ticketMedio = totalTickets > 0 ? totalIngresos / totalTickets : 0;

  const mejor = datos.length
    ? datos.reduce((a, b) => (Number(a.total) > Number(b.total) ? a : b))
    : null;
  const peor = datos.length
    ? datos.reduce((a, b) => (Number(a.total) < Number(b.total) ? a : b))
    : null;

  const kpi = [
    { label: "Ingresos totales", value: money(totalIngresos) },
    { label: "Tickets", value: String(totalTickets) },
    { label: "Ticket medio", value: money(ticketMedio) },
    { label: "Mejor día", value: mejor ? `${fmtISOToES(mejor.fecha)} (${money(mejor.total)})` : "—" },
    { label: "Peor día", value: peor ? `${fmtISOToES(peor.fecha)} (${money(peor.total)})` : "—" },
  ];

  const cardW = (pageW - margin * 2 - 8) / 2;
  const cardH = 16;

  doc.setTextColor(20, 20, 20);

  kpi.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = margin + col * (cardW + 8);
    const yy = y + row * (cardH + 6);

    // tarjeta
    doc.setDrawColor(230);
    doc.setFillColor(250);
    doc.roundedRect(x, yy, cardW, cardH, 3, 3, "FD");

    // mini-acento
    doc.setFillColor(ACCENT);
    doc.roundedRect(x, yy, 3, cardH, 3, 3, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(item.label, x + 6, yy + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(item.value, x + 6, yy + 13);
  });

  y += Math.ceil(kpi.length / 2) * (cardH + 6) + 6;

  // ===== Chart =====
  if (chartDataURL) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Ingresos por día", margin, y);
    y += 4;

    const imgW = pageW - margin * 2;
    const imgH = 60;

    doc.setDrawColor(230);
    doc.roundedRect(margin, y, imgW, imgH, 3, 3, "S");
    doc.addImage(chartDataURL, "PNG", margin, y, imgW, imgH);

    y += imgH + 10;
  }

  // ===== Heatmap =====
  if (heatmapDataURL) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Heatmap semanal", margin, y);
    y += 4;

    const imgW = pageW - margin * 2;
    const imgH = 55;

    doc.setDrawColor(230);
    doc.roundedRect(margin, y, imgW, imgH, 3, 3, "S");
    doc.addImage(heatmapDataURL, "PNG", margin, y, imgW, imgH);

    y += imgH + 10;
  }

  // ===== Tabla (con variación día a día) =====
  const rows = datos.map((d, i) => {
    const prev = i > 0 ? Number(datos[i - 1]?.total || 0) : 0;
    const curr = Number(d.total || 0);
    const diff = curr - prev;
    const pct = prev > 0 ? (diff / prev) * 100 : 0;

    return [
      fmtISOToES(d.fecha),
      money(curr),
      String(d.numTickets || 0),
      (i === 0 ? "0.0%" : safePct(pct)),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Fecha", "Ingresos", "Tickets", "Variación"]],
    body: rows,
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      lineColor: [235, 235, 235],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: PRIMARY_RGB,
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // ===== Footer con numeración =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `Generado: ${new Date().toLocaleString("es-ES")}  ·  Página ${i}/${pageCount}`,
      margin,
      pageH - 8
    );
  }

  doc.save(`caja_${fechaInicio || "inicio"}_${fechaFin || "fin"}.pdf`);
};
