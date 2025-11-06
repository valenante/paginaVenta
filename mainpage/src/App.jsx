import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TopBar from "./components/TopBar/TopBar";
import Introduccion from "./components/Introduccion/Introduccion";
import Hero from "./components/Hero/Hero";
import Features from "./components/Features/Features";
import Gallery from "./components/Gallery/Gallery";
import Packs from "./components/Packs/Packs";
import About from "./components/About/About";
import Contact from "./components/Contact/Contact";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import RegistroSuccess from "./pages/RegistroSuccess.jsx"; // 👈 importa el componente
import AdminDashboard from "./pages/admin/AdminDashboard/AdminDashboard";
import LoginImpersonar from "./pages/LoginImpersonar";
import DashboardPage from "./pages/DashboardPage";
import PerfilPage from "./pages/PerfilPage";
import RestauranteConfigPage from "./pages/RestauranteConfigPage";
import CartaConfigPage from "./pages/CartaConfigPage";
import ReservasConfigPage from "./pages/ReservasConfigPage";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import ResetPassword from "./components/ForgotPassword/ResetPassword";
import "./index.css";

function LandingPage() {
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:tenantId" element={<LandingPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/registro/success" element={<RegistroSuccess />} />
        <Route path="/registro/cancel" element={<RegistroSuccess />} />
        <Route path="/superadmin" element={<AdminDashboard />} />
        <Route path="/tpv/login/:tenantId" element={<LoginImpersonar />} />
        <Route path="/tpv/:tenantId/dashboard" element={<DashboardPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:tenantId/:token" element={<ResetPassword />} />

        {/* 👇 Nuevas rutas para el área privada */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/configuracion/restaurante" element={<RestauranteConfigPage />} />
        <Route path="/configuracion/carta" element={<CartaConfigPage />} />
        <Route path="/configuracion/reservas" element={<ReservasConfigPage />} />
      </Routes>
    </Router>
  );
}

export default App;
