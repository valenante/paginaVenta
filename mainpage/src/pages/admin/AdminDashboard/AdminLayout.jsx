// src/layouts/admin/AdminLayout.jsx  (ajusta ruta si difiere)
import React from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import "../../../styles/AdminLayout.css";
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiList,
  FiSettings,
  FiLogOut,
  FiActivity,
  FiRefreshCcw,
  FiDatabase,
  FiDownload,
} from "react-icons/fi";
import api from "../../../utils/api";

export default function AdminLayout() {
  const { user, isSuperadmin, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="admin-loading">Cargando...</div>;
  if (!user || !isSuperadmin) return <Navigate to="/" replace />;

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.warn("Logout falló:", e?.response?.data || e?.message);
    } finally {
      sessionStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <div className="admin-layout">
      {/* 📌 SIDEBAR */}
      <aside className="admin-sidebar">
        <h2 className="logo" title="Alef Admin">
          Alef<span>Admin</span>
        </h2>

        <nav className="menu" aria-label="Navegación SuperAdmin">
          <NavLink end to="/superadmin">
            <FiHome /> Dashboard
          </NavLink>

          <NavLink to="/superadmin/billing">
            <FiFileText /> Facturación
          </NavLink>

          <NavLink to="/superadmin/planes">
            <FiUsers /> Planes
          </NavLink>

          <NavLink to="/superadmin/monitor">
            <FiActivity /> Estado del sistema
          </NavLink>

          <NavLink to="/superadmin/rollback">
            <FiRefreshCcw /> Rollback API
          </NavLink>

          <NavLink to="/superadmin/restore">
            <FiFileText /> Restore & DR
          </NavLink>

          <NavLink to="/superadmin/rgpd">
            <FiFileText /> RGPD & Datos
          </NavLink>

          <NavLink to="/superadmin/exports">
            <FiDownload /> Exports / Reports
          </NavLink>

          <NavLink to="/superadmin/migrations">
            <FiDatabase /> Migraciones DB
          </NavLink>

          <NavLink to="/superadmin/logs">
            <FiList /> Logs del sistema
          </NavLink>

          <NavLink to="/superadmin/tickets">
            <FiFileText /> Tickets soporte
          </NavLink>

          <NavLink to="/superadmin/settings">
            <FiSettings /> Ajustes
          </NavLink>

          {/* ✅ Logout como item del menú (en desktop lo ocultamos, en móvil es clave) */}
          <NavLink
            to="#"
            className="menu-logout"
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
          >
            <FiLogOut /> Salir
          </NavLink>
        </nav>

        {/* ✅ Desktop: botón separado (en móvil se oculta) */}
        <button className="logout-btn" onClick={logout} type="button">
          <FiLogOut /> Cerrar sesión
        </button>
      </aside>

      {/* 📌 CONTENIDO */}
      <main className="admin-content">
        <div className="admin-content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}