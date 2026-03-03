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