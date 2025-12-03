// src/components/Estadisticas/StatsFilterBar.jsx
import React from "react";
import "./EstadisticasFinal.css";
import AlefSelect from "../AlefSelect/AlefSelect"; // 🔁 AJUSTA ESTA RUTA SI HACE FALTA

const StatsFilterBar = ({
  tipo,                 // "plato" | "bebida"
  onChangeTipo,
  categories,
  selectedCategory,
  onChangeCategory,
  selectedDate,
  onChangeDate,
}) => {
  const handleDateChange = (e) => {
    const value = e.target.value;
    if (!value) {
      onChangeDate(null);
      return;
    }
    const date = new Date(value + "T00:00:00");
    onChangeDate(date);
  };

  const dateValue = selectedDate
    ? selectedDate.toISOString().slice(0, 10)
    : "";

  return (
    <div className="stats-filter-bar">
      {/* Toggle tipo producto */}
      <div className="stats-filter-type-toggle">
        <button
          type="button"
          className={`stats-type-btn ${tipo === "plato" ? "active" : ""}`}
          onClick={() => onChangeTipo("plato")}
        >
          🍽️ Platos
        </button>
        <button
          type="button"
          className={`stats-type-btn ${tipo === "bebida" ? "active" : ""}`}
          onClick={() => onChangeTipo("bebida")}
        >
          🥂 Bebidas
        </button>
      </div>

      {/* Filtros de categoría y fecha */}
      <div className="stats-filter-controls">
        <div className="stats-filter-group">
          <AlefSelect
            label="Categoría"
            value={selectedCategory}       // "burgers"
            options={categories}           // ["burgers", "ensaladas", ...]
            onChange={onChangeCategory}    // recibe string
          />
        </div>

        <div className="stats-filter-group">
          <label>Fecha (opcional)</label>
          <input
            type="date"
            value={dateValue}
            onChange={handleDateChange}
          />
        </div>
      </div>
    </div>
  );
};

export default StatsFilterBar;
