// components/cocinero/CocineroStats.jsx
import { useEffect, useState } from "react";
import api from "../../utils/api";
import * as logger from "../../utils/logger";
import "./CocineroStats.css";

export default function CocineroStats() {
  const hoy = new Date().toISOString().slice(0, 10);

  const [fecha, setFecha] = useState(hoy);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;

    const fetchStats = async () => {
      try {
        setLoading(true);

        const res = await api.get("/admin/cocina/estadisticas", {
          params: {
            desde: fecha,
            hasta: fecha,
          },
        });

        if (!cancelado) setStats(res.data);
      } catch (err) {
        logger.error("Error cargando stats cocina:", err);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    fetchStats();
    return () => (cancelado = true);
  }, [fecha]);

  const resumen = stats?.resumenGlobal || { totalPedidos: 0 };
  const productos = stats?.productos || [];
  const actividadPorHora = stats?.actividadPorHora || [];

  const horaPunta =
    actividadPorHora.reduce(
      (max, h) => (h.pedidos > max.pedidos ? h : max),
      { pedidos: 0 }
    )?._id ?? "—";

  return (
    <section className="cocinero-stats">
      <h3 className="stats-title-cocinero">🔥 Actividad en cocina</h3>

      {/* ===== SELECTOR FECHA ===== */}
      <div className="stats-fecha-cocinero">
        <label htmlFor="fecha-cocina" className="stats-label-fecha-cocinero">
          Día
        </label>
        <input
          id="fecha-cocina"
          type="date"
          value={fecha}
          max={hoy}
          onChange={(e) => setFecha(e.target.value)}
          className="stats-input-fecha-cocinero"
        />
      </div>

      {/* ===== TARJETAS ===== */}
      <div className="cocinero-grid-cocinero">
        <div className="card-cocinero stat-card-cocinero">
          <span className="stat-label-cocinero">Pedidos entrados</span>
          <span className="stat-value-cocinero">
            {loading ? "—" : resumen.totalPedidos}
          </span>
          <span className="stat-sub-cocinero">
            Pedidos enviados a cocina
          </span>
        </div>

        <div className="card-cocinero stat-card-cocinero">
          <span className="stat-label-cocinero">Hora punta</span>
          <span className="stat-value-cocinero">
            {loading ? "—" : `${horaPunta}:00`}
          </span>
          <span className="stat-sub-cocinero">
            Mayor carga de pedidos
          </span>
        </div>
      </div>

      {/* ===== TOP PLATOS ===== */}
      <section className="cocinero-top-productos-cocinero">
        <h4 className="stats-subtitle-cocinero">
          🍳 Platos más preparados
        </h4>

        {loading ? (
          <p className="stats-muted-cocinero">Cargando datos...</p>
        ) : productos.length === 0 ? (
          <p className="stats-muted-cocinero">
            No hay actividad en este día.
          </p>
        ) : (
          <ul className="top-productos-list-cocinero">
            {productos.slice(0, 5).map((p) => (
              <li
                key={p.productoId}
                className="top-producto-item-cocinero"
              >
                <span className="nombre-cocinero">{p.nombre}</span>
                <span className="cantidad-cocinero">
                  {p.cantidad} platos
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
