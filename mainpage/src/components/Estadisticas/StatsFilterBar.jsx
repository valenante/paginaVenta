// src/components/Estadisticas/StatsFilterBar.jsx
import React from "react";
import "./EstadisticasFinal.css";
import AlefSelect from "../AlefSelect/AlefSelect";

const TIPOS = [
  { value: "plato", label: "Platos" },
  { value: "bebida", label: "Bebidas" },
];

const formatDateInput = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const StatsFilterBar = ({
  tipo,
  onChangeTipo,
  categories,
  selectedCategory,
  onChangeCategory,
  startDate,
  endDate,
  onChangeStartDate,
  onChangeEndDate,
  loadingCategories = false,
}) => {
  const handleStartDateChange = (e) => {
    onChangeStartDate(parseDateInput(e.target.value));
  };

  const handleEndDateChange = (e) => {
    onChangeEndDate(parseDateInput(e.target.value));
  };

  const limpiarFechas = () => {
    onChangeStartDate(null);
    onChangeEndDate(null);
  };

  const startDateValue = formatDateInput(startDate);
  const endDateValue = formatDateInput(endDate);
  const hayFechas = startDate || endDate;

  return (
    <div className="stats-filter-bar">
      <div className="stats-filter-controls">

        {/* Selector de tipo */}
        {onChangeTipo && (
          <div className="stats-filter-group stats-filter-group--tipo">
            {TIPOS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`stats-tipo-btn${tipo === value ? " stats-tipo-btn--active" : ""}`}
                onClick={() => onChangeTipo(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Selector de categoría */}
        <div className="stats-filter-group">
          {loadingCategories ? (
            <span className="stats-filter-loading">Cargando…</span>
          ) : (
            <AlefSelect
              label="Categoría"
              value={selectedCategory}
              options={categories}
              onChange={onChangeCategory}
            />
          )}
        </div>

        {/* Rango de fechas */}
        <div className="stats-filter-group">
          <label htmlFor="stats-start-date">Desde</label>
          <input
            id="stats-start-date"
            type="date"
            value={startDateValue}
            onChange={handleStartDateChange}
            max={endDateValue || undefined}
          />
        </div>

        <div className="stats-filter-group">
          <label htmlFor="stats-end-date">Hasta</label>
          <input
            id="stats-end-date"
            type="date"
            value={endDateValue}
            onChange={handleEndDateChange}
            min={startDateValue || undefined}
          />
        </div>

        {hayFechas && (
          <div className="stats-filter-group">
            <button
              type="button"
              className="stats-clear-btn"
              onClick={limpiarFechas}
            >
              Limpiar fechas
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default StatsFilterBar;
