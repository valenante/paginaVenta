import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import "./AjustarStockModal.css";

// helpers
const toNum = (v, fallback = 0) => {
  if (v === "" || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const clampMin = (n, min = 0) => Math.max(min, n);

const AjustarStockModal = ({ ingrediente, onClose, onSave }) => {
  const stockInicial = useMemo(
    () => toNum(ingrediente?.stockActual, 0),
    [ingrediente]
  );

  const [cantidad, setCantidad] = useState(String(stockInicial));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const unidad = ingrediente?.unidad || "";

  const cantidadNum = useMemo(() => clampMin(toNum(cantidad, stockInicial), 0), [cantidad, stockInicial]);
  const diferencia = useMemo(() => cantidadNum - stockInicial, [cantidadNum, stockInicial]);

  const hasChanges = useMemo(() => cantidadNum !== stockInicial, [cantidadNum, stockInicial]);

  const ajustar = (delta) => {
    setCantidad((prev) => {
      const next = clampMin(toNum(prev, stockInicial) + delta, 0);
      return String(next);
    });
  };

  const enviarAjuste = async () => {
    setError("");

    // guard rail extra
    const nuevoStock = clampMin(toNum(cantidad, stockInicial), 0);

    try {
      setLoading(true);

      await api.post("/stock/ajustar", {
        ingredienteId: ingrediente._id,
        nuevoStock,
      });

      onSave?.();
      onClose?.();
    } catch (err) {
      setError("⚠ No se pudo guardar el ajuste. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Atajos teclado (Escape / Enter)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter") {
        // solo guardar si hay cambios y no está cargando
        if (!loading && hasChanges) enviarAjuste();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasChanges, cantidad]);

  return (
    <div className="alef-modal-overlay stock-ajuste-overlay" onClick={onClose}>
      <div
        className="alef-modal-content stock-ajuste-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <header className="stock-ajuste-header">
          <div className="stock-ajuste-titleRow">
            <h3 className="stock-ajuste-title">📦 Ajustar stock</h3>
            <span className="stock-ajuste-chip">{unidad || "ud"}</span>
          </div>

          <p className="stock-ajuste-subtitle">
            Ajusta el stock real del ítem. Este cambio quedará registrado en{" "}
            <strong>Movimientos de stock</strong> como ajuste manual.
          </p>

          <div className="stock-ajuste-item">
            <span className="stock-ajuste-itemName">{ingrediente.nombre}</span>
            <span className="stock-ajuste-itemMeta">
              Stock actual: <strong>{stockInicial}</strong> {unidad}
            </span>
          </div>
        </header>

        {/* ===== BODY ===== */}
        <section className="stock-ajuste-body">
          <div className="stock-ajuste-controls">
            <div className="stock-ajuste-stepRow">
              <button
                type="button"
                className="ajuste-pill"
                onClick={() => ajustar(-10)}
                disabled={loading}
                title="Restar 10"
              >
                −10
              </button>
              <button
                type="button"
                className="ajuste-pill"
                onClick={() => ajustar(-5)}
                disabled={loading}
                title="Restar 5"
              >
                −5
              </button>
              <button
                type="button"
                className="ajuste-btn"
                onClick={() => ajustar(-1)}
                disabled={loading}
                aria-label="Disminuir"
                title="Restar 1"
              >
                −
              </button>

              <div className="ajuste-inputWrap">
                <input
                  type="number"
                  className="ajuste-input"
                  value={cantidad}
                  min="0"
                  step="1"
                  onChange={(e) => {
                    setError("");
                    setCantidad(e.target.value);
                  }}
                  onBlur={() => {
                    // normalizar al salir
                    setCantidad(String(clampMin(toNum(cantidad, stockInicial), 0)));
                  }}
                  disabled={loading}
                  autoFocus
                />
                <span className="ajuste-unit">{unidad}</span>
              </div>

              <button
                type="button"
                className="ajuste-btn"
                onClick={() => ajustar(1)}
                disabled={loading}
                aria-label="Aumentar"
                title="Sumar 1"
              >
                +
              </button>
              <button
                type="button"
                className="ajuste-pill"
                onClick={() => ajustar(5)}
                disabled={loading}
                title="Sumar 5"
              >
                +5
              </button>
              <button
                type="button"
                className="ajuste-pill"
                onClick={() => ajustar(10)}
                disabled={loading}
                title="Sumar 10"
              >
                +10
              </button>
            </div>

            {/* Resumen */}
            <div className="stock-ajuste-summary">
              <div className="summary-card">
                <span className="summary-label">Antes</span>
                <strong className="summary-value">
                  {stockInicial} {unidad}
                </strong>
              </div>

              <div className="summary-card">
                <span className="summary-label">Después</span>
                <strong className="summary-value">
                  {cantidadNum} {unidad}
                </strong>
              </div>

              <div className={`summary-card summary-diff ${diferencia === 0 ? "" : diferencia > 0 ? "pos" : "neg"}`}>
                <span className="summary-label">Variación</span>
                <strong className="summary-value">
                  {diferencia > 0 ? `+${diferencia}` : `${diferencia}`} {unidad}
                </strong>
              </div>
            </div>

            <p className="stock-ajuste-hint">
              Tip: usa <strong>Enter</strong> para guardar y <strong>Esc</strong> para cerrar.
            </p>

            {error && <div className="stock-ajuste-error">{error}</div>}
          </div>
        </section>

        {/* ===== ACTIONS ===== */}
        <footer className="stock-ajuste-actions">
          <button
            type="button"
            className="btn-cancelar"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            className="btn-confirmar"
            onClick={enviarAjuste}
            disabled={loading || !hasChanges}
            title={!hasChanges ? "No hay cambios para guardar" : ""}
          >
            {loading ? "Guardando…" : "Guardar ajuste"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AjustarStockModal;
