import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import api from "../../utils/api";
import "./StockModalBase.css";
import "./HistorialMovimientosModal.css";

const LIMIT = 15;

const TIPO_LABELS = {
  entrada: "Entrada",
  venta: "Venta",
  ajuste: "Ajuste",
  merma: "Merma",
  caducado: "Caducado",
  consumo_auto: "Consumo auto",
  salida: "Salida",
};

const TIPO_COLORS = {
  entrada: "green",
  venta: "red",
  ajuste: "blue",
  merma: "orange",
  caducado: "orange",
  consumo_auto: "purple",
  salida: "red",
};

function formatFecha(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDelta(delta) {
  if (delta == null) return "—";
  const n = Number(delta);
  if (n > 0) return `+${n}`;
  return String(n);
}

export default function HistorialMovimientosModal({ ingrediente, onClose }) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tipoFiltro, setTipoFiltro] = useState("");
  const controllerRef = useRef(null);

  const fetchMovimientos = useCallback(async () => {
    if (!ingrediente?._id) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = {
        ingredienteId: ingrediente._id,
        page,
        limit: LIMIT,
      };
      if (tipoFiltro) params.tipo = tipoFiltro;

      const { data } = await api.get("/stock/movimientos", {
        params,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      setMovimientos(data.movimientos || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setError("No se pudo cargar el historial.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [ingrediente?._id, page, tipoFiltro]);

  useEffect(() => {
    fetchMovimientos();
    return () => controllerRef.current?.abort();
  }, [fetchMovimientos]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Tipos presentes para el filtro
  const tiposDisponibles = useMemo(() => {
    const set = new Set(movimientos.map((m) => m.tipo).filter(Boolean));
    return [...set].sort();
  }, [movimientos]);

  return (
    <div className="alef-modal-overlay stock-ajuste-overlay" onClick={onClose}>
      <div
        className="alef-modal-content stk-modal stk-modal--wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <header className="stk-header">
          <div>
            <div className="stk-header-top">
              <h3 className="stk-title">Historial de movimientos</h3>
              <button className="stk-close" onClick={onClose} aria-label="Cerrar">✕</button>
            </div>
            <div className="historial-meta">
              <span className="stk-item-name">{ingrediente.nombre}</span>
              <span className="stk-chip">{ingrediente.unidad}</span>
              <span className="stk-chip">{total} movimientos</span>
            </div>
          </div>
        </header>

        {/* Filtro por tipo */}
        <div className="historial-filtros">
          <button
            className={`historial-filtro-btn ${!tipoFiltro ? "active" : ""}`}
            onClick={() => { setTipoFiltro(""); setPage(1); }}
          >
            Todos
          </button>
          {["entrada", "ajuste", "venta", "merma", "consumo_auto", "salida"].map((t) => (
            <button
              key={t}
              className={`historial-filtro-btn historial-filtro-btn--${TIPO_COLORS[t]} ${tipoFiltro === t ? "active" : ""}`}
              onClick={() => { setTipoFiltro(t); setPage(1); }}
            >
              {TIPO_LABELS[t] || t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="stk-body stk-body-flush">
          {loading ? (
            <div className="historial-loading">Cargando movimientos...</div>
          ) : error ? (
            <div className="historial-error">
              <span>{error}</span>
              <button onClick={fetchMovimientos}>Reintentar</button>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="historial-empty">
              No hay movimientos{tipoFiltro ? ` de tipo "${TIPO_LABELS[tipoFiltro]}"` : ""} para este ingrediente.
            </div>
          ) : (
            <div className="historial-list">
              {movimientos.map((m) => {
                const delta = m.delta ?? (m.stockDespues != null && m.stockAntes != null
                  ? m.stockDespues - m.stockAntes
                  : null);
                const deltaClass = delta > 0 ? "pos" : delta < 0 ? "neg" : "";

                return (
                  <div key={m._id} className="historial-row">
                    <div className="historial-row-left">
                      <span className={`historial-tipo-badge historial-tipo--${TIPO_COLORS[m.tipo] || "blue"}`}>
                        {TIPO_LABELS[m.tipo] || m.tipo}
                      </span>
                      <span className="historial-row-fecha">
                        {formatFecha(m.fecha || m.timestamp)}
                      </span>
                    </div>

                    <div className="historial-row-stock">
                      <span className="historial-row-before">{m.stockAntes ?? "—"}</span>
                      <span className="historial-row-arrow">→</span>
                      <span className="historial-row-after">{m.stockDespues ?? "—"}</span>
                      <span className={`historial-row-delta ${deltaClass}`}>
                        {formatDelta(delta)}
                      </span>
                    </div>

                    <div className="historial-row-meta">
                      <span className="historial-row-actor">{m.actor?.name || m.actor?.email || "Sistema"}</span>
                      {m.referencia && <span className="historial-row-ref">{m.referencia}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <footer className="historial-pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
