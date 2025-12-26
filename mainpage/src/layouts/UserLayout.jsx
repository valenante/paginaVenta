// src/layouts/UserLayout.jsx
import React, { useEffect } from "react";
import TopBar from "../components/TopBar/TopBar"; // navbar general ALEF
import api from "../utils/api";
import { useAuth } from "../context/AuthContext.jsx";
import "./UserLayout.css";

export default function UserLayout({ children }) {
  const { setUser } = useAuth();

  useEffect(() => {
    const onPageShow = async (e) => {
      // Detecta navegación "volver/adelante" o recuperación desde bfcache
      const nav = performance.getEntriesByType?.("navigation")?.[0];
      const isBackForward = nav?.type === "back_forward";
      const isBFCache = e?.persisted || isBackForward;

      if (!isBFCache) return;

      try {
        // Revalida la cookie/sesión real en backend
        await api.get("/auth/me/me");
      } catch (err) {
        // Si no hay sesión, limpiamos y forzamos login
        try {
          setUser(null);
        } catch {}

        sessionStorage.removeItem("tenantId");
        sessionStorage.removeItem("impersonado");
        sessionStorage.removeItem("user");

        window.location.replace("/login"); // ✅ no deja volver atrás al panel
      }
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [setUser]);

  return (
    <div className="userlayout-root">
      <TopBar />
      <main className="userlayout-main">{children}</main>
    </div>
  );
}
