import React, { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import UserLayout from "../layouts/UserLayout";
import { VentasProvider } from "../context/VentasContext";
import { useTenant } from "../context/TenantContext.jsx";

/* Config pages */
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const PerfilPage = lazy(() => import("../pages/PerfilPage"));
const RestauranteConfigPage = lazy(() => import("../pages/RestauranteConfigPage"));
const CartaConfigPage = lazy(() => import("../pages/CartaConfig/CartaConfigPage"));
const ReservasConfigPage = lazy(() => import("../pages/ReservasConfigPage"));
const MiCuentaPage = lazy(() => import("../pages/MiCuentaPage"));
const FacturasPage = lazy(() => import("../pages/FacturasPage"));
const ConfigImpresionPage = lazy(() => import("../pages/ConfigImpresionPage"));
const ConfigImpresionShopPage = lazy(() => import("../pages/ConfigImpresionShopPage"));
const PrintCenterPage = lazy(() => import("../pages/PrintCenterPage.jsx"));
const ExportsPage = lazy(() => import("../pages/ExportsPage.jsx"));
const LoyaltyConfigPage = lazy(() => import("../pages/LoyaltyConfigPage.jsx"));

/* Proveedores */
const ProveedoresPage = lazy(() => import("../pages/ProveedoresPage"));
const ProveedorDetalleLayout = lazy(() => import("../pages/proveedores/ProveedorDetalleLayout.jsx"));
const ProveedorResumenTab = lazy(() => import("../pages/proveedores/tabs/ProveedorResumenTab.jsx"));
const ProveedorProductosTab = lazy(() => import("../pages/proveedores/tabs/ProveedorProductosTab.jsx"));
const ProveedorPedidosTab = lazy(() => import("../pages/proveedores/tabs/ProveedorPedidosTab.jsx"));
const ProveedorFacturasTab = lazy(() => import("../pages/proveedores/tabs/ProveedorFacturasTab.jsx"));
const ProveedorPedidoDetallePage = lazy(() => import("../pages/proveedores/pedidos/ProveedorPedidoDetallePage.jsx"));
const HacerPedidoPage = lazy(() => import("../pages/proveedores/HacerPedidoPage.jsx"));

/* Usuarios */
const UsuariosPage = lazy(() => import("../components/Usuarios/UsuariosPage"));
const UsuariosShopPage = lazy(() => import("../components/UsuariosShop/UsuariosShopPage"));
const RolesPermisosPanel = lazy(() => import("../components/RolesPermisos/RolesPermisosPanel"));

/* Soporte */
const SoporteDetalle = lazy(() => import("../pages/SoporteDetalle.jsx"));
const SoporteLista = lazy(() => import("../pages/SoporteLista.jsx"));
const SoporteNuevo = lazy(() => import("../pages/SoporteNuevo.jsx"));
const AyudaPage = lazy(() => import("../pages/Ayuda/AyudaPage.jsx"));

/* Panel Pro */
const PanelPro = lazy(() => import("../pages/PanelPro"));

function UsuariosRoute() {
  const { tenant } = useTenant();
  const tipo = (tenant?.tipoNegocio || "restaurante").toLowerCase();
  return tipo === "shop" ? <UsuariosShopPage /> : <UsuariosPage />;
}

function PanelProWithVentas() {
  const { tenantId } = useTenant();
  return (
    <UserLayout>
      <VentasProvider tenantId={tenantId}>
        <PanelPro />
      </VentasProvider>
    </UserLayout>
  );
}

export default function panelRoutes() {
  return (
    <>
      {/* CONFIGURACIÓN (hub) */}
      <Route path="/configuracion" element={<UserLayout><DashboardPage /></UserLayout>} />
      <Route path="/dashboard" element={<Navigate to="/configuracion" replace />} />
      <Route path="/tpv/:tenantId/dashboard" element={<Navigate to="/configuracion" replace />} />

      {/* Cuenta y perfil */}
      <Route path="/mi-cuenta" element={<UserLayout><MiCuentaPage /></UserLayout>} />
      <Route path="/facturas" element={<UserLayout><FacturasPage /></UserLayout>} />
      <Route path="/perfil" element={<UserLayout><PerfilPage /></UserLayout>} />

      {/* Config del restaurante */}
      <Route path="/configuracion/restaurante" element={<UserLayout><RestauranteConfigPage /></UserLayout>} />
      <Route path="/configuracion/carta" element={<UserLayout><CartaConfigPage /></UserLayout>} />
      <Route path="/configuracion/reservas" element={<UserLayout><ReservasConfigPage /></UserLayout>} />
      <Route path="/configuracion/impresion" element={<UserLayout><ConfigImpresionPage /></UserLayout>} />
      <Route path="/configuracion/impresion/centro" element={<UserLayout><PrintCenterPage /></UserLayout>} />
      <Route path="/configuracion/impresion-shop" element={<UserLayout><ConfigImpresionShopPage /></UserLayout>} />
      <Route path="/configuracion/exports" element={<UserLayout><ExportsPage /></UserLayout>} />
      <Route path="/configuracion/loyalty" element={<UserLayout><LoyaltyConfigPage /></UserLayout>} />

      {/* Proveedores */}
      <Route path="/configuracion/proveedores" element={<UserLayout><ProveedoresPage /></UserLayout>} />
      <Route path="/configuracion/proveedores/hacer-pedido" element={<UserLayout><HacerPedidoPage /></UserLayout>} />
      <Route path="/configuracion/proveedores/:proveedorId" element={<UserLayout><ProveedorDetalleLayout /></UserLayout>}>
        <Route index element={<ProveedorResumenTab />} />
        <Route path="productos" element={<ProveedorProductosTab />} />
        <Route path="pedidos" element={<ProveedorPedidosTab />} />
        <Route path="facturas" element={<ProveedorFacturasTab />} />
      </Route>
      <Route path="/configuracion/proveedores/:proveedorId/pedidos/:pedidoId" element={<UserLayout><ProveedorPedidoDetallePage /></UserLayout>} />

      {/* Usuarios y roles */}
      <Route path="/configuracion/usuarios" element={<UserLayout><UsuariosRoute /></UserLayout>} />
      <Route path="/configuracion/roles" element={<UserLayout><RolesPermisosPanel /></UserLayout>} />

      {/* Soporte y ayuda */}
      <Route element={<UserLayout />}>
        <Route path="soporte" element={<SoporteLista />} />
        <Route path="soporte/nuevo" element={<SoporteNuevo />} />
        <Route path="soporte/:id" element={<SoporteDetalle />} />
      </Route>
      <Route path="/ayuda" element={<UserLayout><AyudaPage /></UserLayout>} />

      {/* Panel Pro (ventas/estadísticas) */}
      <Route path="/:tenantId/pro" element={<PanelProWithVentas />} />
      <Route path="/pro" element={<PanelProWithVentas />} />

      {/* Legacy redirects */}
      <Route path="/estadisticas" element={<Navigate to="/pro" replace />} />
      <Route path="/caja-diaria" element={<Navigate to="/pro" replace />} />
      <Route path="/staff" element={<Navigate to="/pro" replace />} />
      <Route path="/:tenantId/staff" element={<Navigate to="../pro" replace />} />
      <Route path="/panel" element={<Navigate to="/pro" replace />} />
      <Route path="/:tenantId/panel" element={<Navigate to="../pro" replace />} />
    </>
  );
}
