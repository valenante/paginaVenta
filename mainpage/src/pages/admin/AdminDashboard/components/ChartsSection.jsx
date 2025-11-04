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
} from "recharts";

const COLORS = ["#6A0DAD", "#FF6700", "#98FF98", "#F5F5F5"];

export default function ChartsSection({ tenants }) {
  // 📊 Datos por plan
  const plansData = [
    { name: "gratis", value: tenants.filter(t => t.plan === "gratis").length },
    { name: "Premium", value: tenants.filter(t => t.plan === "premium").length },
  ];

  // 📈 Evolución temporal (por semana)
  const weeklyData = generarSemanas(tenants);

  return (
    <section className="charts-section">
      <div className="chart-card">
        <h3>Distribución de Planes</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={plansData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {plansData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Nuevos Tenants (últimas 6 semanas)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="tenants" stroke="#6A0DAD" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// 📅 Genera la cantidad de tenants creados por semana
function generarSemanas(tenants) {
  const ahora = new Date();
  const semanas = [];

  for (let i = 5; i >= 0; i--) {
    const inicio = new Date(ahora);
    inicio.setDate(ahora.getDate() - i * 7);
    const fin = new Date(ahora);
    fin.setDate(inicio.getDate() + 7);

    const count = tenants.filter(
      t => new Date(t.createdAt) >= inicio && new Date(t.createdAt) < fin
    ).length;

    semanas.push({
      semana: `${inicio.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      })}`,
      tenants: count,
    });
  }

  return semanas;
}
