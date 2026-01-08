// src/pages/admin/AdminDashboard/AdminDashboard.jsx
import React from "react";
import { useState } from "react";
import "../../../styles/AdminDashboard.css";
import useTenantsData from "../../../Hooks/useTenantsData";
import DashboardHeader from "./components/DashboardHeader";
import StatsCards from "./components/StatsCards";
import TenantTable from "./components/TenantTable";
import ChartsSection from "./components/ChartsSection";
import NuevoTenantModal from "./components/NuevoTenantModal/NuevoTenantModal";

export default function AdminDashboard() {
  const {
    filtered,
    loading,
    search,
    setSearch,
    planFilter,
    setPlanFilter,
    fetchTenants,
  } = useTenantsData();
  const [modalOpen, setModalOpen] = useState(false);

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

      <button className="refresh-btn" onClick={() => setModalOpen(true)}>
        ➕ Nuevo negocio
      </button>

      <NuevoTenantModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchTenants}
        defaultTipo="restaurante" // 👈 por ahora
      />

      <StatsCards tenants={filtered} />
      <ChartsSection tenants={filtered} />
      <TenantTable tenants={filtered} onRefresh={fetchTenants} />
    </div>
  );
}
