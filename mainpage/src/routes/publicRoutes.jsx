import React, { lazy } from "react";
import { Route, Navigate } from "react-router-dom";

const Login = lazy(() => import("../pages/Login"));
const Registro = lazy(() => import("../pages/Registro"));
const RegistroSuccess = lazy(() => import("../pages/RegistroSuccess.jsx"));
const ForgotPassword = lazy(() => import("../components/ForgotPassword/ForgotPassword"));
const ResetPassword = lazy(() => import("../components/ForgotPassword/ResetPassword"));
const SetPassword = lazy(() => import("../components/ForgotPassword/SetPassword"));
const LoginImpersonar = lazy(() => import("../pages/LoginImpersonar"));

const AvisoLegal = lazy(() => import("../pages/legal/AvisoLegal"));
const Privacidad = lazy(() => import("../pages/legal/Privacidad"));
const Cookies = lazy(() => import("../pages/legal/Cookies"));

export default function publicRoutes(HomeEntry) {
  return (
    <>
      {/* HOME */}
      <Route path="/" element={<HomeEntry />} />
      <Route path="/:tenantId" element={<HomeEntry />} />

      {/* AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/registro/success" element={<RegistroSuccess />} />
      <Route path="/registro/cancel" element={<RegistroSuccess />} />
      <Route path="/pago/exito" element={<RegistroSuccess />} />
      <Route path="/pago/cancelado" element={<RegistroSuccess />} />

      {/* LEGAL */}
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
    </>
  );
}
