import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import { toNum, clampMin } from "./stockHelpers";
import "./StockModalBase.css";
import "./AjustarStockModal.css";

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
      setError(err?.response?.data?.message || "No se pudo guardar el ajuste. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter" && !loading && hasChanges) enviarAjuste();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasChanges, cantidad]);

  return (
    <div className="alef-modal-overlay stock-ajuste-overlay" onClick={onClose}>
      <div
        className="alef-modal-content stk-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="stk-header">
          <div className="stk-header-top">
            <h3 className="stk-title">Ajustar stock</h3>
            <span className="stk-chip">{unidad || "ud"}</span>
          </div>

          <p className="stk-subtitle">
            Ajusta el stock real del ítem. Este cambio quedará registrado en{" "}
            <strong>Movimientos de stock</strong> como ajuste manual.
          </p>

          <div className="stk-item-card">
            <span className="stk-item-name">{ingrediente.nombre}</span>
            <span className="stk-item-meta">
              Stock actual: <strong>{stockInicial}</strong> {unidad}
            </span>
          </div>
        </header>

        {/* Body */}
        <section className="stk-body">
          <div className="stk-controls">
            <div className="ajuste-stepRow">
              <button type="button" className="stk-pill" onClick={() => ajustar(-10)} disabled={loading} title="Restar 10">−10</button>
              <button type="button" className="stk-pill" onClick={() => ajustar(-5)} disabled={loading} title="Restar 5">−5</button>
              <button type="button" className="stk-pill stk-pill--lg" onClick={() => ajustar(-1)} disabled={loading} title="Restar 1">−</button>

              <div className="ajuste-inputWrap">
                <input
                  type="number"
                  className="ajuste-input"
                  value={cantidad}
                  min="0"
                  step="1"
                  onChange={(e) => { setError(""); setCantidad(e.target.value); }}
                  onBlur={() => setCantidad(String(clampMin(toNum(cantidad, stockInicial), 0)))}
                  disabled={loading}
                  autoFocus
                />
                <span className="ajuste-unit">{unidad}</span>
              </div>

              <button type="button" className="stk-pill stk-pill--lg" onClick={() => ajustar(1)} disabled={loading} title="Sumar 1">+</button>
              <button type="button" className="stk-pill" onClick={() => ajustar(5)} disabled={loading} title="Sumar 5">+5</button>
              <button type="button" className="stk-pill" onClick={() => ajustar(10)} disabled={loading} title="Sumar 10">+10</button>
            </div>

            {/* Summary */}
            <div className="ajuste-summary">
              <div className="stk-card ajuste-summary-card">
                <span className="stk-item-meta">Antes</span>
                <strong className="ajuste-summary-value">{stockInicial} {unidad}</strong>
              </div>
              <div className="stk-card ajuste-summary-card">
                <span className="stk-item-meta">Después</span>
                <strong className="ajuste-summary-value">{cantidadNum} {unidad}</strong>
              </div>
              <div className={`stk-card ajuste-summary-card ${diferencia === 0 ? "" : diferencia > 0 ? "ajuste-diff-pos" : "ajuste-diff-neg"}`}>
                <span className="stk-item-meta">Variación</span>
                <strong className="ajuste-summary-value">
                  {diferencia > 0 ? `+${diferencia}` : `${diferencia}`} {unidad}
                </strong>
              </div>
            </div>

            <p className="stk-hint">
              Tip: usa <strong>Enter</strong> para guardar y <strong>Esc</strong> para cerrar.
            </p>

            {error && <div className="stk-error">{error}</div>}
          </div>
        </section>

        {/* Footer */}
        <footer className="stk-footer">
          <button type="button" className="stk-btn stk-btn--ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className="stk-btn stk-btn--primary"
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
