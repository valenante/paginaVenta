import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
// 🌐 Landing
import TopBar from "./components/TopBar/TopBar";
import Introduccion from "./components/Introduccion/Introduccion";
import Hero from "./components/Hero/Hero";
import Features from "./components/Features/Features";
import Gallery from "./components/Gallery/Gallery";
import Packs from "./components/Packs/Packs";
import About from "./components/About/About";
import Contact from "./components/Contact/Contact";

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

// 🛡 SuperAdmin
import AdminLayout from "./pages/admin/AdminDashboard/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard/AdminDashboard";
import BillingPage from "./pages/admin/BillingPage";
import LogsPage from "./pages/admin/LogsPage";
import TicketsPage from "./pages/admin/TicketsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import PlanesAdmin from "./pages/admin/PlanesAdmin/PlanesAdmin.jsx";

import SoporteDetalle from "./pages/SoporteDetalle.jsx";
import SoporteLista from "./pages/SoporteLista.jsx";
import SoporteNuevo from "./pages/SoporteNuevo.jsx";

import TenantTable from "./pages/admin/AdminDashboard/components/TenantTable.jsx";

import VerifactuGlobalModal from "./components/VerifactuGlobalModal/VerifactuGlobalModal.jsx"; // ✅ NUEVO
import { FeaturesPlanProvider } from "./context/FeaturesPlanContext.jsx";  // 👈 NUEVO

import "./index.css";

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
      <Features />
      <Gallery />
      <Packs />
      <About />
      <Contact />
    </div>
  );
}
export default function App() {
  return (
    <Router>
      <FeaturesPlanProvider>
        {/* 🔔 Modal global VeriFactu (solo aparece si hay sesión y está desactivado) */}
        <VerifactuGlobalModal />

        <Routes>
          {/* 🌍 LANDING PAGE */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/:tenantId" element={<LandingPage />} />

          {/* 🔐 AUTENTICACIÓN */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/registro/success" element={<RegistroSuccess />} />
          <Route path="/registro/cancel" element={<RegistroSuccess />} />
          <Route path="/pago/exito" element={<RegistroSuccess />} />
          <Route path="/pago/cancelado" element={<RegistroSuccess />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:tenantId/:token" element={<ResetPassword />} />

          {/* 🛠 LOGIN IMPERSONAR */}
          <Route path="/tpv/login/:tenantId" element={<LoginImpersonar />} />

          {/* 🧑‍🍳 TPV / ÁREA RESTAURANTE */}
          <Route path="/tpv/:tenantId/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/configuracion/restaurante" element={<RestauranteConfigPage />} />
          <Route path="/configuracion/carta" element={<CartaConfigPage />} />
          <Route path="/configuracion/reservas" element={<ReservasConfigPage />} />

          <Route path="/soporte" element={<SoporteLista />} />
          <Route path="/soporte/nuevo" element={<SoporteNuevo />} />
          <Route path="/soporte/:id" element={<SoporteDetalle />} />

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
      </FeaturesPlanProvider>
    </Router>
  );
}
