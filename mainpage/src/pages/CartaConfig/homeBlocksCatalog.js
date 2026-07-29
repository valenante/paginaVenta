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
  galeria: {
    nombre: "Galería de fotos",
    icono: "🖼️",
    descripcion: "Cuadrícula de fotos. Si no pones fotos propias usa las secciones de la home.",
    variantes: [["default", "Cuadrícula"], ["masonry", "Mosaico"], ["carrusel", "Carrusel"]],
    props: [{ key: "titulo", label: "Título (opcional)", type: "text", placeholder: "Nuestro local" }],
  },
  horarios: {
    nombre: "Horarios",
    icono: "🕒",
    descripcion: "Días de apertura y turnos de comida/cena.",
    variantes: [["default", "Compacta"], ["tabla", "Tabla"]],
    props: [{ key: "titulo", label: "Título", type: "text", placeholder: "Horarios" }],
  },
  resenas: {
    nombre: "Reseñas / Testimonios",
    icono: "⭐",
    descripcion: "Testimonios de clientes con estrellas. Los escribes tú.",
    variantes: [["carrusel", "Carrusel"], ["grid", "Cuadrícula"]],
    props: [
      { key: "titulo", label: "Título", type: "text", placeholder: "Lo que dicen" },
      { key: "items", type: "resenas" },
    ],
  },
  redes: {
    nombre: "Redes / contacto",
    icono: "📱",
    descripcion: "Enlaces a Instagram, WhatsApp, web…",
    variantes: [["iconos", "Iconos"], ["botones", "Botones"]],
    props: [
      { key: "titulo", label: "Título (opcional)", type: "text", placeholder: "Síguenos" },
      { key: "redes", type: "redes" },
    ],
  },
  banner: {
    nombre: "Banner promocional",
    icono: "📣",
    descripcion: "Barra con un mensaje corto y un botón.",
    variantes: [["tira", "Tira fina"], ["destacado", "Destacado"]],
    props: [
      { key: "texto", label: "Texto del banner", type: "textarea", placeholder: "Ej: 2x1 en cócteles los jueves" },
      { key: "cta.label", label: "Texto del botón", type: "text", placeholder: "Ej: Reservar" },
      { key: "cta.accion", label: "Acción del botón", type: "select", opciones: [["carta", "Ver la carta"], ["reservas", "Reservar"], ["takeaway", "Pedir para llevar"], ["url", "Enlace externo"]] },
      { key: "cta.url", label: "URL (si acción = enlace)", type: "text", placeholder: "https://…" },
      { key: "colorFondo", label: "Color de fondo (opcional)", type: "color" },
    ],
  },
  separador: {
    nombre: "Separador",
    icono: "➖",
    descripcion: "Aire, línea sutil o pequeño adorno entre bloques.",
    variantes: [["default", "Espacio"], ["linea", "Línea"], ["icono", "Adorno"]],
    props: [
      { key: "alto", label: "Alto", type: "select", opciones: [["s", "Pequeño"], ["m", "Medio"], ["l", "Grande"]] },
      { key: "icono", label: "Adorno (variante Adorno)", type: "text", placeholder: "◆" },
    ],
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
