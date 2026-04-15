// src/utils/whatsappPedido.js
//
// Helpers para generar enlaces wa.me con un mensaje pre-rellenado
// con las líneas del pedido. Funciona desde móvil (abre la app) y desktop
// (abre WhatsApp Web).

/**
 * Normaliza un número de teléfono al formato E.164 sin "+" (lo que pide wa.me).
 * Si no empieza con código de país, asume +34 (España).
 * Devuelve null si el número es inválido (<8 dígitos tras limpiar).
 */
export function normalizarTelefonoWhatsapp(telefono, defaultPrefix = "34") {
  if (!telefono) return null;
  // Solo dígitos
  let digits = String(telefono).replace(/\D/g, "");
  if (digits.length < 8) return null;
  // Si ya empieza por código de país (2-3 dígitos) vale. Si empieza por 6/7/8/9 y
  // tiene 9 dígitos → móvil/fijo español, añadir 34.
  if (digits.length === 9 && /^[6789]/.test(digits)) {
    digits = defaultPrefix + digits;
  }
  // Si tiene 11+ dígitos, asumimos que ya incluye código de país.
  return digits;
}

/**
 * Pluraliza la unidad/formato según cantidad. Para unidades medibles
 * (g, kg, ml, l) no pluraliza. Para formatos (saco, caja, pack, botella)
 * añade "s" si cantidad > 1.
 */
function formatUnidad(cantidad, formato, unidad) {
  const n = Number(cantidad) || 0;
  // Preferir formato cuando existe: es lo que el proveedor entiende ("3 sacos")
  if (formato && formato.trim()) {
    const f = formato.trim();
    if (n === 1) return f;
    // Plural simple español: si acaba en vocal → +s, si no → +es
    const last = f.slice(-1).toLowerCase();
    const esVocal = "aeiou".includes(last);
    return esVocal ? `${f}s` : `${f}es`;
  }
  // Si no hay formato, usar unidad (g, kg, ml, l no se pluralizan)
  return unidad || "";
}

/**
 * Construye el cuerpo de mensaje del pedido.
 * Markdown mínimo de WhatsApp (*negrita*). Emojis discretos.
 */
export function construirMensajePedido({ emisor, proveedor, pedido }) {
  const lineas = (pedido?.lineas || [])
    .map((l) => {
      const u = formatUnidad(l.cantidad, l.formato, l.unidad);
      const sufijo = u ? ` ${u}` : "";
      return `• ${l.nombre}: *${l.cantidad}${sufijo}*`;
    })
    .join("\n");

  const numero =
    pedido?.numeroPedido || String(pedido?._id || "").slice(-6).toUpperCase();

  const fechaEsp = pedido?.fechaEsperada
    ? new Date(pedido.fechaEsperada).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
      })
    : null;

  // Coma entre nombre y emoji para que no se pegue y rompa el render en algunos clientes
  const saludo = proveedor?.nombre
    ? `Hola ${proveedor.nombre}, 👋`
    : "Hola, 👋";

  const parts = [
    saludo,
    "",
    `Te paso un pedido desde *${emisor?.nombre || "nuestro restaurante"}*:`,
    "",
    lineas,
    "",
    `Total estimado: *${Number(pedido?.total || 0).toFixed(2)} €*`,
  ];

  if (fechaEsp) parts.push(`📅 Entrega deseada: ${fechaEsp}`);
  parts.push("", `Ref. pedido: ${numero}`);
  if (emisor?.telefono) parts.push(`Contacto: ${emisor.telefono}`);
  parts.push("", "Gracias 🙏");

  return parts.join("\n");
}

/**
 * Abre WhatsApp con el mensaje prerrellenado.
 * - Si hay teléfono del proveedor → wa.me/<num>?text=…
 * - Si no hay teléfono → api.whatsapp.com/send?text=… (sin destinatario)
 */
export function abrirWhatsappPedido({ emisor, proveedor, pedido }) {
  const mensaje = construirMensajePedido({ emisor, proveedor, pedido });
  const texto = encodeURIComponent(mensaje);
  const numero = normalizarTelefonoWhatsapp(proveedor?.telefono);
  const url = numero
    ? `https://wa.me/${numero}?text=${texto}`
    : `https://api.whatsapp.com/send?text=${texto}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return { url, hasNumber: !!numero };
}
