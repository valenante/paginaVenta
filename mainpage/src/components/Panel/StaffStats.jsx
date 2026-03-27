import { useEffect, useRef, useState } from "react";
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

  const controllerRef = useRef(null);

  // Actualizar "hoy" si el componente sigue montado tras medianoche
  useEffect(() => {
    const check = setInterval(() => {
      const now = new Date().toISOString().slice(0, 10);
      if (now !== hoyRef.current) {
        hoyRef.current = now;
        // Si el usuario tenía seleccionado el día anterior como "hoy", actualizar
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

    const actualReq = api.get(`/admin/usuarios/${user.id}/estadisticas`, {
      params: { desde: fecha, hasta: fecha },
      signal: controller.signal,
    });

    const anteriorReq = api.get(`/admin/usuarios/${user.id}/estadisticas`, {
      params: { desde: fechaAnterior, hasta: fechaAnterior },
      signal: controller.signal,
    });

    Promise.all([actualReq, anteriorReq])
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

  const resumenActual = actual?.resumenGlobal || {
    totalPedidos: 0,
    totalImporte: 0,
  };

  const resumenAnterior = anterior?.resumenGlobal || {
    totalPedidos: 0,
    totalImporte: 0,
  };

  const variacionImporte = calcularVariacion(
    resumenActual.totalImporte,
    resumenAnterior.totalImporte
  );

  const productos = actual?.productos || [];

  const formatCurrency = (v) => `${Number(v || 0).toFixed(2)} €`;

  return (
    <section className="staff-stats">
      <h3 className="stats-title">Tu rendimiento</h3>

      <div className="stats-fecha">
        <label htmlFor="fecha-staff" className="stats-fecha-label">
          Día
        </label>
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
          <button className="stats-error-btn" onClick={fetchStats}>
            Reintentar
          </button>
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
              <span className="stat-sub">
                {loading ? "" : "Actividad registrada"}
              </span>
            </div>
          </div>

          <section className="staff-top-productos">
            <h4 className="stats-subtitle">Productos más vendidos</h4>

            {loading ? (
              <p className="stats-muted">Cargando productos...</p>
            ) : productos.length === 0 ? (
              <p className="stats-muted">No hay ventas en este día.</p>
            ) : (
              <ul className="top-productos-list">
                {productos.slice(0, 5).map((p, index) => (
                  <li
                    key={p.productoId || `${p.nombre}-${index}`}
                    className="top-producto-item"
                  >
                    <div className="info">
                      <span className="nombre">{p.nombre}</span>
                      <span className="cantidad">{p.cantidad} uds</span>
                    </div>
                    <span className="importe">
                      {formatCurrency(p.totalFacturado)}
                    </span>
                  </li>
                ))}
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
    return {
      texto: "Primer día comparable",
      clase: "neutral",
    };
  }

  const diff = actual - anterior;
  const pct = (diff / anterior) * 100;

  if (pct > 0) {
    return {
      texto: `+${pct.toFixed(1)}% respecto al día anterior`,
      clase: "positivo",
    };
  }

  if (pct < 0) {
    return {
      texto: `${pct.toFixed(1)}% respecto al día anterior`,
      clase: "negativo",
    };
  }

  return {
    texto: "Sin cambios respecto al día anterior",
    clase: "neutral",
  };
}
