import React, { Suspense, useEffect } from "react";
import { Routes, useLocation, useParams, Navigate, useNavigate } from "react-router-dom";

/* ── Landing sections (eager — first paint) ── */
import TopBar from "./components/TopBar/TopBar";
import Introduccion from "./components/Introduccion/Introduccion";
import Hero from "./components/Hero/Hero";
import Funcionamiento from "./components/Funcionamiento/Funcionamiento";
import Features from "./components/Features/Features";
import Packs from "./components/Packs/Packs";
import Contact from "./components/Contact/Contact";
import Footer from "./components/Footer/Footer";

/* ── Global UI (eager) ── */
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import TenantErrorScreen from "./components/TenantErrorScreen/TenantErrorScreen";
import CookieBanner from "./components/CookieBanner/CookieBanner";
import WhatsAppFloating from "./components/WhatsAppFloating/WhatsAppFloating";

/* ── Providers (eager) ── */
import { FeaturesPlanProvider } from "./context/FeaturesPlanContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useTenant } from "./context/TenantContext.jsx";
import { ProductosProvider } from "./context/ProductosContext.jsx";
import { SocketProvider } from "./utils/socket.jsx";
import { CategoriasProvider } from "./context/CategoriasContext";
import { ShopCategoriasProvider } from "./context/ShopCategoriasContext";

/* ── Route modules ── */
import publicRoutes from "./routes/publicRoutes.jsx";
import panelRoutes from "./routes/panelRoutes.jsx";
import superadminRoutes from "./routes/superadminRoutes.jsx";

/* ── Styles ── */
import "./index.css";
import "./styles/dashboard-common.css";
import "./styles/config-common.css";

/* ══════════════════════════════════════════════
   Landing pública (marketing)
   ══════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════
   Home entry — decide landing vs panel
   ══════════════════════════════════════════════ */
function HomeEntry() {
  const { user, loading: authLoading } = useAuth();
  const { tenantId } = useTenant();
  const params = useParams();

  if (authLoading) return <LoadingScreen />;
  if (!user) return <LandingPage />;
  if (user.role === "superadmin") return <Navigate to="/superadmin" replace />;

  const resolvedTenantId = params.tenantId || tenantId || user?.tenantSlug || user?.tenantId;
  const target = resolvedTenantId ? `/${resolvedTenantId}/pro` : "/pro";
  return <Navigate to={target} replace />;
}

/* ══════════════════════════════════════════════
   WhatsApp gate — solo en landing pública
   ══════════════════════════════════════════════ */
function WhatsAppFloatingGate() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  const isInternalRoute =
    location.pathname.startsWith("/configuracion") ||
    location.pathname.startsWith("/tpv") ||
    location.pathname.startsWith("/perfil") ||
    location.pathname.startsWith("/mi-cuenta") ||
    location.pathname.startsWith("/facturas") ||
    location.pathname.startsWith("/pro") ||
    location.pathname.startsWith("/staff") ||
    location.pathname.startsWith("/panel") ||
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/superadmin") ||
    location.pathname.startsWith("/camarero") ||
    location.pathname.startsWith("/cocinero") ||
    /\/\w+\/(camarero|cocinero|pro|staff|panel)$/.test(location.pathname);

  if (authLoading || user || isInternalRoute) return null;
  return <WhatsAppFloating />;
}

/* ══════════════════════════════════════════════
   App routes — ensambla los módulos
   ══════════════════════════════════════════════ */
const TENANT_BLOCKED_MESSAGES = {
  TENANT_SUSPENDIDO: {
    title: "Cuenta suspendida",
    message: "Tu cuenta ha sido suspendida temporalmente. Contacta con soporte de Alef para más información.",
  },
  TENANT_IMPAGO: {
    title: "Pago pendiente",
    message: "Hay un pago pendiente en tu suscripción. Actualiza tu método de pago o contacta con soporte.",
  },
  TENANT_CANCELADO: {
    title: "Suscripción cancelada",
    message: "Tu suscripción ha sido cancelada. Si deseas reactivar tu cuenta, contacta con soporte.",
  },
};

function AppRoutes() {
  const { tenantError, tenantErrorCode, clearTenant } = useTenant();
  const navigate = useNavigate();

  // Tenant bloqueado → redirigir a login con mensaje
  useEffect(() => {
    if (!tenantErrorCode) return;
    const blocked = TENANT_BLOCKED_MESSAGES[tenantErrorCode];
    if (blocked) {
      clearTenant();
      sessionStorage.setItem("tenantBlockedMsg", JSON.stringify(blocked));
      navigate("/login", { replace: true });
    }
  }, [tenantErrorCode, clearTenant, navigate]);

  if (tenantError && !TENANT_BLOCKED_MESSAGES[tenantErrorCode]) {
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
      {publicRoutes(HomeEntry)}
      {panelRoutes()}
      {superadminRoutes()}
    </Routes>
  );
}

/* ══════════════════════════════════════════════
   App root
   ══════════════════════════════════════════════ */
export default function App() {
  return (
    <SocketProvider>
      <FeaturesPlanProvider>
        <CategoriasProvider>
          <ShopCategoriasProvider>
            <ProductosProvider>
              <CookieBanner />
              <WhatsAppFloatingGate />
              <ErrorBoundary>
                <Suspense fallback={<LoadingScreen />}>
                  <AppRoutes />
                </Suspense>
              </ErrorBoundary>
            </ProductosProvider>
          </ShopCategoriasProvider>
        </CategoriasProvider>
      </FeaturesPlanProvider>
    </SocketProvider>
  );
}
