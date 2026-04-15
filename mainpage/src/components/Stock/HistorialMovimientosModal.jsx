import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import api from "../../utils/api";
import ModalBase from "../MapaEditor/ModalBase";
import "../MapaEditor/ModalCrearMesa.css";
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

  const footer =
    totalPages > 1 ? (
      <div className="alefForm-actions" style={{ justifyContent: "space-between", width: "100%" }}>
        <button
          type="button"
          className="alefBtn ghost"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          ← Anterior
        </button>
        <span className="historial-page-info">
          Página {page} de {totalPages} · {total} movimientos
        </span>
        <button
          type="button"
          className="alefBtn ghost"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente →
        </button>
      </div>
    ) : (
      <div className="alefForm-actions">
        <button type="button" className="alefBtn ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
    );

  return (
    <ModalBase
      open={true}
      title={`Historial · ${ingrediente.nombre}`}
      subtitle={`${total} movimiento${total === 1 ? "" : "s"} · ${
        ingrediente.unidad
      }`}
      onClose={onClose}
      footer={footer}
      width={900}
    >
      <div className="alefForm">
        {/* Filtros tipo — chips */}
        <div className="historial-filtros">
          <button
            type="button"
            className={`historial-filtro-btn ${!tipoFiltro ? "active" : ""}`}
            onClick={() => {
              setTipoFiltro("");
              setPage(1);
            }}
          >
            Todos
          </button>
          {["entrada", "ajuste", "venta", "merma", "consumo_auto", "salida"].map(
            (t) => (
              <button
                key={t}
                type="button"
                className={`historial-filtro-btn historial-filtro-btn--${TIPO_COLORS[t]} ${
                  tipoFiltro === t ? "active" : ""
                }`}
                onClick={() => {
                  setTipoFiltro(t);
                  setPage(1);
                }}
              >
                {TIPO_LABELS[t] || t}
              </button>
            )
          )}
        </div>

        {loading ? (
          <div className="historial-loading">Cargando movimientos…</div>
        ) : error ? (
          <div className="alefError">
            {error}{" "}
            <button
              type="button"
              className="alefBtn ghost"
              style={{ marginLeft: 8 }}
              onClick={fetchMovimientos}
            >
              Reintentar
            </button>
          </div>
        ) : movimientos.length === 0 ? (
          <div className="historial-empty">
            No hay movimientos
            {tipoFiltro ? ` de tipo "${TIPO_LABELS[tipoFiltro]}"` : ""}.
          </div>
        ) : (
          <div className="historial-list">
            {movimientos.map((m) => {
              const delta =
                m.delta ??
                (m.stockDespues != null && m.stockAntes != null
                  ? m.stockDespues - m.stockAntes
                  : null);
              const deltaClass = delta > 0 ? "pos" : delta < 0 ? "neg" : "";

              return (
                <div key={m._id} className="historial-row">
                  <div className="historial-row-left">
                    <span
                      className={`historial-tipo-badge historial-tipo--${
                        TIPO_COLORS[m.tipo] || "blue"
                      }`}
                    >
                      {TIPO_LABELS[m.tipo] || m.tipo}
                    </span>
                    <span className="historial-row-fecha">
                      {formatFecha(m.fecha || m.timestamp)}
                    </span>
                  </div>

                  <div className="historial-row-stock">
                    <span className="historial-row-before">
                      {m.stockAntes ?? "—"}
                    </span>
                    <span className="historial-row-arrow">→</span>
                    <span className="historial-row-after">
                      {m.stockDespues ?? "—"}
                    </span>
                    <span className={`historial-row-delta ${deltaClass}`}>
                      {formatDelta(delta)}
                    </span>
                  </div>

                  <div className="historial-row-meta">
                    <span className="historial-row-actor">
                      {m.actor?.name || m.actor?.email || "Sistema"}
                    </span>
                    {m.referencia && (
                      <span className="historial-row-ref">{m.referencia}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModalBase>
  );
}
