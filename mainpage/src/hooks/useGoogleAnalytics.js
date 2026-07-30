import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Injects the gtag.js script and initialises GA4.
 * Called once, only after cookie consent.
 */
function loadGtagScript(id) {
  if (document.getElementById("ga-gtag")) return;          // already loaded

  const script = document.createElement("script");
  script.id = "ga-gtag";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: false });    // we send manually on route change
}

/**
 * Hook: loads GA4 when analytics cookies are accepted,
 * and sends a pageview on every route change (SPA).
 *
 * Consent key: localStorage "alef_cookies_analytics" === "true"
 */
export default function useGoogleAnalytics() {
  const location = useLocation();
  const consentGranted = useRef(false);

  /* ── 1. Check consent & load script ── */
  useEffect(() => {
    if (!GA_ID) return;                                     // no ID configured

    function tryLoad() {
      if (localStorage.getItem("alef_cookies_analytics") === "true") {
        consentGranted.current = true;
        loadGtagScript(GA_ID);
      }
    }

    tryLoad();                                              // check on mount

    // CookieBanner dispatches this event when the user accepts analytics
    const onConsent = () => tryLoad();
    window.addEventListener("alef:cookies-analytics", onConsent);
    return () => window.removeEventListener("alef:cookies-analytics", onConsent);
  }, []);

  /* ── 2. Track pageviews on route change ── */
  useEffect(() => {
    if (!GA_ID || !consentGranted.current || typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);
}
