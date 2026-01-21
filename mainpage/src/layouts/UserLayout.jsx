// src/layouts/UserLayout.jsx
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import TopBar from "../components/TopBar/TopBar";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext.jsx";
import "./UserLayout.css";

export default function UserLayout({ children }) {
  const { setUser } = useAuth();

  useEffect(() => {
    const onPageShow = async (e) => {
      const nav = performance.getEntriesByType?.("navigation")?.[0];
      const isBackForward = nav?.type === "back_forward";
      const isBFCache = e?.persisted || isBackForward;

      if (!isBFCache) return;

      try {
        await api.get("/auth/me/me");
      } catch (err) {
        try { setUser(null); } catch {}
        sessionStorage.removeItem("tenantId");
        sessionStorage.removeItem("impersonado");
        sessionStorage.removeItem("user");
        window.location.replace("/login");
      }
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [setUser]);

  return (
    <div className="userlayout-root">
      <TopBar />
      <main className="userlayout-main">
        {children ?? <Outlet />} {/* ✅ si no hay children, renderiza rutas anidadas */}
      </main>
    </div>
  );
}
