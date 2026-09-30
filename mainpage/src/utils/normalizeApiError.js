export function normalizeApiError(err) {
  const server = err?._server || err?.response?._server || null;

  // si viene del interceptor, perfecto
  if (server) {
    return {
      status: server.status,
      code: server.code || "UNKNOWN",
      message: server.message || "Error inesperado",
      requestId: server.requestId || "—",
      action: server.action || (server.status === 401 ? "REAUTH" : server.status >= 500 ? "RETRY" : "CONTACT_SUPPORT"),
      retryAfter: server.retryAfter,
      fields: server.fields,
      kind:
        server.status === 429 ? "rate_limit" :
        !server.status ? "network" :
        server.status >= 500 ? "server" :
        server.status === 401 ? "auth" :
        "client",
      canRetry:
        server.status === 429 ? true :
        server.status >= 500 ? true :
        false,
    };
  }

  // fallback (si algo se escapó)
  return {
    status: err?.response?.status || null,
    code: "UNKNOWN",
    message: err?.message || "Error inesperado",
    requestId: "—",
    action: "CONTACT_SUPPORT",
    retryAfter: null,
    fields: null,
    kind: "unknown",
    canRetry: false,
  };
}

/**
 * Mensaje para ENSEÑAR al usuario: el `message` de la API y, si trae `fields`, el detalle de
 * cada campo. `fields` llega con dos formas en el backend: objeto `{ ruta: mensaje }` (zBody,
 * errorHandler) o array `[{ path, message }]` (p. ej. REGLA_INCOHERENTE). Se aceptan las dos.
 */
export function mensajeConCampos(err, fallback = "Error inesperado") {
  const d = err?._server || err?.response?._server || err?.response?.data || {};
  const base = d.message || err?.message || fallback;
  const f = d.fields;
  let detalles = [];
  if (Array.isArray(f)) detalles = f.map((x) => x?.message).filter((x) => typeof x === "string");
  else if (f && typeof f === "object") detalles = Object.values(f).filter((x) => typeof x === "string");
  detalles = [...new Set(detalles)].filter((x) => x && x !== base);
  return detalles.length ? `${base}: ${detalles.join(" · ")}` : base;
}
