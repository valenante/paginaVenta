import React, { useState } from "react";
import PeriodoSelector from "./PeriodoSelector";
import TabResumen from "./TabResumen";
import TabProductos from "./TabProductos";
import TabGastos from "./TabGastos";
import { PERIODOS } from "./utils";
import "./Finanzas.css";

const TABS = [
  { key: "resumen", label: "📊 Resumen" },
  { key: "productos", label: "🍽️ Productos" },
  { key: "gastos", label: "🧾 Gastos fijos" },
];

export default function FinanzasPage() {
  const [periodo, setPeriodo] = useState(PERIODOS.mes());
  const [tab, setTab] = useState("resumen");

  return (
    <div className="finanzas-root">
      <div className="finanzas-header">
        <div className="finanzas-title">
          <h2>Finanzas</h2>
          <span className="finanzas-subtitle">
            Ingresos, costes y beneficio neto del negocio
          </span>
        </div>
        {tab !== "gastos" && (
          <PeriodoSelector value={periodo} onChange={setPeriodo} />
        )}
      </div>

      <div className="finanzas-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`finanzas-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="finanzas-content">
        {tab === "resumen" && <TabResumen periodo={periodo} />}
        {tab === "productos" && <TabProductos periodo={periodo} />}
        {tab === "gastos" && <TabGastos />}
      </div>
    </div>
  );
}
