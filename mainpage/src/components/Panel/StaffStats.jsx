import { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import * as logger from "../../utils/logger";
import "./StaffStats.css";

export default function StaffStats() {
  const { user } = useAuth();
  const hoyRef = useRef(new Date().toISOString().slice(0, 10));

  const [fecha, setFecha] = useState(hoyRef.current);
  const [actual, setActual] = useState(null);
  const [anterior, setAnterior] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ordenProductos, setOrdenProductos] = useState("cantidad");

  const controllerRef = useRef(null);

  useEffect(() => {
    const check = setInterval(() => {
      const now = new Date().toISOString().slice(0, 10);
      if (now !== hoyRef.current) {
        hoyRef.current = now;
        setFecha((prev) => (prev === hoyRef.current ? now : prev));
      }
    }, 60_000);
    return () => clearInterval(check);
  }, []);

  const fetchStats = () => {
    if (!user?.id) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    const fechaAnterior = getFechaOffsetFrom(fecha, 1);

    Promise.all([
      api.get(`/admin/usuarios/${user.id}/estadisticas`, {
        params: { desde: fecha, hasta: fecha },
        signal: controller.signal,
      }),
      api.get(`/admin/usuarios/${user.id}/estadisticas`, {
        params: { desde: fechaAnterior, hasta: fechaAnterior },
        signal: controller.signal,
      }),
    ])
      .then(([actualRes, anteriorRes]) => {
        if (controller.signal.aborted) return;
        setActual(actualRes.data);
        setAnterior(anteriorRes.data);
      })
      .catch((err) => {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        logger.error("Error cargando estadísticas de staff:", err);
        setError("No se pudieron cargar las estadísticas.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
    return () => controllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, fecha]);

  const resumenActual = actual?.resumenGlobal || { totalPedidos: 0, totalImporte: 0 };
  const resumenAnterior = anterior?.resumenGlobal || { totalPedidos: 0, totalImporte: 0 };

  const variacionImporte = calcularVariacion(resumenActual.totalImporte, resumenAnterior.totalImporte);
  const variacionPedidos = calcularVariacion(resumenActual.totalPedidos, resumenAnterior.totalPedidos);

  const productosRaw = actual?.productos || [];

  const productos = useMemo(() => {
    const sorted = [...productosRaw].sort((a, b) =>
      ordenProductos === "cantidad"
        ? (b.cantidad || 0) - (a.cantidad || 0)
        : (b.totalFacturado || 0) - (a.totalFacturado || 0)
    );
    return sorted.slice(0, 10);
  }, [productosRaw, ordenProductos]);

  const maxVal = useMemo(() => {
    if (!productos.length) return 1;
    return ordenProductos === "cantidad"
      ? Math.max(...productos.map((p) => p.cantidad || 0), 1)
      : Math.max(...productos.map((p) => p.totalFacturado || 0), 1);
  }, [productos, ordenProductos]);

  const formatCurrency = (v) => `${Number(v || 0).toFixed(2)} €`;

  return (
    <section className="staff-stats">
      <h3 className="stats-title">Estadísticas del usuario</h3>

      <div className="stats-fecha">
        <label htmlFor="fecha-staff" className="stats-fecha-label">Día</label>
        <input
          id="fecha-staff"
          type="date"
          value={fecha}
          max={hoyRef.current}
          onChange={(e) => setFecha(e.target.value)}
          className="stats-fecha-input"
        />
      </div>

      {error ? (
        <div className="stats-error">
          <span className="stats-error-text">{error}</span>
          <button className="stats-error-btn" onClick={fetchStats}>Reintentar</button>
        </div>
      ) : (
        <>
          <div className="staff-grid stats">
            <div className="card stat-card">
              <span className="stat-label">Importe generado</span>
              <span className="stat-value">
                {loading ? "—" : formatCurrency(resumenActual.totalImporte)}
              </span>
              <span className={`stat-sub ${variacionImporte.clase}`}>
                {loading ? "" : variacionImporte.texto}
              </span>
            </div>

            <div className="card stat-card">
              <span className="stat-label">Pedidos gestionados</span>
              <span className="stat-value">
                {loading ? "—" : resumenActual.totalPedidos}
              </span>
              <span className={`stat-sub ${variacionPedidos.clase}`}>
                {loading ? "" : variacionPedidos.texto}
              </span>
            </div>

            <div className="card stat-card">
              <span className="stat-label">Ticket medio</span>
              <span className="stat-value">
                {loading
                  ? "—"
                  : resumenActual.totalPedidos > 0
                    ? formatCurrency(resumenActual.totalImporte / resumenActual.totalPedidos)
                    : "0.00 €"}
              </span>
              <span className="stat-sub">Por pedido</span>
            </div>

            <div className="card stat-card">
              <span className="stat-label">Productos vendidos</span>
              <span className="stat-value">
                {loading ? "—" : productosRaw.reduce((s, p) => s + (p.cantidad || 0), 0)}
              </span>
              <span className="stat-sub">Unidades totales</span>
            </div>
          </div>

          <section className="staff-top-productos">
            <div className="top-productos-header">
              <h4 className="stats-subtitle">Productos más vendidos</h4>
              <div className="top-productos-toggle">
                <button
                  type="button"
                  className={`top-toggle-btn ${ordenProductos === "cantidad" ? "top-toggle-btn--active" : ""}`}
                  onClick={() => setOrdenProductos("cantidad")}
                >
                  Cantidad
                </button>
                <button
                  type="button"
                  className={`top-toggle-btn ${ordenProductos === "importe" ? "top-toggle-btn--active" : ""}`}
                  onClick={() => setOrdenProductos("importe")}
                >
                  Importe
                </button>
              </div>
            </div>

            {loading ? (
              <p className="stats-muted">Cargando productos...</p>
            ) : productos.length === 0 ? (
              <p className="stats-muted">No hay ventas en este día.</p>
            ) : (
              <ul className="top-productos-list">
                {productos.map((p, index) => {
                  const val = ordenProductos === "cantidad" ? (p.cantidad || 0) : (p.totalFacturado || 0);
                  const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;

                  return (
                    <li key={p.productoId || `${p.nombre}-${index}`} className="top-producto-item">
                      <span className="top-producto-rank">#{index + 1}</span>
                      <div className="top-producto-content">
                        <div className="top-producto-info">
                          <span className="nombre">{p.nombre}</span>
                          <span className="cantidad">{p.cantidad} uds · {formatCurrency(p.totalFacturado)}</span>
                        </div>
                        <div className="top-producto-bar-wrap">
                          <div className="top-producto-bar" style={{ width: `${Math.max(pct, 2)}%` }} />
                        </div>
                      </div>
                      <span className="top-producto-badge">
                        {ordenProductos === "cantidad" ? `${p.cantidad}` : formatCurrency(p.totalFacturado)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}

function getFechaOffsetFrom(fechaISO, dias) {
  const d = new Date(fechaISO);
  d.setDate(d.getDate() - dias);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function calcularVariacion(actual, anterior) {
  if (!anterior || anterior === 0) {
    return { texto: actual > 0 ? "Primer día comparable" : "", clase: "neutral" };
  }
  const pct = ((actual - anterior) / anterior) * 100;
  if (pct > 0) return { texto: `+${pct.toFixed(1)}% vs ayer`, clase: "positivo" };
  if (pct < 0) return { texto: `${pct.toFixed(1)}% vs ayer`, clase: "negativo" };
  return { texto: "Sin cambios vs ayer", clase: "neutral" };
}
