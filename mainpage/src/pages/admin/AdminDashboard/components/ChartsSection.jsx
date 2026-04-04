import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from "recharts";

import "./ChartsSection.css";

const COLORS = {
  restaurante: "#FF6700",
  shop: "#4ade80",
};

export default function ChartsSection({ tenants, billingData }) {
  /* ===============================
     PLANES POR TIPO DE NEGOCIO
  =============================== */
  const planData = [];

  tenants.forEach((t) => {
    const key = `${t.plan}-${t.tipoNegocio}`;
    const existing = planData.find((p) => p.key === key);

    if (existing) {
      existing.value += 1;
    } else {
      planData.push({
        key,
        name: `${t.plan} (${t.tipoNegocio})`,
        value: 1,
        tipo: t.tipoNegocio,
      });
    }
  });

  /* ===============================
     EVOLUCIÓN SEMANAL
  =============================== */
  const weeklyData = generarSemanas(tenants);

  /* ===============================
     MRR TREND
  =============================== */
  const mrrTrend = billingData?.mrrTrend || [];
  const currentMrr = mrrTrend.length > 0 ? mrrTrend[mrrTrend.length - 1].mrr : 0;
  const prevMrr = mrrTrend.length > 1 ? mrrTrend[mrrTrend.length - 2].mrr : 0;
  const mrrChange = prevMrr > 0 ? ((currentMrr - prevMrr) / prevMrr) * 100 : 0;

  return (
    <>
      <section className="charts-section">
        {/* PIE */}
        <div className="chart-card">
          <h3>Distribución de Planes por Tipo</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={planData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {planData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={COLORS[entry.tipo] || "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* LINE — Nuevos tenants */}
        <div className="chart-card">
          <h3>Nuevos Tenants (6 semanas)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="restaurantes"
                stroke={COLORS.restaurante}
                strokeWidth={2}
                name="Restaurantes"
              />
              <Line
                type="monotone"
                dataKey="tiendas"
                stroke={COLORS.shop}
                strokeWidth={2}
                name="Tiendas"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* MRR TREND — full width */}
      {mrrTrend.length > 0 && (
        <section className="charts-section charts-section--full">
          <div className="chart-card">
            <div className="chart-card__header">
              <div>
                <h3>Ingresos Recurrentes (MRR)</h3>
                <p className="chart-card__subtitle">Últimos 12 meses</p>
              </div>
              <div className="chart-card__kpi">
                <span className="chart-card__value">{currentMrr.toFixed(2)} €</span>
                {mrrChange !== 0 && (
                  <span className={`chart-card__change ${mrrChange > 0 ? "chart-card__change--up" : "chart-card__change--down"}`}>
                    {mrrChange > 0 ? "+" : ""}{mrrChange.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={mrrTrend}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(2)} €`, "MRR"]}
                  contentStyle={{ background: "#1e293b", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 8 }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="#4ade80"
                  strokeWidth={2.5}
                  fill="url(#mrrGrad)"
                  name="MRR"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </>
  );
}

/* ===============================
   Helper semanal
=============================== */
function generarSemanas(tenants) {
  const ahora = new Date();
  const semanas = [];

  for (let i = 5; i >= 0; i--) {
    const inicio = new Date(ahora);
    inicio.setDate(ahora.getDate() - i * 7);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 7);

    const restaurantes = tenants.filter(
      (t) =>
        t.tipoNegocio !== "shop" &&
        new Date(t.createdAt) >= inicio &&
        new Date(t.createdAt) < fin
    ).length;

    const tiendas = tenants.filter(
      (t) =>
        t.tipoNegocio === "shop" &&
        new Date(t.createdAt) >= inicio &&
        new Date(t.createdAt) < fin
    ).length;

    semanas.push({
      semana: inicio.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      }),
      restaurantes,
      tiendas,
    });
  }

  return semanas;
}
