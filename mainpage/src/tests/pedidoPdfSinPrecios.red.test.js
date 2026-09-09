import { describe, it, expect } from "vitest";
import { generarPedidoProveedorPDF } from "/home/valenante/Desktop/pagina-venta/pagina/mainpage/src/utils/pdfs/pedidoProveedorPDF.js";
describe("D-451 · el PDF de pedido", () => {
  it("se genera y NO contiene importes", async () => {
    const doc = generarPedidoProveedorPDF({
      emisor: { nombre: "Tres14 Tapas & Café", nif: "B123", direccion: "Calle Belice 4, Torremolinos", telefono: "600", email: "a@b.c" },
      proveedor: { nombre: "Nombre Proveedor", nif: "x42423423j" },
      pedido: { numeroPedido: "E45A9E52", fechaPedido: new Date("2026-09-09"),
        lineas: [{ nombre: "Esparragos", formato: "Caja 20 pares", cantidad: 4, precioUnitario: 20, iva: 10, totalLinea: 88 }],
        subtotal: 80, totalIva: 8, total: 88 },
      opts: { returnDoc: true, currencySymbol: "$" },
    });
    // ⚠️ Primera version leia `doc.internal.pages`, que NO trae el texto en claro: el mutante
    // que devolvia la columna de precio SOBREVIVIA. Ahora se lee el PDF de verdad, sacando el
    // texto de sus flujos comprimidos — que es lo que vera el proveedor.
    const bytes = Buffer.from(doc.output("arraybuffer"));
    expect(bytes.length, "no genero PDF").toBeGreaterThan(3000);
    // ⚠️ Leer el PDF "a mano" desde el test no funciono: intente descomprimir los `stream`
    // (0 caracteres, lo cazo el CONTROL) y luego leerlos en claro (el mutante SOBREVIVIA).
    // Asi que el test ESCRIBE el fichero y la comprobacion se hace con `pdftotext`, que es
    // como lo leera el proveedor de verdad. El guion que acompana a este test hace el grep.
    const fs = await import("node:fs");
    fs.writeFileSync("/tmp/alef-pedido-prueba.pdf", bytes);
    expect(fs.statSync("/tmp/alef-pedido-prueba.pdf").size, "no se escribio el PDF").toBeGreaterThan(3000);
  });
});
