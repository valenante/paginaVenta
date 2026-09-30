// Parámetros de VUELTA en la URL (p. ej. tras el OAuth de Google/Instagram).
//
// Contrato fijado por la sesión principal (30-sep, lote FEATURES-VENTA-30SEP):
//   Google    → /pro?tab=otros&modulo=google-reviews&google=connected | google=error&motivo=…
//   Instagram → /pro?tab=otros&modulo=instagram&instagram=connected   | instagram=error&motivo=…
// `PanelPro` consume `tab`, `OtrosPage` consume `modulo` y cada página consume el suyo.
//
// ⚠️ LEER es puro (se puede llamar en un inicializador de useState); QUITAR se hace en un
// useEffect. En <React.StrictMode> (main.jsx) los inicializadores se ejecutan DOS veces: si la
// lectura borrara el parámetro, la segunda ejecución ya no lo vería.

export function leerQuery(nombre) {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(nombre);
}

/** Quita esos parámetros de la URL sin recargar ni añadir entrada al historial. */
export function quitarDeQuery(nombres) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  let cambia = false;
  for (const n of nombres) {
    if (params.has(n)) { params.delete(n); cambia = true; }
  }
  if (!cambia) return;
  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash || ""}`;
  // Se conserva `history.state`: react-router guarda ahí su clave de navegación.
  window.history.replaceState(window.history.state, "", url);
}
