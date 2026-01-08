// src/pages/admin/AdminDashboard/components/ChartsSection.jsx
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
} from "recharts";

import "./ChartsSection.css";

const COLORS = {
  restaurante: "#FF6700",
  shop: "#4ade80",
};

export default function ChartsSection({ tenants }) {
  /* ===============================
     📊 PLANES POR TIPO DE NEGOCIO
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
     📈 EVOLUCIÓN SEMANAL
  =============================== */
  const weeklyData = generarSemanas(tenants);

  return (
    <section className="charts-section">
      {/* ===== PIE ===== */}
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
              {planData.map((entry, index) => (
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

      {/* ===== LINE ===== */}
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
  );
}

/* ===============================
   📅 Helper semanal
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
