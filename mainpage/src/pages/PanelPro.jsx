// src/pages/PanelPro.jsx
import React, { useMemo, useState, useEffect } from "react";
import "../styles/PanelPro.css";

// ✅ Restaurante (los que ya existen y NO tocamos)
import EstadisticasPage from "./EstadisticasPage";
import CajaDiaria from "../components/CajaDiariaUltraPro/CajaDiariaUltraPro";
import UsuariosPage from "../components/Usuarios/UsuariosPage";
import MapaEditor from "./MapaEditor";
import ProductsMenu from "./ProductsMenu";
import StockPage from "./StockPage";
import ValoracionesPanel from "./ValoracionesPanel";

// ✅ Tienda (placeholders nuevos con sufijo Shop — los crearemos luego)
import VentasPageShop from "./VentasPageShop";
import ProductosPageShop from "./ProductosPageShop";
import StockPageShop from "./StockPageShop";

// ✅ Tenant
import { useTenant } from "../context/TenantContext";
import UsuariosShopPage from "../components/UsuariosShop/UsuariosShopPage";

const PANEL_BY_TIPO = {
  restaurante: [
    { key: "estadisticas", label: "📊 Estadísticas", render: () => <EstadisticasPage type="plato" /> },
    { key: "caja", label: "💶 Caja diaria", render: () => <CajaDiaria /> },
    { key: "usuarios", label: "👥 Usuarios", render: () => <UsuariosPage /> },
    { key: "mapa", label: "🗺️ Mapa del restaurante", render: () => <MapaEditor /> },
    { key: "productos", label: "🧾 Carta y productos", render: () => <ProductsMenu /> },
    { key: "stock", label: "📦 Stock", render: () => <StockPage /> },
    { key: "valoraciones", label: "⭐ Valoraciones", render: () => <ValoracionesPanel /> },
  ],

  shop: [
    // ⚠️ POS fuera del panel (está en navbar / ruta propia)
    { key: "ventas", label: "📈 Ventas", render: () => <VentasPageShop /> },
    { key: "productos", label: "🏷️ Productos", render: () => <ProductosPageShop /> },
    { key: "stock", label: "📦 Stock", render: () => <StockPageShop /> },
    { key: "caja", label: "💶 Caja", render: () => <CajaDiaria /> }, // reutilizamos la misma caja
    { key: "usuarios", label: "👥 Usuarios", render: () => <UsuariosShopPage /> }, // reutilizamos usuarios
  ],
};

export default function PanelPro() {
  const { tenant, loadingTenant, tenantError } = useTenant();
  // ✅ tipoNegocio ahora está en tenant
  const tipoNegocio = (
    tenant?.tipoNegocio ||
    tenant?.suscripcion?.tipoNegocio ||
    "shop"
  ).toLowerCase();

  const tabs = useMemo(() => {
    return PANEL_BY_TIPO[tipoNegocio] || PANEL_BY_TIPO.shop;
  }, [tipoNegocio]);

  const [active, setActive] = useState(tabs[0]?.key || "ventas");

  // ✅ si cambia tipoNegocio (o tabs), asegurar que active existe
  useEffect(() => {
    if (!tabs.some((t) => t.key === active)) {
      setActive(tabs[0]?.key || "ventas");
    }
  }, [tabs, active]);

  const current = tabs.find((t) => t.key === active);

  return (
    <div className="panelpro-root">
      <div className="panelpro-tabs">
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

      <div className="panelpro-content">{current?.render?.()}</div>
    </div>
  );
}
