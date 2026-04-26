import React, { lazy } from "react";
import { Route, Navigate } from "react-router-dom";

const Login = lazy(() => import("../pages/Login"));
const Registro = lazy(() => import("../pages/Registro"));

// Programa de fidelización ALEF — cliente final
const RegistroCliente = lazy(() => import("../pages/cliente/RegistroCliente.jsx"));
const LoginCliente = lazy(() => import("../pages/cliente/LoginCliente.jsx"));
const PerfilCliente = lazy(() => import("../pages/cliente/PerfilCliente.jsx"));
const RestaurantesCliente = lazy(() => import("../pages/cliente/RestaurantesCliente.jsx"));
const DetalleRestauranteCliente = lazy(() => import("../pages/cliente/DetalleRestauranteCliente.jsx"));
const RecuperarPasswordCliente = lazy(() => import("../pages/cliente/RecuperarPasswordCliente.jsx"));
const RegistroSuccess = lazy(() => import("../pages/RegistroSuccess.jsx"));
const ForgotPassword = lazy(() => import("../components/ForgotPassword/ForgotPassword"));
const ResetPassword = lazy(() => import("../components/ForgotPassword/ResetPassword"));
const SetPassword = lazy(() => import("../components/ForgotPassword/SetPassword"));
const LoginImpersonar = lazy(() => import("../pages/LoginImpersonar"));

const AvisoLegal = lazy(() => import("../pages/legal/AvisoLegal"));
const Privacidad = lazy(() => import("../pages/legal/Privacidad"));
const Cookies = lazy(() => import("../pages/legal/Cookies"));
const TerminosServicio = lazy(() => import("../pages/legal/TerminosServicio"));
const DPA = lazy(() => import("../pages/legal/DPA"));
const GuiaVerifactu = lazy(() => import("../pages/legal/GuiaVerifactu"));

export default function publicRoutes(HomeEntry) {
  return (
    <>
      {/* HOME */}
      <Route path="/" element={<HomeEntry />} />
      <Route path="/:tenantId" element={<HomeEntry />} />

      {/* AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* PROGRAMA DE FIDELIZACIÓN ALEF — cliente final */}
      <Route path="/cliente" element={<Navigate to="/cliente/perfil" replace />} />
      <Route path="/cliente/registro" element={<RegistroCliente />} />
      <Route path="/cliente/login" element={<LoginCliente />} />
      <Route path="/cliente/recuperar" element={<RecuperarPasswordCliente />} />
      <Route path="/cliente/perfil" element={<PerfilCliente />} />
      <Route path="/cliente/restaurantes" element={<RestaurantesCliente />} />
      <Route path="/cliente/restaurante/:slug" element={<DetalleRestauranteCliente />} />
      <Route path="/registro/success" element={<RegistroSuccess />} />
      <Route path="/registro/cancel" element={<RegistroSuccess />} />
      <Route path="/pago/exito" element={<RegistroSuccess />} />
      <Route path="/pago/cancelado" element={<RegistroSuccess />} />

      {/* LEGAL */}
      <Route path="/aviso-legal" element={<AvisoLegal />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/terminos" element={<TerminosServicio />} />
      <Route path="/dpa" element={<DPA />} />
      <Route path="/verifactu" element={<GuiaVerifactu />} />

      {/* PASSWORD */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/set-password/:tenantId/:token" element={<SetPassword />} />
      <Route path="/reset-password/:tenantId/:token" element={<ResetPassword />} />

      {/* LOGIN IMPERSONAR */}
      <Route path="/tpv/login/:tenantId" element={<LoginImpersonar />} />
    </>
  );
}
