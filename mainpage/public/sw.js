const CACHE = "alef-landing-v1";
const PRECACHE = ["/", "/login", "/manifest.json", "/pwa-192.png"];

/* ── Install: pre-cache shell ── */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

/* ── Activate: purge old caches ── */
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch strategy ── */
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET, socket.io, and chrome-extension
  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/socket.io")) return;
  if (url.protocol === "chrome-extension:") return;

  // No tocar nada que no sea de ESTE origen. La API vive en otro dominio
  // (api.softalef.com) y su ruta tambien empieza por "/api", asi que sin esta
  // guarda el bloque de abajo se la tragaba: cuando su fetch fallaba, este SW
  // fabricaba un `new Response("{}", { status: 503 })` que no lleva cabeceras
  // CORS ni el `code` del error real. Resultado el 2026-08-05: el print-agent
  // de tres-catorce llevaba SEIS DIAS caido y la API lo decia con un
  // `502 PRINT_AGENT_OFFLINE` perfectamente claro, pero el panel mostraba
  // "503 / Estado desconocido" y Chrome culpaba a CORS. Se perdio una manana
  // persiguiendo un error que este fichero se habia inventado.
  if (url.origin !== self.location.origin) return;

  // Network-first for API calls
  if (url.pathname.startsWith("/api")) {
    e.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((r) => r || new Response("{}", { status: 503 }))
      )
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return resp;
        }).catch(() => {
          // SPA fallback: return cached index for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/login") || caches.match("/");
          }
          return new Response("", { status: 503 });
        })
    )
  );
});
