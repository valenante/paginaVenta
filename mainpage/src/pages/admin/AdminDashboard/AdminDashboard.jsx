// src/pages/admin/AdminDashboard/AdminDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/AdminDashboard.css";
import useTenantsData from "../../../Hooks/useTenantsData";
import DashboardHeader from "./components/DashboardHeader";
import StatsCards from "./components/StatsCards";
import TenantTable from "./components/TenantTable";
import ChartsSection from "./components/ChartsSection";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const {
    filtered,
    loading,
    search,
    setSearch,
    planFilter,
    setPlanFilter,
    fetchTenants,
  } = useTenantsData();

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div className="admin-dashboard">
      <DashboardHeader
        search={search}
        setSearch={setSearch}
        planFilter={planFilter}
        setPlanFilter={setPlanFilter}
        onRefresh={fetchTenants}
      />

      <button
        className="refresh-btn"
        onClick={() => navigate("/superadmin/tenants/nuevo")}
      >
        ➕ Nuevo negocio
      </button>

      <StatsCards tenants={filtered} />
      <ChartsSection tenants={filtered} />
      <TenantTable tenants={filtered} onRefresh={fetchTenants} />
    </div>
  );
}
