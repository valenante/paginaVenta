// src/components/CajaDiaria/pdfs/pdfCajaUltraPro.js
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Recibe:
 *  - datos: [{ createdAt, total, numTickets }]
 *  - fechaInicio, fechaFin
 *  - heatmapDataURL (opcional)
 *  - chartDataURL (opcional)
 */
export async function generarPDFCaja({
  datos,
  fechaInicio,
  fechaFin,
  heatmapDataURL = null,
  chartDataURL = null,
}) {
  try {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4 vertical
    const { width } = page.getSize();

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 800;

    /* ===========================
       🟣 PORTADA / TÍTULO
       =========================== */
    page.drawText(" Informe de Caja — Ultra PRO", {
      x: 50,
      y,
      size: 26,
      font: bold,
      color: rgb(0.42, 0.05, 0.68), // morado Alef
    });

    y -= 40;

    page.drawText(`Periodo analizado: ${fechaInicio} -> ${fechaFin}`, {
      x: 50,
      y,
      size: 12,
      font,
      color: rgb(1, 1, 1),
    });

    y -= 40;

    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.4, 0.4, 0.4),
    });

    y -= 40;

    /* ===========================
       🧮 KPI PRINCIPALES
       =========================== */
    const totalIngresos = datos.reduce((acc, d) => acc + d.total, 0);
    const totalTickets = datos.reduce((acc, d) => acc + d.numTickets, 0);
    const ticketMedio =
      totalTickets > 0 ? (totalIngresos / totalTickets).toFixed(2) : 0;

    const diaMasFuerte = datos.reduce((a, b) =>
      a.total > b.total ? a : b
    );
    const diaMasDebil = datos.reduce((a, b) =>
      a.total < b.total ? a : b
    );

    page.drawText("RESUMEN EJECUTIVO", {
      x: 50,
      y,
      size: 18,
      font: bold,
      color: rgb(1, 0.55, 0), // naranja Alef
    });

    y -= 30;

    const kpi = [
      ["Ingresos totales", `${totalIngresos.toFixed(2)} €`],
      ["Tickets totales", `${totalTickets}`],
      ["Ticket medio", `${ticketMedio} €`],
      [
        "Mejor día",
        `${new Date(diaMasFuerte.createdAt).toLocaleDateString()} — ${diaMasFuerte.total.toFixed(2)} €`,
      ],
      [
        "Peor día",
        `${new Date(diaMasDebil.createdAt).toLocaleDateString()} — ${diaMasDebil.total.toFixed(2)} €`,
      ],
    ];

    for (const [label, value] of kpi) {
      page.drawText(label, { x: 50, y, size: 12, font: bold });
      page.drawText(value, { x: 260, y, size: 12, font });
      y -= 20;
    }

    y -= 20;

    /* ===========================
       📈 GRÁFICO (OPCIONAL)
       =========================== */
    if (chartDataURL) {
      const img = await pdf.embedPng(chartDataURL);
      const w = 470;
      const h = (img.height / img.width) * w;

      page.drawImage(img, {
        x: 60,
        y: y - h,
        width: w,
        height: h,
      });

      y -= h + 40;
    }

    /* ====================================
       🔥 HEATMAP SEMANAL (OPCIONAL)
       ==================================== */
    if (heatmapDataURL) {
      const img = await pdf.embedPng(heatmapDataURL);
      const w = 470;
      const h = (img.height / img.width) * w;

      page.drawText("Mapa de calor semanal", {
        x: 50,
        y,
        size: 16,
        font: bold,
        color: rgb(0.9, 0.9, 1),
      });

      y -= 30;

      page.drawImage(img, {
        x: 60,
        y: y - h,
        width: w,
        height: h,
      });

      y -= h + 40;
    }

    /* ===========================
       📅 LISTADO DETALLADO
       =========================== */
    page.drawText("Detalle día por día", {
      x: 50,
      y,
      size: 16,
      font: bold,
      color: rgb(1, 1, 1),
    });

    y -= 25;

    for (const d of datos) {
      if (y < 100) {
        // Nueva página
        y = 750;
        pdf.addPage();
      }

      page.drawText(
        new Date(d.createdAt).toLocaleDateString(),
        { x: 50, y, size: 12, font: bold }
      );

      page.drawText(`${d.total.toFixed(2)} €`, {
        x: 200,
        y,
        size: 12,
        font,
      });

      page.drawText(`${d.numTickets} tickets`, {
        x: 320,
        y,
        size: 12,
        font,
      });

      y -= 18;
    }

    /* ===========================
       PIE
       =========================== */
    page.drawText("Generado automáticamente con Alef — TPV Inteligente", {
      x: 50,
      y: 40,
      size: 10,
      font,
      color: rgb(0.7, 0.7, 0.7),
    });

    /* ===========================
       EXPORTAR PDF
       =========================== */
    const pdfBytes = await pdf.save();

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `Caja_${fechaInicio}_a_${fechaFin}.pdf`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
  }
}
