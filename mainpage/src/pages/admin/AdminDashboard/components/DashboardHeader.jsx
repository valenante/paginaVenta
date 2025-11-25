// src/pages/admin/AdminDashboard/components/DashboardHeader.jsx
import React from "react";
import { FiRefreshCcw, FiSearch } from "react-icons/fi";

export default function DashboardHeader({
  search,
  setSearch,
  planFilter,
  setPlanFilter,
  onRefresh,
}) {
  return (
    <header className="dashboard-header">
      <h1>Panel SuperAdmin Alef</h1>

      <div className="header-controls">
        <div className="search-bar">
          <FiSearch />
          <input
            type="text"
            placeholder="Buscar restaurante o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="gratis">gratis</option>
          <option value="premium">Premium</option>
        </select>

        <button onClick={onRefresh} className="refresh-btn">
          <FiRefreshCcw /> Actualizar
        </button>
      </div>
    </header>
  );
}
