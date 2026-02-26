// src/App.jsx
import React, { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

/* =============================
   LANDING (EAGER: carga rápida)
   ============================= */
import TopBar from "./components/TopBar/TopBar";
import Introduccion from "./components/Introduccion/Introduccion";
import Hero from "./components/Hero/Hero";
import Funcionamiento from "./components/Funcionamiento/Funcionamiento";
import Features from "./components/Features/Features";
import Packs from "./components/Packs/Packs";
import Contact from "./components/Contact/Contact";
import Footer from "./components/Footer/Footer";

/* =============================
   UI GLOBAL (EAGER)
   ============================= */
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
import TenantErrorScreen from "./components/TenantErrorScreen/TenantErrorScreen";
import CookieBanner from "./components/CookieBanner/CookieBanner";
import WhatsAppFloating from "./components/WhatsAppFloating/WhatsAppFloating";
import VerifactuGlobalModal from "./context/VerifactuGlobalModal/VerifactuGlobalModal.jsx";

/* =============================
   CONTEXT / PROVIDERS (EAGER)
   ============================= */
import { FeaturesPlanProvider } from "./context/FeaturesPlanContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useTenant } from "./context/TenantContext.jsx";
import { useFeaturesPlan } from "./context/FeaturesPlanContext.jsx";
import { ProductosProvider } from "./context/ProductosContext.jsx";
import { SocketProvider } from "./utils/socket.jsx";
import { VentasProvider } from "./context/VentasContext";
import UserLayout from "./layouts/UserLayout";
import { CategoriasProvider } from "./context/CategoriasContext";
import { ShopCategoriasProvider } from "./context/ShopCategoriasContext";

import "./index.css";

/* =============================
   LAZY PAGES (CODE SPLITTING)
   ============================= */
// 🔐 Auth
const Login = lazy(() => import("./pages/Login"));
const Registro = lazy(() => import("./pages/Registro"));
const RegistroSuccess = lazy(() => import("./pages/RegistroSuccess.jsx"));
const ForgotPassword = lazy(() =>
  import("./components/ForgotPassword/ForgotPassword")
);
const ResetPassword = lazy(() =>
  import("./components/ForgotPassword/ResetPassword")
);
const SetPassword = lazy(() => import("./components/ForgotPassword/SetPassword"));

// 📄 Legal
const AvisoLegal = lazy(() => import("./pages/legal/AvisoLegal"));
const Privacidad = lazy(() => import("./pages/legal/Privacidad"));
const Cookies = lazy(() => import("./pages/legal/Cookies"));

// 🛠 TPV / Usuario
const LoginImpersonar = lazy(() => import("./pages/LoginImpersonar"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PerfilPage = lazy(() => import("./pages/PerfilPage"));
const RestauranteConfigPage = lazy(() => import("./pages/RestauranteConfigPage"));
const CartaConfigPage = lazy(() => import("./pages/CartaConfig/CartaConfigPage"));
const ReservasConfigPage = lazy(() => import("./pages/ReservasConfigPage"));
const MiCuentaPage = lazy(() => import("./pages/MiCuentaPage"));
const FacturasPage = lazy(() => import("./pages/FacturasPage"));

const ProveedoresPage = lazy(() => import("./pages/ProveedoresPage"));
const ProveedorDetalleLayout = lazy(() =>
  import("./pages/proveedores/ProveedorDetalleLayout.jsx")
);
const ProveedorResumenTab = lazy(() =>
  import("./pages/proveedores/tabs/ProveedorResumenTab.jsx")
);
const ProveedorProductosTab = lazy(() =>
  import("./pages/proveedores/tabs/ProveedorProductosTab.jsx")
);
const ProveedorPedidosTab = lazy(() =>
  import("./pages/proveedores/tabs/ProveedorPedidosTab.jsx")
);
const ProveedorFacturasTab = lazy(() =>
  import("./pages/proveedores/tabs/ProveedorFacturasTab.jsx")
);
const ProveedorPedidoDetallePage = lazy(() =>
  import("./pages/proveedores/pedidos/ProveedorPedidoDetallePage.jsx")
);

const SoporteDetalle = lazy(() => import("./pages/SoporteDetalle.jsx"));
const SoporteLista = lazy(() => import("./pages/SoporteLista.jsx"));
const SoporteNuevo = lazy(() => import("./pages/SoporteNuevo.jsx"));
const AyudaPage = lazy(() => import("./pages/Ayuda/AyudaPage.jsx"));

const PrintCenterPage = lazy(() => import("./pages/PrintCenterPage.jsx"));
const ExportsPage = lazy(() => import("./pages/ExportsPage.jsx"));

const EstadisticasPage = lazy(() => import("./pages/EstadisticasPage.jsx"));
const CajaDiaria = lazy(() =>
  import("./components/CajaDiariaUltraPro/CajaDiariaUltraPro")
);

const PanelPro = lazy(() => import("./pages/PanelPro"));

const ConfigImpresionPage = lazy(() => import("./pages/ConfigImpresionPage"));
const ConfigImpresionShopPage = lazy(() =>
  import("./pages/ConfigImpresionShopPage")
);

// Paneles
const CamareroPanel = lazy(() => import("./pages/panel/CamareroPanel"));
const CocineroPanel = lazy(() => import("./pages/panel/CocineroPanel"));

// 🛡 SuperAdmin
const AdminLayout = lazy(() =>
  import("./pages/admin/AdminDashboard/AdminLayout")
);
const AdminDashboard = lazy(() =>
  import("./pages/admin/AdminDashboard/AdminDashboard")
);
const BillingPage = lazy(() => import("./pages/admin/BillingPage"));
const LogsPage = lazy(() => import("./pages/admin/LogsPage"));
const TicketsPage = lazy(() => import("./pages/admin/TicketsPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const PlanesAdmin = lazy(() =>
  import("./pages/admin/PlanesAdmin/PlanesAdmin.jsx")
);
const AdminMonitorPage = lazy(() =>
  import("./pages/admin/AdminMonitor/AdminMonitorPage.jsx")
);
const ApiRollbackPage = lazy(() =>
  import("./pages/admin/AdminDashboard/rollback/ApiRollbackPage")
);
const RestorePage = lazy(() => import("./pages/admin/restore/RestorePage"));
const RgpdPage = lazy(() => import("./pages/admin/restore/RgpdPage.jsx"));
const SuperadminExportsPage = lazy(() =>
  import("./pages/admin/exports/SuperadminExportsPage.jsx")
);
const MigrationsPage = lazy(() =>
  import("./pages/admin/AdminDashboard/migrations/MigrationsPage.jsx")
);
const MigrationsTenantPage = lazy(() =>
  import("./pages/admin/AdminDashboard/migrations/MigrationsTenantPage.jsx")
);
const TenantsPage = lazy(() => import("./pages/admin/tenants/TenantsPage"));
const SuperadminAltaTenant = lazy(() =>
  import("./pages/admin/SuperadminAltaTenant/SuperadminAltaTenant.jsx")
);

/* =============================
   LANDING PÚBLICA (marketing)
   ============================= */
function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    const porHash = location.hash === "#packs";
    const params = new URLSearchParams(location.search);
    const seleccionarPlan = params.get("seleccionarPlan");

    if (porHash || seleccionarPlan === "1") {
      const el = document.getElementById("packs");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location]);

  return (
    <div className="main-grid">
      <TopBar />
      <Introduccion />
      <Hero />
      <Funcionamiento />
      <Features />
      <Packs />
      <Contact />
      <Footer />
    </div>
  );
}

/* ==========================================
   HOME ENTRY – decide landing vs PanelPro
   ========================================== */
function HomeEntry() {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const { hasFeature, loading } = useFeaturesPlan();

  if (loading) return <LoadingScreen />;

  const isPro = !!user && !!tenantId && hasFeature("estadisticas_avanzadas", false);

  if (isPro) {
    return (
      <UserLayout>
        <PanelPro />
      </UserLayout>
    );
  }

  return <LandingPage />;
}

/* =============================
   RUTAS DE LA APLICACIÓN
   ============================= */
function AppRoutes() {
  const { tenantError, tenantId } = useTenant();

  if (tenantError) {
    return (
      <TenantErrorScreen
        error={tenantError}
        onRetry={() => window.location.reload()}
        showDetails={import.meta?.env?.DEV}
      />
    );
  }

  return (
    <Routes>
      {/* HOME */}
      <Route path="/" element={<HomeEntry />} />
      <Route path="/:tenantId" element={<HomeEntry />} />

      {/* AUTENTICACIÓN */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/registro/success" element={<RegistroSuccess />} />
      <Route path="/registro/cancel" element={<RegistroSuccess />} />
      <Route path="/pago/exito" element={<RegistroSuccess />} />
      <Route path="/pago/cancelado" element={<RegistroSuccess />} />

      {/* LEGALES */}
      <Route path="/aviso-legal" element={<AvisoLegal />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route path="/cookies" element={<Cookies />} />

      {/* PASSWORD */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/set-password/:tenantId/:token" element={<SetPassword />} />
      <Route path="/reset-password/:tenantId/:token" element={<ResetPassword />} />

      {/* LOGIN IMPERSONAR */}
      <Route path="/tpv/login/:tenantId" element={<LoginImpersonar />} />

      {/* TPV / ÁREA RESTAURANTE */}
      <Route
        path="/tpv/:tenantId/dashboard"
        element={
          <UserLayout>
            <DashboardPage />
          </UserLayout>
        }
      />
      <Route
        path="/dashboard"
        element={
          <UserLayout>
            <DashboardPage />
          </UserLayout>
        }
      />
      <Route
        path="/mi-cuenta"
        element={
          <UserLayout>
            <MiCuentaPage />
          </UserLayout>
        }
      />
      <Route
        path="/facturas"
        element={
          <UserLayout>
            <FacturasPage />
          </UserLayout>
        }
      />
      <Route
        path="/perfil"
        element={
          <UserLayout>
            <PerfilPage />
          </UserLayout>
        }
      />

      {/* CONFIG */}
      <Route
        path="/configuracion/restaurante"
        element={
          <UserLayout>
            <RestauranteConfigPage />
          </UserLayout>
        }
      />

      <Route
        path="/configuracion/proveedores"
        element={
          <UserLayout>
            <ProveedoresPage />
          </UserLayout>
        }
      />

      <Route
        path="/configuracion/proveedores/:proveedorId"
        element={
          <UserLayout>
            <ProveedorDetalleLayout />
          </UserLayout>
        }
      >
        <Route index element={<ProveedorResumenTab />} />
        <Route path="productos" element={<ProveedorProductosTab />} />
        <Route path="pedidos" element={<ProveedorPedidosTab />} />
        <Route path="facturas" element={<ProveedorFacturasTab />} />
      </Route>

      <Route
        path="/configuracion/proveedores/:proveedorId/pedidos/:pedidoId"
        element={
          <UserLayout>
            <ProveedorPedidoDetallePage />
          </UserLayout>
        }
      />

      <Route
        path="/configuracion/carta"
        element={
          <UserLayout>
            <CartaConfigPage />
          </UserLayout>
        }
      />

      <Route
        path="/configuracion/reservas"
        element={
          <UserLayout>
            <ReservasConfigPage />
          </UserLayout>
        }
      />

      <Route
        path="/configuracion/impresion"
        element={
          <UserLayout>
            <ConfigImpresionPage />
          </UserLayout>
        }
      />

      <Route
        path="/configuracion/impresion/centro"
        element={
          <UserLayout>
            <PrintCenterPage />
          </UserLayout>
        }
      />

      <Route
        path="/configuracion/impresion-shop"
        element={
          <UserLayout>
            <ConfigImpresionShopPage />
          </UserLayout>
        }
      />

      {/* SOPORTE */}
      <Route element={<UserLayout />}>
        <Route path="soporte" element={<SoporteLista />} />
        <Route path="soporte/nuevo" element={<SoporteNuevo />} />
        <Route path="soporte/:id" element={<SoporteDetalle />} />
      </Route>

      <Route
        path="/ayuda"
        element={
          <UserLayout>
            <AyudaPage />
          </UserLayout>
        }
      />

      {/* ESTADÍSTICAS / CAJA */}
      <Route
        path="/estadisticas"
        element={
          <UserLayout>
            <EstadisticasPage type="plato" />
          </UserLayout>
        }
      />
      <Route
        path="/caja-diaria"
        element={
          <UserLayout>
            <CajaDiaria />
          </UserLayout>
        }
      />

      {/* PANEL PRO */}
      <Route
        path="/:tenantId/pro"
        element={
          <UserLayout>
            <PanelPro />
          </UserLayout>
        }
      />
      <Route
        path="/pro"
        element={
          <UserLayout>
            <VentasProvider tenantId={tenantId}>
              <PanelPro />
            </VentasProvider>
          </UserLayout>
        }
      />

      <Route
        path="/configuracion/exports"
        element={
          <UserLayout>
            <ExportsPage />
          </UserLayout>
        }
      />

      {/* PANEL EMPLEADOS */}
      <Route
        path="/camarero"
        element={
          <UserLayout>
            <CamareroPanel />
          </UserLayout>
        }
      />
      <Route
        path="/:tenantId/camarero"
        element={
          <UserLayout>
            <CamareroPanel />
          </UserLayout>
        }
      />

      <Route
        path="/cocinero"
        element={
          <UserLayout>
            <CocineroPanel />
          </UserLayout>
        }
      />
      <Route
        path="/:tenantId/cocinero"
        element={
          <UserLayout>
            <CocineroPanel />
          </UserLayout>
        }
      />

      {/* SUPERADMIN */}
      <Route path="/superadmin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="tenants/nuevo" element={<SuperadminAltaTenant />} />

        <Route path="planes" element={<PlanesAdmin />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="monitor" element={<AdminMonitorPage />} />
        <Route path="rollback" element={<ApiRollbackPage />} />
        <Route path="restore" element={<RestorePage />} />
        <Route path="rgpd" element={<RgpdPage />} />
        <Route path="exports" element={<SuperadminExportsPage />} />
        <Route path="migrations" element={<MigrationsPage />} />
        <Route path="migrations/:slug" element={<MigrationsTenantPage />} />
      </Route>
    </Routes>
  );
}

/* =============================
   APP ROOT
   ============================= */
export default function App() {
  const [loadingApp, setLoadingApp] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoadingApp(false), 700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SocketProvider>
      <FeaturesPlanProvider>
        <CategoriasProvider>
          <ShopCategoriasProvider>
            <ProductosProvider>
              {loadingApp && <LoadingScreen />}

              {!loadingApp && (
                <>
                  <VerifactuGlobalModal />
                  <CookieBanner />
                  <WhatsAppFloating />

                  <Suspense fallback={<LoadingScreen />}>
                    <AppRoutes />
                  </Suspense>
                </>
              )}
            </ProductosProvider>
          </ShopCategoriasProvider>
        </CategoriasProvider>
      </FeaturesPlanProvider>
    </SocketProvider>
  );
}