import React, { useEffect, useState, useMemo } from "react";
import api from "../../utils/api";
import * as logger from "../../utils/logger";
import "./UsuariosStatsModal.css";

const dayNames = {
  1: "Domingo", 2: "Lunes", 3: "Martes", 4: "Miércoles",
  5: "Jueves", 6: "Viernes", 7: "Sábado",
};

const RANGO_PRESETS = [
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "90", label: "90 días" },
  { value: "all", label: "Todo" },
  { value: "custom", label: "Personalizado" },
];

const formatCurrency = (v) => `${Number(v || 0).toFixed(2)} €`;
const formatDateTime = (v) => (!v ? "-" : new Date(v).toLocaleString("es-ES", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
}));

const UsuarioStatsModal = ({ usuario, onClose }) => {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [rango, setRango] = useState("30");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [ordenProductos, setOrdenProductos] = useState("cantidad");

  const rangoDescripcion = useMemo(() => {
    if (rango === "all") return "Mostrando todo el historial";
    if (rango === "custom") {
      if (!desde || !hasta) return "Selecciona un rango de fechas";
      return `Del ${desde} al ${hasta}`;
    }
    return `Últimos ${rango} días`;
  }, [rango, desde, hasta]);

  useEffect(() => {
    if (!usuario?._id) return;
    if (rango === "custom" && (!desde || !hasta)) return;

    let cancelado = false;
    const fetchStats = async () => {
      try {
        setCargando(true);
        setError("");
        setStats(null);

        const params = {};
        if (rango !== "all" && rango !== "custom") params.dias = Number(rango);
        else if (rango === "custom") { params.desde = desde; params.hasta = hasta; }

        const resp = await api.get(`/admin/usuarios/${usuario._id}/estadisticas`, { params });
        if (!cancelado) setStats(resp.data);
      } catch (err) {
        logger.error("Error stats usuario:", err);
        if (!cancelado) setError(err?.response?.data?.message || "No se pudieron cargar las estadísticas.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    fetchStats();
    return () => { cancelado = true; };
  }, [usuario?._id, rango, desde, hasta]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const resumen = useMemo(() => {
    if (!stats) return { totalPedidos: 0, totalImporte: 0, primerPedido: null, ultimoPedido: null };
    return stats.resumenGlobal || stats.resumen || { totalPedidos: 0, totalImporte: 0 };
  }, [stats]);

  const productosRaw = stats?.productos || [];

  const productos = useMemo(() => {
    const sorted = [...productosRaw].sort((a, b) =>
      ordenProductos === "cantidad"
        ? (b.cantidad || 0) - (a.cantidad || 0)
        : (b.totalFacturado || 0) - (a.totalFacturado || 0)
    );
    return sorted.slice(0, 15);
  }, [productosRaw, ordenProductos]);

  const maxVal = useMemo(() => {
    if (!productos.length) return 1;
    return ordenProductos === "cantidad"
      ? Math.max(...productos.map((p) => p.cantidad || 0), 1)
      : Math.max(...productos.map((p) => p.totalFacturado || 0), 1);
  }, [productos, ordenProductos]);

  const ticketMedio = resumen.totalPedidos > 0 ? resumen.totalImporte / resumen.totalPedidos : 0;
  const totalUnidades = productosRaw.reduce((s, p) => s + (p.cantidad || 0), 0);

  const topHoras = useMemo(() => {
    if (!stats?.actividadPorHora) return [];
    return [...stats.actividadPorHora].sort((a, b) => b.pedidos - a.pedidos).slice(0, 5);
  }, [stats]);

  const maxHoraPedidos = useMemo(() => Math.max(...topHoras.map((h) => h.pedidos || 0), 1), [topHoras]);

  const topDias = useMemo(() => {
    if (!stats?.actividadPorDia) return [];
    return [...stats.actividadPorDia].sort((a, b) => b.pedidos - a.pedidos).slice(0, 5);
  }, [stats]);

  const maxDiaPedidos = useMemo(() => Math.max(...topDias.map((d) => d.pedidos || 0), 1), [topDias]);

  if (!usuario) return null;

  return (
    <div className="statsUserModal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="statsUserModal-container" onClick={(e) => e.stopPropagation()}>
        <header className="statsUserModal-header">
          <div>
            <h2 className="statsUserModal-title">Estadísticas</h2>
            <p className="statsUserModal-subtitle">
              {usuario.name} · <span className="statsUserModal-role">{usuario.role}</span>
            </p>
          </div>
          <button className="statsUserModal-close" onClick={onClose} aria-label="Cerrar">&times;</button>
        </header>

        <div className="statsUserModal-body">
          {/* FILTROS */}
          <section className="statsUserModal-filters">
            <div className="statsUserModal-filter-presets">
              {RANGO_PRESETS.map((opt) => (
                <button
                  key={opt.value}
                  className={`statsUserModal-chip ${rango === opt.value ? "active" : ""}`}
                  onClick={() => setRango(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="statsUserModal-filter-extra">
              {rango === "custom" && (
                <div className="statsUserModal-dates">
                  <label><span>Desde</span><input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
                  <label><span>Hasta</span><input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
                </div>
              )}
              <p className="statsUserModal-caption">{rangoDescripcion}</p>
            </div>
          </section>

          {cargando && (
            <div className="statsUserModal-loading">
              <div className="statsUserModal-spinner" />
              <p>Cargando estadísticas...</p>
            </div>
          )}

          {error && !cargando && <p className="statsUserModal-error">{error}</p>}

          {!cargando && !error && stats && (
            <>
              {/* KPIs */}
              <section className="statsUserModal-section">
                <div className="statsUserModal-grid">
                  <div className="statsUserModal-card statsUserModal-card--accent">
                    <span className="label">Importe generado</span>
                    <span className="value">{formatCurrency(resumen.totalImporte)}</span>
                  </div>
                  <div className="statsUserModal-card">
                    <span className="label">Pedidos tomados</span>
                    <span className="value">{resumen.totalPedidos}</span>
                  </div>
                  <div className="statsUserModal-card">
                    <span className="label">Ticket medio</span>
                    <span className="value">{formatCurrency(ticketMedio)}</span>
                  </div>
                  <div className="statsUserModal-card">
                    <span className="label">Productos vendidos</span>
                    <span className="value">{totalUnidades}</span>
                    <span className="sub">unidades</span>
                  </div>
                </div>

                {(resumen.primerPedido || resumen.ultimoPedido) && (
                  <div className="statsUserModal-timeline">
                    {resumen.primerPedido && <span>Primer pedido: <strong>{formatDateTime(resumen.primerPedido)}</strong></span>}
                    {resumen.ultimoPedido && <span>Último pedido: <strong>{formatDateTime(resumen.ultimoPedido)}</strong></span>}
                  </div>
                )}
              </section>

              {/* PRODUCTOS */}
              <section className="statsUserModal-section">
                <div className="statsUserModal-section-header">
                  <h3 className="statsUserModal-section-title">Productos más vendidos</h3>
                  <div className="statsUserModal-toggle">
                    <button type="button" className={`statsUserModal-toggle-btn ${ordenProductos === "cantidad" ? "active" : ""}`} onClick={() => setOrdenProductos("cantidad")}>Cantidad</button>
                    <button type="button" className={`statsUserModal-toggle-btn ${ordenProductos === "importe" ? "active" : ""}`} onClick={() => setOrdenProductos("importe")}>Importe</button>
                  </div>
                </div>

                {productos.length === 0 ? (
                  <p className="statsUserModal-empty">Sin ventas en este rango.</p>
                ) : (
                  <ul className="statsUserModal-product-list">
                    {productos.map((p, i) => {
                      const val = ordenProductos === "cantidad" ? (p.cantidad || 0) : (p.totalFacturado || 0);
                      const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                      return (
                        <li key={p.productoId || `${p.nombre}-${i}`} className="statsUserModal-product-item">
                          <span className={`statsUserModal-rank ${i < 3 ? `rank-${i + 1}` : ""}`}>#{i + 1}</span>
                          <div className="statsUserModal-product-content">
                            <div className="statsUserModal-product-info">
                              <span className="name">{p.nombre}</span>
                              <span className="meta">{p.cantidad} uds · {formatCurrency(p.totalFacturado)}</span>
                            </div>
                            <div className="statsUserModal-bar-wrap">
                              <div className="statsUserModal-bar" style={{ width: `${Math.max(pct, 3)}%` }} />
                            </div>
                          </div>
                          <span className="statsUserModal-badge">
                            {ordenProductos === "cantidad" ? p.cantidad : formatCurrency(p.totalFacturado)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* ACTIVIDAD */}
              <section className="statsUserModal-section">
                <h3 className="statsUserModal-section-title">Patrones de actividad</h3>
                <div className="statsUserModal-activity">
                  <div className="statsUserModal-activity-col">
                    <h4 className="statsUserModal-activity-label">Horas punta</h4>
                    {topHoras.length === 0 ? (
                      <p className="statsUserModal-empty">Sin datos.</p>
                    ) : (
                      <ul className="statsUserModal-activity-list">
                        {topHoras.map((h) => (
                          <li key={h._id} className="statsUserModal-activity-item">
                            <span className="statsUserModal-activity-key">{h._id}:00h</span>
                            <div className="statsUserModal-activity-bar-wrap">
                              <div className="statsUserModal-activity-bar" style={{ width: `${(h.pedidos / maxHoraPedidos) * 100}%` }} />
                            </div>
                            <span className="statsUserModal-activity-val">{h.pedidos}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="statsUserModal-activity-col">
                    <h4 className="statsUserModal-activity-label">Días más fuertes</h4>
                    {topDias.length === 0 ? (
                      <p className="statsUserModal-empty">Sin datos.</p>
                    ) : (
                      <ul className="statsUserModal-activity-list">
                        {topDias.map((d) => (
                          <li key={d._id} className="statsUserModal-activity-item">
                            <span className="statsUserModal-activity-key">{dayNames[d._id] || `Día ${d._id}`}</span>
                            <div className="statsUserModal-activity-bar-wrap">
                              <div className="statsUserModal-activity-bar" style={{ width: `${(d.pedidos / maxDiaPedidos) * 100}%` }} />
                            </div>
                            <span className="statsUserModal-activity-val">{d.pedidos}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        <footer className="statsUserModal-footer">
          <button className="statsUserModal-close-btn" onClick={onClose}>Cerrar</button>
        </footer>
      </div>
    </div>
  );
};

export default UsuarioStatsModal;
