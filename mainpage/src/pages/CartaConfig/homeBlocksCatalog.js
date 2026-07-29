// Catálogo de bloques y plantillas de la HOME componible (lado panel).
// ⚠️ ESPEJO de carta/src/home (blockRegistry.js + homePresets.js): mantener en sync
// (repos separados). El panel solo necesita metadatos para el builder; la carta es
// quien REALMENTE pinta cada bloque.

// Definición de cada tipo de bloque: nombre visible, icono, variantes de disposición
// y qué props edita el builder.
export const BLOQUES = {
  hero: {
    nombre: "Portada (Hero)",
    icono: "🖼️",
    descripcion: "Carrusel de imágenes con botones. Usa las imágenes del home.",
    variantes: [["fullscreen", "Pantalla completa"], ["medio", "Media altura"], ["compacto", "Compacta"]],
    props: [],
  },
  destacados: {
    nombre: "Recomendados de la casa",
    icono: "⭐",
    descripcion: "Productos marcados como destacados.",
    variantes: [["default", "Rejilla"]],
    props: [],
  },
  features: {
    nombre: "Galería «¿Por qué elegirnos?»",
    icono: "✨",
    descripcion: "Las imágenes de secciones del home con su texto.",
    variantes: [["default", "Rejilla"]],
    props: [{ key: "titulo", label: "Título", type: "text", placeholder: "¿Por qué elegirnos?" }],
  },
  mapa: {
    nombre: "Mapa / ubicación",
    icono: "🗺️",
    descripcion: "Mapa de Google con la dirección + botón «Cómo llegar».",
    variantes: [["default", "Completo"]],
    props: [],
  },
  texto: {
    nombre: "Texto libre",
    icono: "📝",
    descripcion: "Un título y un texto propios (tu historia, aviso, etc.).",
    variantes: [["default", "Centrado"], ["cita", "Cita destacada"], ["dos-columnas", "Dos columnas"]],
    props: [
      { key: "titulo", label: "Título", type: "text" },
      { key: "cuerpo", label: "Texto", type: "textarea" },
    ],
  },
  cta: {
    nombre: "Botones de acción",
    icono: "🔘",
    descripcion: "Botones que llevan a la carta, reservas o pedir para llevar.",
    variantes: [["default", "En fila"], ["grande", "Botón grande"], ["apilado", "Apilados"]],
    props: [{ key: "botones", type: "botones" }],
  },
};

export const TIPOS_ANADIBLES = Object.keys(BLOQUES);

export const ACCIONES_CTA = [
  ["carta", "Ver la carta"],
  ["reservas", "Reservar mesa"],
  ["takeaway", "Pedir para llevar"],
  ["url", "Enlace externo"],
];

// ── Plantillas (mismos bloques que carta/src/home/homePresets.js) ──
let _seq = 0;
const uid = (tipo) => `${tipo}-${Date.now().toString(36)}-${(_seq++).toString(36)}`;
const b = (tipo, variante = "default", props = {}) => ({ id: uid(tipo), tipo, variante, visible: true, props });

export const PRESETS = [
  {
    id: "escaparate",
    nombre: "Escaparate",
    icono: "🎬",
    descripcion: "Cinematográfico, marca primero. Igual que la home actual.",
    bloques: () => [b("hero", "fullscreen"), b("destacados"), b("features"), b("mapa")],
  },
  {
    id: "directo",
    nombre: "Directo a la carta",
    icono: "📖",
    descripcion: "Hero compacto y acceso rápido a la carta. Para QR en mesa.",
    bloques: () => [
      b("hero", "compacto"),
      b("cta", "default", { botones: [{ label: "Ver la carta", accion: "carta", estilo: "primario" }] }),
      b("destacados"),
      b("mapa"),
    ],
  },
  {
    id: "conversion",
    nombre: "Conversión",
    icono: "🎯",
    descripcion: "Empuja pedido y reserva con doble botón.",
    bloques: () => [
      b("hero", "medio"),
      b("cta", "default", {
        botones: [
          { label: "Pedir para llevar", accion: "takeaway", estilo: "primario" },
          { label: "Reservar mesa", accion: "reservas", estilo: "secundario" },
        ],
      }),
      b("destacados"),
      b("mapa"),
    ],
  },
  {
    id: "minimalista",
    nombre: "Minimalista",
    icono: "⚪",
    descripcion: "Ultra limpio: marca + un botón grande a la carta.",
    bloques: () => [
      b("hero", "medio"),
      b("cta", "grande", { botones: [{ label: "Ver la carta", accion: "carta", estilo: "primario" }] }),
    ],
  },
  {
    id: "storytelling",
    nombre: "Storytelling",
    icono: "📚",
    descripcion: "Vende experiencia: hero + texto + galería + destacados.",
    bloques: () => [
      b("hero", "fullscreen"),
      b("texto", "default", { titulo: "Bienvenido", cuerpo: "Cuenta aquí la historia de tu restaurante." }),
      b("features"),
      b("destacados"),
      b("mapa"),
    ],
  },
];

export function buildHomeFromPreset(presetId) {
  const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[0];
  const bloques = preset.bloques().map((bl, i) => ({ ...bl, orden: i }));
  return { version: 1, preset: preset.id, bloques };
}

export const nuevoBloque = (tipo) => {
  const def = BLOQUES[tipo];
  const variante = def?.variantes?.[0]?.[0] || "default";
  return { id: uid(tipo), tipo, variante, visible: true, props: {} };
};
