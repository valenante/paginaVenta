// src/utils/trackEvent.js
// Envía eventos personalizados a GA4 via gtag.
// Solo dispara si gtag está cargado (consent dado).
export function trackEvent(eventName, params = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}
