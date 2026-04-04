import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/AdminDashboard.css";
import useTenantsData from "../../../hooks/useTenantsData";
import DashboardHeader from "./components/DashboardHeader";
import StatsCards from "./components/StatsCards";
import TenantTable from "./components/TenantTable";
import ChartsSection from "./components/ChartsSection";
import ChurnSection from "./components/ChurnSection";
import api from "../../../utils/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [billingData, setBillingData] = useState(null);

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/admin/superadminBilling");
        if (mounted) setBillingData(data);
      } catch {
        // billing data is optional — dashboard still works without it
      }
    })();
    return () => { mounted = false; };
  }, []);

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
      <ChurnSection />
      <ChartsSection tenants={filtered} billingData={billingData} />
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
