// ./pdfs/hojaCajaUltraPro.js
// Exporta el "Desglose diario" de Caja a una hoja de cálculo .xlsx nativa.
// Reutiliza el MISMO array `datosDiarios` que alimenta el PDF (generarPDFCaja),
// con las mismas columnas: Fecha · Ingresos · Tickets · Ticket medio.
import writeExcelFile from "write-excel-file/browser";

// Formato de número con símbolo € (separadores de miles/decimales según la config de Excel).
const EUR = '#,##0.00" €"';

const fmtFecha = (iso) => {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso || "");
};

const header = [
  { value: "Fecha", fontWeight: "bold" },
  { value: "Ingresos", fontWeight: "bold" },
  { value: "Tickets", fontWeight: "bold" },
  { value: "Ticket medio", fontWeight: "bold" },
];

const columns = [{ width: 14 }, { width: 14 }, { width: 10 }, { width: 14 }];

export const generarHojaCaja = async ({ datos = [], fechaInicio, fechaFin }) => {
  const sheetData = [
    header,
    ...datos.map((d) => {
      const total = Number(d.total || 0);
      const numTickets = Number(d.numTickets || 0);
      return [
        { type: String, value: fmtFecha(d.fecha) },
        { type: Number, value: total, format: EUR },
        { type: Number, value: numTickets },
        { type: Number, value: numTickets > 0 ? total / numTickets : 0, format: EUR },
      ];
    }),
  ];

  await writeExcelFile(sheetData, { columns }).toFile(
    `caja_${fechaInicio || "inicio"}_${fechaFin || "fin"}.xlsx`
  );
};
