// src/pages/PanelPro.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import "../styles/PanelPro.css";


// ✅ Restaurante
import EstadisticasPage from "./EstadisticasPage";
import CajaDiaria from "../components/CajaDiariaUltraPro/CajaDiariaUltraPro";
import UsuariosPage from "../components/Usuarios/UsuariosPage";
import MapaEditor from "./MapaEditor";
import ProductsMenu from "./ProductsMenu";
import StockPage from "./StockPage";
import ValoracionesPanel from "./ValoracionesPanel";

// ✅ Tienda
import VentasPageShop from "./VentasPageShop";
import ProductosPageShop from "./ProductosPageShop";
import StockPageShop from "./StockPageShop";
import UsuariosShopPage from "../components/UsuariosShop/UsuariosShopPage";

// ✅ Tenant
import { useTenant } from "../context/TenantContext";

const PANEL_BY_TIPO = {
  restaurante: [
    // 🔥 ORDEN NUEVO POR IMPORTANCIA OPERATIVA

    { key: "mapa", label: "🗺️ Mapa del restaurante", render: () => <MapaEditor /> },
    { key: "productos", label: "🧾 Carta y productos", render: () => <ProductsMenu /> },
    { key: "usuarios", label: "👥 Usuarios", render: () => <UsuariosPage /> },
    { key: "caja", label: "💶 Caja diaria", render: () => <CajaDiaria /> },
    { key: "stock", label: "📦 Stock", render: () => <StockPage /> },
    { key: "valoraciones", label: "⭐ Valoraciones", render: () => <ValoracionesPanel /> },
    { key: "estadisticas", label: "📊 Estadísticas", render: () => <EstadisticasPage type="plato" /> },
  ],

  shop: [
    // 🔥 ORDEN NUEVO ADAPTADO A TIENDA

    { key: "productos", label: "🏷️ Productos", render: () => <ProductosPageShop /> },
    { key: "usuarios", label: "👥 Usuarios", render: () => <UsuariosShopPage /> },
    { key: "caja", label: "💶 Caja", render: () => <CajaDiaria /> },
    { key: "stock", label: "📦 Stock", render: () => <StockPageShop /> },
    { key: "ventas", label: "📈 Ventas", render: () => <VentasPageShop /> },
  ],
};

export default function PanelPro() {
  const { tenant, loadingTenant, tenantError } = useTenant();

  const tipoNegocio = (
    tenant?.tipoNegocio ||
    tenant?.suscripcion?.tipoNegocio ||
    "shop"
  ).toLowerCase();

  const tabs = useMemo(() => {
    return PANEL_BY_TIPO[tipoNegocio] || PANEL_BY_TIPO.shop;
  }, [tipoNegocio]);

  const [active, setActive] = useState(tabs[0]?.key || tabs[0]?.key);

  useEffect(() => {
    if (!tabs.some((t) => t.key === active)) {
      setActive(tabs[0]?.key);
    }
  }, [tabs, active]);

  const current = tabs.find((t) => t.key === active);

  // ✅ scroll affordance
  const tabsRef = useRef(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScroll({
        left: scrollLeft > 4,
        right: scrollLeft + clientWidth < scrollWidth - 4,
      });
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [tabs]);

  // ✅ opcional: “nudge” 1 vez para enseñar el scroll
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    const key = "panelpro_tabs_hint_v1";
    if (sessionStorage.getItem(key)) return;

    const hasOverflow = el.scrollWidth > el.clientWidth + 8;
    if (!hasOverflow) return;

    sessionStorage.setItem(key, "1");
    requestAnimationFrame(() => {
      el.scrollBy({ left: 120, behavior: "smooth" });
      setTimeout(() => el.scrollBy({ left: -120, behavior: "smooth" }), 700);
    });
  }, [tabs]);

  const scrollTabsBy = (delta) => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="panelpro-root">
      {/* 👇 wrapper para gradientes/flechas */}
      <div
        className={[
          "panelpro-tabs-wrap",
          canScroll.left ? "can-left" : "",
          canScroll.right ? "can-right" : "",
        ].join(" ")}
      >
        <div className="panelpro-tabs" ref={tabsRef}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={active === t.key ? "active" : ""}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Flechas (opcionalmente clicables) */}
        {canScroll.left && (
          <button
            type="button"
            className="panelpro-tabs-arrow left"
            onClick={() => scrollTabsBy(-240)}
            aria-label="Ver pestañas anteriores"
          >
            ‹
          </button>
        )}

        {canScroll.right && (
          <button
            type="button"
            className="panelpro-tabs-arrow right"
            onClick={() => scrollTabsBy(240)}
            aria-label="Ver más pestañas"
          >
            ›
          </button>
        )}
      </div>

      <div className="panelpro-content">{current?.render?.()}</div>
    </div>
  );
}
