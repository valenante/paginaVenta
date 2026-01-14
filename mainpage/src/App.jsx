// src/App.jsx
import React, { useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

// 🌐 Landing
import TopBar from "./components/TopBar/TopBar";
import Introduccion from "./components/Introduccion/Introduccion";
import Hero from "./components/Hero/Hero";
import Features from "./components/Features/Features";
import Gallery from "./components/Gallery/Gallery";
import Packs from "./components/Packs/Packs";
import About from "./components/About/About";
import Contact from "./components/Contact/Contact";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
import TenantErrorScreen from "./components/TenantErrorScreen/TenantErrorScreen";

// 🔐 Auth
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import RegistroSuccess from "./pages/RegistroSuccess.jsx";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import ResetPassword from "./components/ForgotPassword/ResetPassword";

// 🛠 TPV / Usuario
import LoginImpersonar from "./pages/LoginImpersonar";
import DashboardPage from "./pages/DashboardPage";
import PerfilPage from "./pages/PerfilPage";
import RestauranteConfigPage from "./pages/RestauranteConfigPage";
import CartaConfigPage from "./pages/CartaConfigPage";
import ReservasConfigPage from "./pages/ReservasConfigPage";
import MiCuentaPage from "./pages/MiCuentaPage";
import FacturasPage from "./pages/FacturasPage";
// 🛡 SuperAdmin
import AdminLayout from "./pages/admin/AdminDashboard/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard/AdminDashboard";
import BillingPage from "./pages/admin/BillingPage";
import LogsPage from "./pages/admin/LogsPage";
import TicketsPage from "./pages/admin/TicketsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import PlanesAdmin from "./pages/admin/PlanesAdmin/PlanesAdmin.jsx";
import PanelPro from "./pages/PanelPro";

import SoporteDetalle from "./pages/SoporteDetalle.jsx";
import SoporteLista from "./pages/SoporteLista.jsx";
import SoporteNuevo from "./pages/SoporteNuevo.jsx";
import AyudaPage from "./pages/Ayuda/AyudaPage.jsx";


import TenantTable from "./pages/admin/AdminDashboard/components/TenantTable.jsx";
import CamareroPanel from "./pages/panel/CamareroPanel";
import CocineroPanel from "./pages/panel/CocineroPanel";

import VerifactuGlobalModal from "./context/VerifactuGlobalModal/VerifactuGlobalModal.jsx";
import { FeaturesPlanProvider } from "./context/FeaturesPlanContext.jsx";

// 🧠 Contextos para decidir qué ver en la home
import { useAuth } from "./context/AuthContext.jsx";
import { useTenant } from "./context/TenantContext.jsx";
import { useFeaturesPlan } from "./context/FeaturesPlanContext.jsx";
import { ProductosProvider } from "./context/ProductosContext.jsx";
import { SocketProvider } from "./utils/socket.jsx";
import { VentasProvider } from "./context/VentasContext";
import UserLayout from "./layouts/UserLayout";


// 📊 Página de estadísticas (la que ya tienes hecha)
import EstadisticasPage from "./pages/EstadisticasPage.jsx";
// Pagina de Caja Diaria
import CajaDiaria from "./components/CajaDiariaUltraPro/CajaDiariaUltraPro";
import ProveedoresPage from "./pages/ProveedoresPage";
import ProveedorDetalleLayout from "./pages/proveedores/ProveedorDetalleLayout.jsx";
import ProveedorResumenTab from "./pages/proveedores/tabs/ProveedorResumenTab.jsx";
import ProveedorProductosTab from "./pages/proveedores/tabs/ProveedorProductosTab.jsx";
import ProveedorPedidosTab from "./pages/proveedores/tabs/ProveedorPedidosTab.jsx";
import ProveedorFacturasTab from "./pages/proveedores/tabs/ProveedorFacturasTab.jsx";
import "./index.css";
import { CategoriasProvider } from "./context/CategoriasContext";
import { ShopCategoriasProvider } from "./context/ShopCategoriasContext";
import { ImagesProvider } from "./context/ImagesContext";
import Funcionamiento from "./components/Funcionamiento/Funcionamiento";
import ConfigImpresionPage from "./pages/ConfigImpresionPage";
import ConfigImpresionShopPage from "./pages/ConfigImpresionShopPage";
import ProveedorPedidoDetallePage from "./pages/proveedores/pedidos/ProveedorPedidoDetallePage.jsx";
/* =============================
   LANDING PÚBLICA (marketing)
   ============================= */
function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    // 1) Por hash (#packs)
    const porHash = location.hash === "#packs";

    // 2) Por query (?seleccionarPlan=1)
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
      <Gallery />
      <Packs />
      <About />
      <Contact />
    </div>
  );
}

/* ==========================================
   HOME ENTRY – decide landing vs estadísticas
   ========================================== */
