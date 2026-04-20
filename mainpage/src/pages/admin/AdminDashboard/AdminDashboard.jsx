import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/AdminDashboard.css";
import useTenantsData from "../../../hooks/useTenantsData";
import DashboardHeader from "./components/DashboardHeader";
import StatsCards from "./components/StatsCards";
import TenantTable from "./components/TenantTable";
import ChartsSection from "./components/ChartsSection";
import ChurnSection from "./components/ChurnSection";
import QuickActions from "./components/QuickActions";
import api from "../../../utils/api";

function HeroMetrics({ billingData, incidents, deploy }) {
  const mrr = billingData?.data?.mrr ?? billingData?.mrr ?? null;
  const activeCount = billingData?.data?.activeSubscriptions ?? billingData?.activeSubscriptions ?? "—";
  const p1 = incidents?.bySeverity?.P1 || 0;
  const openTotal = incidents?.openTotal || 0;

  return (
    <div className="hero-metrics">
      <div className="hero-metrics__card hero-metrics__card--mrr">
        <span className="hero-metrics__label">MRR</span>
        <span className="hero-metrics__value">{mrr != null ? `${Number(mrr).toLocaleString("es-ES", { minimumFractionDigits: 2 })}€` : "—"}</span>
        <span className="hero-metrics__sub">{activeCount} suscripciones activas</span>
      </div>
      <div className={`hero-metrics__card ${openTotal > 0 ? "hero-metrics__card--alert" : "hero-metrics__card--ok"}`}>
        <span className="hero-metrics__label">Incidentes</span>
        <span className="hero-metrics__value">{openTotal === 0 ? "Todo OK" : `${openTotal} abiertos`}</span>
        <span className="hero-metrics__sub">{p1 > 0 ? `${p1} P1 activos` : "Sin alertas P1"}</span>
      </div>
      <div className="hero-metrics__card">
        <span className="hero-metrics__label">Último deploy</span>
        <span className="hero-metrics__value">{deploy?.sha ? deploy.sha.slice(0, 8) : "—"}</span>
        <span className="hero-metrics__sub">{deploy?.slot ? `Slot ${deploy.slot}` : ""} {deploy?.buildTime ? new Date(deploy.buildTime).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [billingData, setBillingData] = useState(null);
  const [incidents, setIncidents] = useState(null);
  const [deploy, setDeploy] = useState(null);

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
      const [billing, monitor, apiStatus] = await Promise.allSettled([
        api.get("/admin/superadminBilling"),
        api.get("/admin/superadminMonitor/overview"),
        api.get("/admin/system/api/status"),
      ]);
      if (!mounted) return;
      if (billing.status === "fulfilled") setBillingData(billing.value.data);
      if (monitor.status === "fulfilled") {
        const d = monitor.value.data?.data || monitor.value.data;
        setIncidents(d?.counts || null);
      }
      if (apiStatus.status === "fulfilled") {
        const d = apiStatus.value.data?.data || apiStatus.value.data;
        const active = d?.activeSlot || {};
        setDeploy({ slot: active.slot, sha: active.deploySha, buildTime: active.buildTime });
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="admin-dashboard">
      <HeroMetrics billingData={billingData} incidents={incidents} deploy={deploy} />

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
      <QuickActions />
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
