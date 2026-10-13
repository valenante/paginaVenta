// Etiqueta en español de cada estado de reserva. Única fuente: la usan la pantalla de
// reservas y el modal del KPI del panel operativo (Art. 6).
export const ESTADOS_LABEL = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  "auto-confirmada": "Auto-confirmada",
  rechazada: "Rechazada",
  completada: "Completada",
  "no-show": "No vino",
};

export const etiquetaEstado = (estado) => ESTADOS_LABEL[estado] || estado || "—";
