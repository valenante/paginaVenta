import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
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
} from "react-icons/fi";
import api from "../../../utils/api";

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // aunque falle, limpiamos sesión local
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
        <h2 className="logo">
          Alef<span>Admin</span>
        </h2>

        <nav className="menu">
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

          {/* ✅ NUEVO: Rollback API */}
          <NavLink to="/superadmin/rollback">
            <FiRefreshCcw /> Rollback API
          </NavLink>

          <NavLink to="/superadmin/restore">
            <FiFileText /> Restore & DR
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
        </nav>

        <button className="logout-btn" onClick={logout}>
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
