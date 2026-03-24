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
    error,
    search,
    setSearch,
    planFilter,
    setPlanFilter,
    fetchTenants,
    page,
    setPage,
    totalPages,
    total,
  } = useTenantsData();

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
        + Nuevo negocio
      </button>

      {error && (
        <div className="admin-dashboard__error">
          {error}
          <button onClick={fetchTenants} className="admin-dashboard__retry">Reintentar</button>
        </div>
      )}

      <StatsCards tenants={filtered} />
      <ChartsSection tenants={filtered} />
      <TenantTable
        tenants={filtered}
        onRefresh={fetchTenants}
        loading={loading}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        total={total}
      />
    </div>
  );
}