function HomeEntry() {
  const { user } = useAuth();
  const { tenantId, tenantError } = useTenant();
  const { hasFeature, loading } = useFeaturesPlan();

  if (loading) return <LoadingScreen />;

  const isPro =
    !!user &&
    !!tenantId &&
    hasFeature("estadisticas_avanzadas", false);

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
  const { tenantId, tenantError } = useTenant();
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
      {/* 🏠 HOME:
          - si está logueado + plan pro -> estadísticas
          - si no -> landing
      */}
      <Route path="/" element={<HomeEntry />} />
      <Route path="/:tenantId" element={<HomeEntry />} />

      {/* 🔐 AUTENTICACIÓN */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/registro/success" element={<RegistroSuccess />} />
      <Route path="/registro/cancel" element={<RegistroSuccess />} />
      <Route path="/pago/exito" element={<RegistroSuccess />} />
      <Route path="/pago/cancelado" element={<RegistroSuccess />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/reset-password/:tenantId/:token"
        element={<ResetPassword />}
      />

      {/* 🛠 LOGIN IMPERSONAR */}
      <Route path="/tpv/login/:tenantId" element={<LoginImpersonar />} />

      {/* 🧑‍🍳 TPV / ÁREA RESTAURANTE */}
      <Route path="/tpv/:tenantId/dashboard" element={
        <UserLayout>
          <DashboardPage />
        </UserLayout>
      } />

      <Route path="/dashboard" element={
        <UserLayout>
          <DashboardPage />
        </UserLayout>
      } />

      <Route path="/mi-cuenta" element={
        <UserLayout>
          <MiCuentaPage />
        </UserLayout>
      } />

      <Route path="/facturas" element={
        <UserLayout>
          <FacturasPage />
        </UserLayout>
      } />

      <Route path="/perfil" element={
        <UserLayout>
          <PerfilPage />
        </UserLayout>
      } />

      <Route path="/configuracion/restaurante" element={
        <UserLayout>
          <RestauranteConfigPage />
        </UserLayout>
      } />

      <Route path="/configuracion/proveedores" element={
        <UserLayout>
          <ProveedoresPage />
        </UserLayout>
      } />

      <Route path="/configuracion/proveedores/:proveedorId" element={
        <UserLayout>
          <ProveedorDetalleLayout />
        </UserLayout>
      }>
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
      <Route path="/configuracion/carta" element={
        <UserLayout>
          <CartaConfigPage />
        </UserLayout>
      } />

      <Route path="/configuracion/reservas" element={
        <UserLayout>
          <ReservasConfigPage />
        </UserLayout>
      } />


      <Route path="/configuracion/impresion" element={
        <UserLayout>
          <ConfigImpresionPage />
        </UserLayout>
      } />

      <Route path="/configuracion/impresion-shop" element={
        <UserLayout>
          <ConfigImpresionShopPage />
        </UserLayout>
      } />

      <Route path="/soporte" element={<SoporteLista />} />
      <Route path="/soporte/nuevo" element={<SoporteNuevo />} />
      <Route path="/soporte/:id" element={<SoporteDetalle />} />
      <Route
        path="/ayuda"
        element={
          <UserLayout>
            <AyudaPage />
          </UserLayout>
        }
      />

      {/* 🔍 (OPCIONAL) Ruta directa a estadísticas si quieres */}
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

      {/* 👨‍🍽️ PANEL CAMARERO */}
      <Route
        path="/camarero"
        element={
          <UserLayout>
            <CamareroPanel />
          </UserLayout>
        }
      />

            {/* 👨‍🍽️ PANEL CAMARERO */}
      <Route
        path="/:tenantId/camarero"
        element={
          <UserLayout>
            <CamareroPanel />
          </UserLayout>
        }
      />

            {/* 👨‍🍽️ PANEL COCINER */}
      <Route
        path="/cocinero"
        element={
          <UserLayout>
            <CocineroPanel />
          </UserLayout>
        }
      />

            {/* 👨‍🍽️ PANEL COCINERO */}
      <Route
        path="/:tenantId/cocinero"
        element={
          <UserLayout>
            <CocineroPanel />
          </UserLayout>
        }
      />

      {/* 🛡 SUPERADMIN */}
      <Route path="/superadmin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="tenants" element={<TenantTable />} />
        <Route path="planes" element={<PlanesAdmin />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

/* =============================
   APP ROOT
   ============================= */
export default function App() {
  const [loadingApp, setLoadingApp] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoadingApp(false), 700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SocketProvider>
        <ImagesProvider>
          <FeaturesPlanProvider>
            <CategoriasProvider>
              <ShopCategoriasProvider>
                <ProductosProvider>
                  {loadingApp && <LoadingScreen />}

                  {!loadingApp && (
                    <>
                      <VerifactuGlobalModal />
                      <AppRoutes />
                    </>
                  )}
                </ProductosProvider>
              </ShopCategoriasProvider>
            </CategoriasProvider>
          </FeaturesPlanProvider>
        </ImagesProvider>
      </SocketProvider>
    </>
  );
}

