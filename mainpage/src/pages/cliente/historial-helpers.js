// Helpers de presentación para los movimientos de puntos del cliente.

export function tipoMovimiento(t) {
  switch (t) {
    case "acumulacion":   return { key: "acumulacion",   label: "Compra",       icon: "🛒" };
    case "canjeo":        return { key: "canjeo",        label: "Canjeo",       icon: "🎁" };
    case "caducidad":     return { key: "caducidad",     label: "Caducidad",    icon: "⏱️" };
    case "ajuste_manual": return { key: "ajuste_manual", label: "Ajuste",       icon: "✏️" };
    default:              return { key: "otro",          label: t || "Movimiento", icon: "•" };
  }
}

/**
 * Devuelve una etiqueta corta y limpia para el movimiento, sin duplicar el
 * tipo (que ya se muestra como label). Para canjeos legacy que tenían
 * "Canjeo recompensa: X" o "Canjeo X — Mesa N", recortamos prefijos redundantes.
 */
export function etiquetaMovimiento(m) {
  if (!m?.nota) return "";
  let nota = String(m.nota).trim();
  // Limpiar prefijos legacy
  nota = nota
    .replace(/^Canjeo recompensa:\s*/i, "")
    .replace(/^Canjeo\s+["“”']?/i, "")
    .replace(/["“”']?\s*—\s*Mesa\s*/i, " · Mesa ")
    .replace(/^Cancelacion canjeo\s+["“”']?/i, "Cancelado: ")
    .trim();
  return nota;
}

/**
 * Formatea una fecha en relativa ("hace 5 min", "ayer", "hace 3 días")
 * y absoluta cuando supera la semana.
 */
export function fechaRelativa(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  const ahora = new Date();
  const diffMs = ahora.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Ahora mismo";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffH < 24) return `Hace ${diffH} h`;
  if (diffD === 1) return "Ayer";
  if (diffD < 7) return `Hace ${diffD} días`;
  return d.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}
