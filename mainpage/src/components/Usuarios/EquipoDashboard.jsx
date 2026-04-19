// src/components/Usuarios/EquipoDashboard.jsx
// Dashboard de rendimiento del equipo (camareros)
import React, { useEffect, useState, useMemo } from "react";
import api from "../../utils/api";
import "./EquipoDashboard.css";

const PERIODOS = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "Esta semana" },
  { key: "mes", label: "Este mes" },
];

function getRango(key) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hoy = `${yyyy}-${mm}-${dd}`;

  if (key === "hoy") return { desde: hoy, hasta: hoy };

  if (key === "semana") {
    const d = new Date(now);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1; // lunes = inicio
    d.setDate(d.getDate() - diff);
    const desde = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { desde, hasta: hoy };
  }

  return { desde: `${yyyy}-${mm}-01`, hasta: hoy };
}

function PctBadge({ val, avg, invertido = false }) {
  if (avg == null || avg === 0) return null;
  const diff = Math.round(((val - avg) / avg) * 100);
  if (diff === 0) return null;
  const bueno = invertido ? diff < 0 : diff > 0;
  const color = bueno ? "#22c55e" : "#ef4444";
  const sign = diff > 0 ? "+" : "";
  return <span className="equipo-badge" style={{ color }}>{sign}{diff}%</span>;
}

export default function EquipoDashboard() {
  const [periodo, setPeriodo] = useState("semana");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetch = async () => {
      setLoading(true);
      try {
        const { desde, hasta } = getRango(periodo);
        const res = await api.get("/admin/equipo/dashboard", {
          params: { desde, hasta },
          signal: controller.signal,
        });
        if (!cancelled) setData(res.data?.data || res.data || null);
      } catch (err) {
        if (!cancelled && err?.name !== "CanceledError") setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; controller.abort(); };
  }, [periodo]);

  const ranking = data?.ranking || [];
  const prom = data?.promedios || {};

  return (
    <section className="equipo-dashboard">
      <header className="equipo-header">
        <div>
          <h3 className="equipo-title">Rendimiento del equipo</h3>
          <p className="equipo-subtitle">Ranking de camareros por ingresos generados, upselling y cancelaciones.</p>
        </div>
        <div className="equipo-periodos">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              className={`equipo-periodo-btn ${periodo === p.key ? "equipo-periodo-btn--active" : ""}`}
              onClick={() => setPeriodo(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="equipo-loading">Cargando...</div>
      ) : ranking.length === 0 ? (
        <div className="equipo-empty">Sin actividad de camareros en este periodo.</div>
      ) : (
        <>
          {/* Tabla ranking */}
          <div className="equipo-table-wrap">
            <table className="equipo-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Pedidos</th>
                  <th>Productos</th>
                  <th>Importe</th>
                  <th>Ticket medio</th>
                  <th>Adicionales</th>
                  <th>Cancelaciones</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((c, i) => (
                  <tr key={c.nombre} className={c.cancelaciones > 0 && c.cancelaciones > (prom.totalCancelaciones / ranking.length) * 2 ? "equipo-row--alerta" : ""}>
                    <td className="equipo-rank">{i + 1}</td>
                    <td className="equipo-nombre">{c.nombre}</td>
                    <td>{c.totalPedidos}</td>
                    <td>{c.totalProductos}</td>
                    <td className="equipo-importe">
                      {c.totalImporte.toFixed(2)} €
                      <PctBadge val={c.totalImporte} avg={prom.totalGlobal / ranking.length} />
                    </td>
                    <td>
                      {c.ticketMedio.toFixed(2)} €
                      <PctBadge val={c.ticketMedio} avg={prom.ticketMedio} />
                    </td>
                    <td>
                      {c.pctAdicionales.toFixed(0)}%
                      <PctBadge val={c.pctAdicionales} avg={prom.pctAdicionales} />
                    </td>
                    <td className={c.cancelaciones > 0 ? "equipo-cancel" : ""}>
                      {c.cancelaciones}
                      {c.cancelaciones > 0 && (
                        <PctBadge val={c.cancelaciones} avg={prom.totalCancelaciones / ranking.length} invertido />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Insights */}
          {ranking.length >= 2 && (() => {
            const mejor = ranking[0];
            const mayorCancel = [...ranking].sort((a, b) => b.cancelaciones - a.cancelaciones)[0];
            const mejorUpsell = [...ranking].sort((a, b) => b.pctAdicionales - a.pctAdicionales)[0];
            const insights = [];

            if (mejor.ticketMedio > prom.ticketMedio * 1.1) {
              insights.push(`${mejor.nombre} tiene el mejor ticket medio (${mejor.ticketMedio.toFixed(2)}€, +${Math.round(((mejor.ticketMedio - prom.ticketMedio) / prom.ticketMedio) * 100)}% vs media).`);
            }
            if (mejorUpsell.pctAdicionales > 5) {
              insights.push(`${mejorUpsell.nombre} lidera en upselling con ${mejorUpsell.pctAdicionales.toFixed(0)}% de adicionales.`);
            }
            if (mayorCancel.cancelaciones > 3 && mayorCancel.cancelaciones > (prom.totalCancelaciones / ranking.length) * 2) {
              insights.push(`${mayorCancel.nombre} tiene ${mayorCancel.cancelaciones} cancelaciones — revisar.`);
            }

            if (!insights.length) return null;
            return (
              <div className="equipo-insights">
                {insights.map((text, i) => (
                  <div key={i} className="equipo-insight">{text}</div>
                ))}
              </div>
            );
          })()}
        </>
      )}
    </section>
  );
}
