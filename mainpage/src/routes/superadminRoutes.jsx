import React, { lazy } from "react";
import { Route } from "react-router-dom";

const AdminLayout = lazy(() => import("../pages/admin/AdminDashboard/AdminLayout"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard/AdminDashboard"));
const BillingPage = lazy(() => import("../pages/admin/BillingPage"));
const LogsPage = lazy(() => import("../pages/admin/LogsPage"));
const TicketsPage = lazy(() => import("../pages/admin/TicketsPage"));
const SettingsPage = lazy(() => import("../pages/admin/SettingsPage"));
const PlanesAdmin = lazy(() => import("../pages/admin/PlanesAdmin/PlanesAdmin.jsx"));
const AdminMonitorPage = lazy(() => import("../pages/admin/AdminMonitor/AdminMonitorPage.jsx"));
const ApiRollbackPage = lazy(() => import("../pages/admin/AdminDashboard/rollback/ApiRollbackPage"));
const RestorePage = lazy(() => import("../pages/admin/restore/RestorePage"));
const RgpdPage = lazy(() => import("../pages/admin/restore/RgpdPage.jsx"));
const SuperadminExportsPage = lazy(() => import("../pages/admin/exports/SuperadminExportsPage.jsx"));
const MigrationsPage = lazy(() => import("../pages/admin/AdminDashboard/migrations/MigrationsPage.jsx"));
const MigrationsTenantPage = lazy(() => import("../pages/admin/AdminDashboard/migrations/MigrationsTenantPage.jsx"));
const TenantsPage = lazy(() => import("../pages/admin/tenants/TenantsPage"));
const SuperadminAltaTenant = lazy(() => import("../pages/admin/SuperadminAltaTenant/SuperadminAltaTenant.jsx"));

export default function superadminRoutes() {
  return (
    <Route path="/superadmin" element={<AdminLayout />}>
      <Route index element={<AdminDashboard />} />
      <Route path="tenants" element={<TenantsPage />} />
      <Route path="tenants/nuevo" element={<SuperadminAltaTenant />} />
      <Route path="planes" element={<PlanesAdmin />} />
      <Route path="billing" element={<BillingPage />} />
      <Route path="logs" element={<LogsPage />} />
      <Route path="tickets" element={<TicketsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="monitor" element={<AdminMonitorPage />} />
      <Route path="rollback" element={<ApiRollbackPage />} />
      <Route path="restore" element={<RestorePage />} />
      <Route path="rgpd" element={<RgpdPage />} />
      <Route path="exports" element={<SuperadminExportsPage />} />
      <Route path="migrations" element={<MigrationsPage />} />
      <Route path="migrations/:slug" element={<MigrationsTenantPage />} />
    </Route>
  );
}
