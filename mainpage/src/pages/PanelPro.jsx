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
import RolesPermisosPanel from "../components/RolesPermisos/RolesPermisosPanel";

// ✅ Tienda
import VentasPageShop from "./VentasPageShop";
import ProductosPageShop from "./ProductosPageShop";
import StockPageShop from "./StockPageShop";
import UsuariosShopPage from "../components/UsuariosShop/UsuariosShopPage";

// ✅ Staff (integrado como tab operativo)
import StaffPanel from "./panel/StaffPanel";

// ✅ Tenant + Auth
import { useTenant } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext.jsx";

const PANEL_BY_TIPO = {
  restaurante: [
    { key: "mapa", label: "🗺️ Mapa del restaurante", permiso: "mapa.manage", render: () => <MapaEditor /> },
    { key: "productos", label: "🧾 Carta y productos", permiso: "productos.manage", render: () => <ProductsMenu /> },
    { key: "usuarios", label: "👥 Usuarios", permiso: "usuarios.manage", render: () => <UsuariosPage /> },
    { key: "roles", label: "🔐 Roles y Permisos", permiso: "roles.manage", render: () => <RolesPermisosPanel /> },
    { key: "caja", label: "💶 Caja diaria", permiso: "caja.manage", render: () => <CajaDiaria /> },
    { key: "stock", label: "📦 Stock", permiso: "stock.manage", render: () => <StockPage /> },
    { key: "valoraciones", label: "⭐ Valoraciones", permiso: "valoraciones.manage", render: () => <ValoracionesPanel /> },
    { key: "estadisticas", label: "📊 Estadísticas", permiso: "estadisticas.manage", render: () => <EstadisticasPage type="plato" /> },
  ],

  shop: [
    { key: "productos", label: "🏷️ Productos", permiso: "productos.manage", render: () => <ProductosPageShop /> },
    { key: "usuarios", label: "👥 Usuarios", permiso: "usuarios.manage", render: () => <UsuariosShopPage /> },
    { key: "roles", label: "🔐 Roles y Permisos", permiso: "roles.manage", render: () => <RolesPermisosPanel /> },
    { key: "caja", label: "💶 Caja", permiso: "caja.manage", render: () => <CajaDiaria /> },
    { key: "stock", label: "📦 Stock", permiso: "stock.manage", render: () => <StockPageShop /> },
    { key: "ventas", label: "📈 Ventas", permiso: "ventas.manage", render: () => <VentasPageShop /> },
  ],
};

const STAFF_TAB = {
  key: "staff",
  label: "📊 Panel operativo",
  permiso: null,
  render: () => <StaffPanel />,
};

export default function PanelPro() {
  const { tenant, loadingTenant, tenantError } = useTenant();
  const { tienePermiso } = useAuth();

  const tipoNegocio = (
    tenant?.tipoNegocio ||
    tenant?.suscripcion?.tipoNegocio ||
    "restaurante"
  ).toLowerCase();

  const tabs = useMemo(() => {
    const gestion = (PANEL_BY_TIPO[tipoNegocio] || PANEL_BY_TIPO.shop)
      .filter((t) => !t.permiso || tienePermiso(t.permiso));
    return [STAFF_TAB, ...gestion];
  }, [tipoNegocio, tienePermiso]);

  const [active, setActive] = useState("staff");

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
