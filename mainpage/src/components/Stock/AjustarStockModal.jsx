import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import { toNum, clampMin } from "./stockHelpers";
import ModalBase from "../MapaEditor/ModalBase";
import "../MapaEditor/ModalCrearMesa.css";
import "./AjustarStockModal.css"; // overrides específicos (stepper, summary)

const AjustarStockModal = ({ ingrediente, onClose, onSave }) => {
  const stockInicial = useMemo(
    () => toNum(ingrediente?.stockActual, 0),
    [ingrediente]
  );

  const [cantidad, setCantidad] = useState(String(stockInicial));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const unidad = ingrediente?.unidad || "";

  const cantidadNum = useMemo(
    () => clampMin(toNum(cantidad, stockInicial), 0),
    [cantidad, stockInicial]
  );
  const diferencia = useMemo(
    () => cantidadNum - stockInicial,
    [cantidadNum, stockInicial]
  );
  const hasChanges = useMemo(
    () => cantidadNum !== stockInicial,
    [cantidadNum, stockInicial]
  );

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
      setError(
        err?.response?.data?.message ||
          "No se pudo guardar el ajuste. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && !loading && hasChanges) {
        e.preventDefault();
        enviarAjuste();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasChanges, cantidad]);

  const footer = (
    <div className="alefForm-actions">
      <button
        type="button"
        className="alefBtn ghost"
        onClick={onClose}
        disabled={loading}
      >
        Cancelar
      </button>
      <button
        type="button"
        className="alefBtn primary"
        onClick={enviarAjuste}
        disabled={loading || !hasChanges}
      >
        {loading ? "Guardando…" : "Guardar ajuste"}
      </button>
    </div>
  );

  return (
    <ModalBase
      open={true}
      title={`Ajustar stock · ${ingrediente.nombre}`}
      subtitle="Este cambio quedará registrado como ajuste manual en Movimientos de stock."
      onClose={onClose}
      footer={footer}
      width={600}
    >
      <div className="alefForm">
        <div className="alefHint">
          📦 Stock actual: <b>{stockInicial}</b> {unidad}
        </div>

        <div className="ajuste-stepRow">
          <button
            type="button"
            className="alefBtn ghost ajuste-pill"
            onClick={() => ajustar(-10)}
            disabled={loading}
          >
            −10
          </button>
          <button
            type="button"
            className="alefBtn ghost ajuste-pill"
            onClick={() => ajustar(-5)}
            disabled={loading}
          >
            −5
          </button>
          <button
            type="button"
            className="alefBtn ghost ajuste-pill ajuste-pill--lg"
            onClick={() => ajustar(-1)}
            disabled={loading}
          >
            −
          </button>

          <div className="ajuste-inputWrap">
            <input
              type="number"
              className="alefField-input ajuste-input"
              value={cantidad}
              min="0"
              step="1"
              onChange={(e) => {
                setError("");
                setCantidad(e.target.value);
              }}
              onBlur={() =>
                setCantidad(String(clampMin(toNum(cantidad, stockInicial), 0)))
              }
              disabled={loading}
              autoFocus
            />
            <span className="ajuste-unit">{unidad}</span>
          </div>

          <button
            type="button"
            className="alefBtn ghost ajuste-pill ajuste-pill--lg"
            onClick={() => ajustar(1)}
            disabled={loading}
          >
            +
          </button>
          <button
            type="button"
            className="alefBtn ghost ajuste-pill"
            onClick={() => ajustar(5)}
            disabled={loading}
          >
            +5
          </button>
          <button
            type="button"
            className="alefBtn ghost ajuste-pill"
            onClick={() => ajustar(10)}
            disabled={loading}
          >
            +10
          </button>
        </div>

        <div className="ajuste-summary">
          <div className="ajuste-summary-card">
            <span className="ajuste-summary-label">Antes</span>
            <strong className="ajuste-summary-value">
              {stockInicial} {unidad}
            </strong>
          </div>
          <div className="ajuste-summary-card">
            <span className="ajuste-summary-label">Después</span>
            <strong className="ajuste-summary-value">
              {cantidadNum} {unidad}
            </strong>
          </div>
          <div
            className={`ajuste-summary-card ${
              diferencia === 0
                ? ""
                : diferencia > 0
                ? "ajuste-diff-pos"
                : "ajuste-diff-neg"
            }`}
          >
            <span className="ajuste-summary-label">Variación</span>
            <strong className="ajuste-summary-value">
              {diferencia > 0 ? `+${diferencia}` : `${diferencia}`} {unidad}
            </strong>
          </div>
        </div>

        <div className="alefHint">
          Tip: usa <b>Enter</b> para guardar y <b>Esc</b> para cerrar.
        </div>

        {error && <div className="alefError">{error}</div>}
      </div>
    </ModalBase>
  );
};

export default AjustarStockModal;
