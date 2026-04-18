// src/components/Estadisticas/StatsMatrizBCG.jsx
// Matriz BCG (Ingeniería de menú) — scatter plot con 4 cuadrantes
import React, { useEffect, useState, useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend,
} from "recharts";
import api from "../../utils/api";
import "./StatsMatrizBCG.css";

const CUADRANTES = {
  estrella:  { label: "Estrellas",          emoji: "⭐", color: "#22c55e", desc: "Alta popularidad + alto margen. Mantener y potenciar." },
  caballo:   { label: "Caballos de batalla", emoji: "🐴", color: "#f59e0b", desc: "Alta popularidad pero bajo margen. Considerar subir precio o reducir coste." },
  puzzle:    { label: "Puzzles",             emoji: "🧩", color: "#3b82f6", desc: "Bajo volumen pero buen margen. Promocionar más." },
  perro:     { label: "Perros",              emoji: "🐕", color: "#ef4444", desc: "Poco popular y bajo margen. Considerar retirar de la carta." },
};

const CATEGORY_COLORS = [
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#22c55e",
  "#eab308", "#6366f1", "#14b8a6", "#f43f5e", "#a855f7",
];

function clasificar(producto, medianaUds, medianaMargen) {
  const popular = producto.unidades >= medianaUds;
  const rentable = producto.margenPct >= medianaMargen;
  if (popular && rentable) return "estrella";
  if (popular && !rentable) return "caballo";
  if (!popular && rentable) return "puzzle";
  return "perro";
}

function mediana(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default function StatsMatrizBCG({ periodo }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { pageSize: 500, sortBy: "revenue" };
        if (periodo?.desde) params.desde = periodo.desde;
        if (periodo?.hasta) params.hasta = periodo.hasta;

        const res = await api.get("/admin/finanzas/productos-rentabilidad", {
          params,
          signal: controller.signal,
        });
        if (cancelled) return;

        const items = res.data?.items || res.data || [];
        setData(Array.isArray(items) ? items.filter((p) => p.unidades > 0) : []);
      } catch (err) {
        if (cancelled || err?.name === "CanceledError") return;
        setError("No se pudieron cargar los datos de rentabilidad.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; controller.abort(); };
  }, [periodo?.desde, periodo?.hasta]);

  const medianaUds = useMemo(() => mediana(data.map((p) => p.unidades)), [data]);
  const medianaMargen = useMemo(() => mediana(data.map((p) => p.margenPct)), [data]);

  const categorias = useMemo(() => [...new Set(data.map((p) => p.categoria))].sort(), [data]);
  const catColorMap = useMemo(() => {
    const map = {};
    categorias.forEach((c, i) => { map[c] = CATEGORY_COLORS[i % CATEGORY_COLORS.length]; });
    return map;
  }, [categorias]);

  const dataConCuadrante = useMemo(
    () => data.map((p) => ({ ...p, cuadrante: clasificar(p, medianaUds, medianaMargen) })),
    [data, medianaUds, medianaMargen]
  );

  const resumen = useMemo(() => {
    const r = { estrella: [], caballo: [], puzzle: [], perro: [] };
    for (const p of dataConCuadrante) r[p.cuadrante].push(p);
    return r;
  }, [dataConCuadrante]);

  if (loading) return <div className="bcg-loading">Cargando matriz de carta...</div>;
  if (error) return <div className="bcg-error">{error}</div>;
  if (!data.length) return <div className="bcg-empty">Sin datos de productos para este periodo.</div>;

  return (
    <div className="bcg-container">
      <header className="bcg-header">
        <h3 className="bcg-title">Matriz de carta</h3>
        <p className="bcg-subtitle">
          Clasifica tus productos por popularidad (unidades vendidas) y rentabilidad (margen %).
          Las líneas de corte son la mediana de tu carta.
        </p>
      </header>

      {/* Scatter plot */}
      <div className="bcg-chart-wrap">
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis
              type="number"
              dataKey="unidades"
              name="Unidades"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              label={{ value: "Unidades vendidas →", position: "bottom", fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="margenPct"
              name="Margen"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              label={{ value: "Margen % →", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 12 }}
              domain={["auto", "auto"]}
            />
            <ReferenceLine x={medianaUds} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
            <ReferenceLine y={medianaMargen} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                color: "#e5e7eb",
                fontSize: "0.85rem",
              }}
              formatter={(value, name) => {
                if (name === "Margen") return [`${Number(value).toFixed(1)}%`, "Margen"];
                return [value, name];
              }}
              labelFormatter={() => ""}
              content={({ payload }) => {
                if (!payload?.[0]?.payload) return null;
                const p = payload[0].payload;
                const q = CUADRANTES[p.cuadrante];
                return (
                  <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 14px", color: "#e5e7eb", fontSize: "0.85rem", maxWidth: 260 }}>
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>{p.nombre}</div>
                    <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{p.categoria}</div>
                    <div style={{ marginTop: 6 }}>{p.unidades} uds · {p.revenue?.toFixed(2)} € · Margen {p.margenPct?.toFixed(1)}%</div>
                    <div style={{ marginTop: 4, color: q?.color, fontWeight: 700, fontSize: "0.78rem" }}>{q?.emoji} {q?.label}</div>
                  </div>
                );
              }}
            />
            <Scatter data={dataConCuadrante} name="Productos">
              {dataConCuadrante.map((p, i) => (
                <Cell key={i} fill={CUADRANTES[p.cuadrante]?.color || "#666"} fillOpacity={0.8} r={6} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda cuadrantes */}
      <div className="bcg-legend">
        {Object.entries(CUADRANTES).map(([key, q]) => (
          <div key={key} className="bcg-legend-item">
            <span className="bcg-legend-dot" style={{ background: q.color }} />
            <span className="bcg-legend-label">{q.emoji} {q.label} ({resumen[key].length})</span>
          </div>
        ))}
      </div>

      {/* Tablas por cuadrante */}
      <div className="bcg-cuadrantes">
        {Object.entries(CUADRANTES).map(([key, q]) => {
          const items = resumen[key];
          if (!items.length) return null;
          return (
            <div key={key} className="bcg-cuadrante" style={{ borderTopColor: q.color }}>
              <h4 className="bcg-cuadrante-title">
                {q.emoji} {q.label} <span className="bcg-cuadrante-count">({items.length})</span>
              </h4>
              <p className="bcg-cuadrante-desc">{q.desc}</p>
              <ul className="bcg-cuadrante-list">
                {items
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 10)
                  .map((p) => (
                    <li key={p.productoId || p.nombre} className="bcg-cuadrante-item">
                      <span className="bcg-cuadrante-name">{p.nombre}</span>
                      <span className="bcg-cuadrante-meta">
                        {p.unidades} uds · {p.revenue?.toFixed(0)}€ · {p.margenPct?.toFixed(0)}%
                      </span>
                    </li>
                  ))}
                {items.length > 10 && (
                  <li className="bcg-cuadrante-more">y {items.length - 10} más</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
