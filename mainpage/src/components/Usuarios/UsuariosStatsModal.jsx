import React, { useEffect, useState, useMemo } from "react";
import api from "../../utils/api";
import * as logger from "../../utils/logger";
import "./UsuariosStatsModal.css";

const dayNames = {
  1: "Domingo",
  2: "Lunes",
  3: "Martes",
  4: "Miércoles",
  5: "Jueves",
  6: "Viernes",
  7: "Sábado",
};

const RANGO_PRESETS = [
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "90", label: "90 días" },
  { value: "all", label: "Todo" },
  { value: "custom", label: "Personalizado" },
];

const UsuarioStatsModal = ({ usuario, onClose }) => {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [rango, setRango] = useState("30");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const formatCurrency = (value) => `${Number(value || 0).toFixed(2)} €`;
  const formatDateTime = (value) => (!value ? "-" : new Date(value).toLocaleString());

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

        if (rango !== "all" && rango !== "custom") {
          params.dias = Number(rango);
        } else if (rango === "custom") {
          params.desde = desde;
          params.hasta = hasta;
        }

        const { data } = await api.get(
          `/admin/usuarios/${usuario._id}/estadisticas`,
          { params }
        );

        if (!cancelado) setStats(data);
      } catch (err) {
        logger.error("Error stats usuario:", err);
        if (!cancelado) {
          setError(
            err?.response?.data?.error ||
            "No se pudieron cargar las estadísticas."
          );
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    fetchStats();
    return () => (cancelado = true);
  }, [usuario?._id, rango, desde, hasta]);

  const resumen = useMemo(() => {
    if (!stats) return null;
    return stats.resumenGlobal || stats.resumen || {
      totalPedidos: 0,
      totalImporte: 0,
      primerPedido: null,
      ultimoPedido: null,
    };
  }, [stats]);

  const productos = stats?.productos || [];

  const topHoras = useMemo(() => {
    if (!stats?.actividadPorHora) return [];
    return [...stats.actividadPorHora]
      .sort((a, b) => b.pedidos - a.pedidos)
      .slice(0, 3);
  }, [stats]);

  const topDias = useMemo(() => {
    if (!stats?.actividadPorDia) return [];
    return [...stats.actividadPorDia]
      .sort((a, b) => b.pedidos - a.pedidos)
      .slice(0, 3);
  }, [stats]);

  if (!usuario) return null;

  return (
    <div
      className="statsUserModal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="statsUserModal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <header className="statsUserModal-header">
          <div>
            <h2 className="statsUserModal-title">Estadísticas del usuario</h2>
            <p className="statsUserModal-subtitle">
              {usuario.name} ·{" "}
              <span className="statsUserModal-role">{usuario.role}</span>
            </p>
          </div>

          <button
            className="statsUserModal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        {/* BODY */}
        <div className="statsUserModal-body">
          {/* FILTROS */}
          <section className="statsUserModal-filters">
            <div className="statsUserModal-filter-presets">
              {RANGO_PRESETS.map((opt) => (
                <button
                  key={opt.value}
                  className={`statsUserModal-chip ${
                    rango === opt.value ? "active" : ""
                  }`}
                  onClick={() => setRango(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="statsUserModal-filter-extra">
              {rango === "custom" && (
                <div className="statsUserModal-dates">
                  <label>
                    <span>Desde</span>
                    <input
                      type="date"
                      value={desde}
                      onChange={(e) => setDesde(e.target.value)}
                    />
                  </label>

                  <label>
                    <span>Hasta</span>
                    <input
                      type="date"
                      value={hasta}
                      onChange={(e) => setHasta(e.target.value)}
                    />
                  </label>
                </div>
              )}

              <p className="statsUserModal-caption">{rangoDescripcion}</p>
            </div>
          </section>

          {/* CARGANDO */}
          {cargando && (
            <div className="statsUserModal-loading">
              <div className="statsUserModal-spinner" />
              <p>Cargando estadísticas...</p>
            </div>
          )}

          {/* ERROR */}
          {error && !cargando && (
            <p className="statsUserModal-error">{error}</p>
          )}

          {/* CONTENIDO */}
          {!cargando && !error && stats && (
            <>
              {/* RESUMEN */}
              <section className="statsUserModal-section">
                <h3 className="statsUserModal-section-title">Resumen</h3>

                <div className="statsUserModal-grid">
                  <div className="statsUserModal-card">
                    <span className="label">Pedidos tomados</span>
                    <span className="value">{resumen.totalPedidos}</span>
                  </div>

                  <div className="statsUserModal-card">
                    <span className="label">Importe generado</span>
                    <span className="value accent">
                      {formatCurrency(resumen.totalImporte)}
                    </span>
                  </div>

                  <div className="statsUserModal-card">
                    <span className="label">Primer pedido</span>
                    <span className="value small">
                      {formatDateTime(resumen.primerPedido)}
                    </span>
                  </div>

                  <div className="statsUserModal-card">
                    <span className="label">Último pedido</span>
                    <span className="value small">
                      {formatDateTime(resumen.ultimoPedido)}
                    </span>
                  </div>
                </div>
              </section>

              {/* TOP PRODUCTOS */}
              <section className="statsUserModal-section">
                <h3 className="statsUserModal-section-title">
                  Productos más vendidos
                </h3>

                {productos.length === 0 ? (
                  <p className="statsUserModal-empty">
                    El usuario no tiene ventas en este rango.
                  </p>
                ) : (
                  <ul className="statsUserModal-product-list">
                    {productos.map((p) => (
                      <li key={p.productoId} className="statsUserModal-product-item">
                        <div className="main">
                          <span className="name">{p.nombre}</span>
                          <span className="qty">{p.cantidad} uds</span>
                        </div>
                        <span className="total">
                          {formatCurrency(p.totalFacturado)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ACTIVIDAD */}
              <section className="statsUserModal-section">
                <h3 className="statsUserModal-section-title">
                  Patrones de actividad
                </h3>

                <div className="statsUserModal-activity">
                  {/* horas */}
                  <div className="col">
                    <h4 className="statsUserModal-activity-title">Horas punta</h4>
                    {topHoras.length === 0 ? (
                      <p className="statsUserModal-empty">
                        Sin datos.
                      </p>
                    ) : (
                      <ul className="statsUserModal-tags">
                        {topHoras.map((h) => (
                          <li key={h._id} className="tag">
                            <span>{h._id}:00h</span>
                            <span className="badge">{h.pedidos} pedidos</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* dias */}
                  <div className="col">
                    <h4 className="statsUserModal-activity-title">Días más fuertes</h4>

                    {topDias.length === 0 ? (
                      <p className="statsUserModal-empty">
                        Sin datos.
                      </p>
                    ) : (
                      <ul className="statsUserModal-tags">
                        {topDias.map((d) => (
                          <li key={d._id} className="tag">
                            <span>{dayNames[d._id]}</span>
                            <span className="badge">{d.pedidos} pedidos</span>
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

        {/* FOOTER */}
        <footer className="statsUserModal-footer">
          <button className="statsUserModal-close-btn" onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default UsuarioStatsModal;
