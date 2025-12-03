import React from "react";
import { FiRefreshCcw, FiSearch } from "react-icons/fi";
import usePlanes from "../../../../Hooks/usePlanes";

export default function DashboardHeader({
  search,
  setSearch,
  planFilter,
  setPlanFilter,
  onRefresh,
}) {
  const { planes, loading } = usePlanes();

  return (
    <header className="dashboard-header">
      <h1>Panel SuperAdmin Alef</h1>

      <div className="header-controls">
        {/* 🔍 Barra de búsqueda */}
        <div className="search-bar">
          <FiSearch />
          <input
            type="text"
            placeholder="Buscar restaurante o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* 🟦 Select de planes reales */}
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
        >
          <option value="all">Todos los planes</option>

          {!loading &&
            planes.map((p) => (
              <option key={p._id} value={p.slug}>
                {p.nombre} ({p.slug})
              </option>
            ))}
        </select>

        {/* 🔁 Refrescar */}
        <button onClick={onRefresh} className="refresh-btn">
          <FiRefreshCcw /> Actualizar
        </button>
      </div>
    </header>
  );
}
