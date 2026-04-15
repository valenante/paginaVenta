// Utilidades de Finanzas — formato y cálculo de periodos

export function eur(n, decimals = 2) {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function pct(n, decimals = 1) {
  if (n == null || isNaN(n)) return "—";
  return `${Number(n).toFixed(decimals)}%`;
}

export function ymd(d) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Periodos predefinidos: devuelven {desde, hasta} en YYYY-MM-DD
export const PERIODOS = {
  hoy: () => {
    const d = ymd(new Date());
    return { desde: d, hasta: d, label: "Hoy" };
  },
  semana: () => {
    const now = new Date();
    const day = now.getDay() || 7; // domingo=7
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));
    return { desde: ymd(monday), hasta: ymd(now), label: "Esta semana" };
  },
  mes: () => {
    const now = new Date();
    const inicio = new Date(now.getFullYear(), now.getMonth(), 1);
    return { desde: ymd(inicio), hasta: ymd(now), label: "Este mes" };
  },
  mesAnterior: () => {
    const now = new Date();
    const inicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const fin = new Date(now.getFullYear(), now.getMonth(), 0);
    return { desde: ymd(inicio), hasta: ymd(fin), label: "Mes anterior" };
  },
  trimestre: () => {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3);
    const inicio = new Date(now.getFullYear(), q * 3, 1);
    return { desde: ymd(inicio), hasta: ymd(now), label: "Trimestre" };
  },
  año: () => {
    const now = new Date();
    const inicio = new Date(now.getFullYear(), 0, 1);
    return { desde: ymd(inicio), hasta: ymd(now), label: "Este año" };
  },
};

// Color de alerta según margen %
export function alertaColor(alerta) {
  switch (alerta) {
    case "negativo": return "#ef4444";
    case "bajo": return "#f97316";
    case "medio": return "#eab308";
    case "alto": return "#22c55e";
    default: return "#94a3b8";
  }
}

export function alertaLabel(alerta) {
  switch (alerta) {
    case "negativo": return "Pérdida";
    case "bajo": return "<30%";
    case "medio": return "30-60%";
    case "alto": return ">60%";
    default: return "—";
  }
}

export const CATEGORIAS_GASTO = [
  { value: "alquiler",       label: "🏠 Alquiler" },
  { value: "salarios",       label: "👥 Salarios" },
  { value: "suministros",    label: "💡 Suministros (luz/agua/gas)" },
  { value: "internet",       label: "🌐 Internet" },
  { value: "seguros",        label: "🛡️ Seguros" },
  { value: "gestoria",       label: "📋 Gestoría" },
  { value: "software",       label: "💻 Software" },
  { value: "mantenimiento",  label: "🔧 Mantenimiento" },
  { value: "marketing",      label: "📣 Marketing" },
  { value: "otros",          label: "📦 Otros" },
];
