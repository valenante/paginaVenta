import React, { useEffect, useRef, useState } from "react";
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
  FiMenu,
  FiX,
} from "react-icons/fi";
import api from "../../../utils/api";

export default function AdminLayout() {
  const { user, isSuperadmin, loading } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarRef = useRef(null);

  if (loading) return <div className="admin-loading">Cargando...</div>;
  if (!user || !isSuperadmin) return <Navigate to="/" replace />;

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // logout may fail if session already expired — proceed anyway
    } finally {
      sessionStorage.removeItem("user");
      navigate("/login");
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="admin-layout">
      {/* Mobile top bar */}
      <div className="admin-topbar">
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          type="button"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
        <h2 className="admin-topbar__logo">
          Alef<span>Admin</span>
        </h2>
      </div>

      {/* Overlay (mobile) */}
      {menuOpen && (
        <div className="admin-sidebar-overlay" onClick={closeMenu} />
      )}

      {/* Sidebar / Drawer */}
      <aside
        ref={sidebarRef}
        className={`admin-sidebar${menuOpen ? " admin-sidebar--open" : ""}`}
      >
        <h2 className="logo" title="Alef Admin">
          Alef<span>Admin</span>
        </h2>

        <nav className="menu" aria-label="Navegación SuperAdmin">
          <NavLink end to="/superadmin" onClick={closeMenu}>
            <FiHome /> Dashboard
          </NavLink>
          <NavLink to="/superadmin/billing" onClick={closeMenu}>
            <FiFileText /> Facturación
          </NavLink>
          <NavLink to="/superadmin/planes" onClick={closeMenu}>
            <FiUsers /> Planes
          </NavLink>
          <NavLink to="/superadmin/monitor" onClick={closeMenu}>
            <FiActivity /> Estado del sistema
          </NavLink>
          <NavLink to="/superadmin/rollback" onClick={closeMenu}>
            <FiRefreshCcw /> Rollback API
          </NavLink>
          <NavLink to="/superadmin/restore" onClick={closeMenu}>
            <FiFileText /> Restore & DR
          </NavLink>
          <NavLink to="/superadmin/rgpd" onClick={closeMenu}>
            <FiFileText /> RGPD & Datos
          </NavLink>
          <NavLink to="/superadmin/exports" onClick={closeMenu}>
            <FiDownload /> Exports / Reports
          </NavLink>
          <NavLink to="/superadmin/migrations" onClick={closeMenu}>
            <FiDatabase /> Migraciones DB
          </NavLink>
          <NavLink to="/superadmin/logs" onClick={closeMenu}>
            <FiList /> Logs del sistema
          </NavLink>
          <NavLink to="/superadmin/tickets" onClick={closeMenu}>
            <FiFileText /> Tickets soporte
          </NavLink>
          <NavLink to="/superadmin/settings" onClick={closeMenu}>
            <FiSettings /> Ajustes
          </NavLink>
          <NavLink to="/superadmin/changelog" onClick={closeMenu}>
            <FiFileText /> Changelog
          </NavLink>

          <NavLink
            to="#"
            className="menu-logout"
            onClick={(e) => {
              e.preventDefault();
              closeMenu();
              logout();
            }}
          >
            <FiLogOut /> Salir
          </NavLink>
        </nav>

        <button className="logout-btn" onClick={logout} type="button">
          <FiLogOut /> Cerrar sesión
        </button>
      </aside>

      {/* Content */}
      <main className="admin-content">
        <div className="admin-content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
