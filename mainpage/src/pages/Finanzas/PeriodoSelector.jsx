import React, { useState } from "react";
import { PERIODOS } from "./utils";

export default function PeriodoSelector({ value, onChange }) {
  const [custom, setCustom] = useState(false);

  const presets = [
    { key: "hoy", ...PERIODOS.hoy() },
    { key: "mes", ...PERIODOS.mes() },
  ];

  const isActive = (p) =>
    value?.desde === p.desde && value?.hasta === p.hasta;

  return (
    <div className="fin-periodo">
      <div className="fin-periodo-presets">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`fin-periodo-btn ${isActive(p) ? "active" : ""}`}
            onClick={() => {
              setCustom(false);
              onChange({ desde: p.desde, hasta: p.hasta });
            }}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          className={`fin-periodo-btn ${custom ? "active" : ""}`}
          onClick={() => setCustom((v) => !v)}
        >
          📅 Custom
        </button>
      </div>

      {custom && (
        <div className="fin-periodo-custom">
          <label>
            Desde
            <input
              type="date"
              value={value?.desde || ""}
              onChange={(e) => onChange({ ...value, desde: e.target.value })}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={value?.hasta || ""}
              onChange={(e) => onChange({ ...value, hasta: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
