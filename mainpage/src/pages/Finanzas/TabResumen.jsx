import React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useFinanzasDashboard, useFinanzasTendencia } from "../../hooks/useFinanzas";
import { eur, pct } from "./utils";

function Card({ icon, label, value, sub, color }) {
  return (
    <div className="fin-card" style={color ? { borderTopColor: color } : null}>
      <div className="fin-card-head">
        <span className="fin-card-icon">{icon}</span>
        <span className="fin-card-label">{label}</span>
      </div>
      <div className="fin-card-value">{value}</div>
      {sub && <div className="fin-card-sub">{sub}</div>}
    </div>
  );
}

export default function TabResumen({ periodo }) {
  const { data: dash, loading: dashLoading, error: dashError } =
    useFinanzasDashboard({ desde: periodo.desde, hasta: periodo.hasta });

  const { data: tend, loading: tendLoading } = useFinanzasTendencia({ meses: 12 });

  if (dashError) {
    return <div className="fin-error">Error cargando dashboard: {dashError}</div>;
  }
  if (dashLoading || !dash) {
    return <div className="fin-loading">Calculando finanzas…</div>;
  }

  const margenColor =
    dash.beneficioNeto < 0 ? "#ef4444" :
    dash.margenPct < 5     ? "#f97316" :
    dash.margenPct < 15    ? "#eab308" :
                             "#22c55e";

  return (
    <div className="fin-tab-resumen">
      {/* === Cards principales === */}
      <div className="fin-cards-grid">
        <Card
          icon="💰"
          label="Ingresos (sin IVA)"
          value={eur(dash.ingresos.baseImponible)}
          sub={`${dash.ingresos.unidadesVendidas} unidades vendidas`}
          color="#3b82f6"
        />
        <Card
          icon="📦"
          label="Coste ventas"
          value={eur(dash.costeVentas)}
          sub={
            dash.ingresos.baseImponible > 0
              ? `${pct((dash.costeVentas / dash.ingresos.baseImponible) * 100)} sobre ingresos`
              : "—"
          }
          color="#a855f7"
        />
        <Card
          icon="🏠"
          label="Gastos totales"
          value={eur(dash.gastos.total)}
          sub={`Proveedores ${eur(dash.gastos.proveedores)} · Fijos ${eur(dash.gastos.fijos)}`}
          color="#f97316"
        />
        <Card
          icon={dash.beneficioNeto >= 0 ? "📈" : "📉"}
          label="Beneficio neto"
          value={eur(dash.beneficioNeto)}
          sub={`Margen ${pct(dash.margenPct)}`}
          color={margenColor}
        />
      </div>

      {/* === Card cortesías === */}
      <div className="fin-cortesias-card">
        <div className="fin-cortesias-icon">🎁</div>
        <div className="fin-cortesias-body">
          <div className="fin-cortesias-title">Cortesías del periodo</div>
          <div className="fin-cortesias-grid">
            <div>
              <span className="fin-cortesias-num">{eur(dash.cortesias.valorRegalado)}</span>
              <span className="fin-cortesias-desc">valor regalado</span>
            </div>
            <div>
              <span className="fin-cortesias-num">{eur(dash.cortesias.costeRegalado)}</span>
              <span className="fin-cortesias-desc">coste real</span>
            </div>
            <div>
              <span
                className="fin-cortesias-num"
                style={{ color: dash.cortesias.impactoMargen > 5 ? "#ef4444" : "#94a3b8" }}
              >
                {pct(dash.cortesias.impactoMargen)}
              </span>
              <span className="fin-cortesias-desc">impacto en margen</span>
            </div>
          </div>
        </div>
      </div>

      {/* === Gráfico tendencia mensual === */}
      <div className="fin-chart-section">
        <h3>Tendencia últimos 12 meses</h3>
        {tendLoading || !tend ? (
          <div className="fin-loading">Cargando tendencia…</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tend.meses}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="mes" tick={{ fill: "rgba(229,231,235,0.7)", fontSize: 12 }} />
              <YAxis tick={{ fill: "rgba(229,231,235,0.7)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  color: "#e5e7eb",
                }}
                formatter={(v) => eur(v)}
              />
              <Legend wrapperStyle={{ color: "#e5e7eb" }} />
              <Line type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Ingresos" />
              <Line type="monotone" dataKey="gastos" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Gastos" />
              <Line type="monotone" dataKey="beneficio" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Beneficio" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
