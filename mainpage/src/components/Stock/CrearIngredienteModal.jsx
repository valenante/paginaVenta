// src/components/Stock/CrearIngredienteModal.jsx
import React, { useMemo, useState } from "react";
import api from "../../utils/api";
import AlefSelect from "../AlefSelect/AlefSelect";
import "./StockModalBase.css";
import "./CrearIngredienteModal.css";

const unidades = ["g", "kg", "ml", "l", "uds", "caja", "pack", "botella"];

const tipos = [
  { label: "Ingrediente (para recetas)", value: "ingrediente" },
  { label: "Consumible (se consume solo)", value: "consumible" },
];

import { toNum } from "./stockHelpers";

export default function CrearIngredienteModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    tipoItem: "ingrediente",
    unidad: "g",

    stockActual: 0,
    stockMinimo: 0,
    stockCritico: 0,
    stockMax: 100,

    consumoAutoEnabled: false,
    consumoAutoCantidad: 1,
    consumoAutoCadaDias: 7,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const esConsumible = form.tipoItem === "consumible";

  const canSubmit = useMemo(() => {
    const nombreOk = form.nombre.trim().length >= 2;
    const maxOk = toNum(form.stockMax, 0) > 0;
    if (!nombreOk || !maxOk) return false;

    if (esConsumible && form.consumoAutoEnabled) {
      const cadaDiasOk = toNum(form.consumoAutoCadaDias, 0) >= 1;
      const cantidadOk = toNum(form.consumoAutoCantidad, 0) > 0;
      return cadaDiasOk && cantidadOk;
    }

    return true;
  }, [form, esConsumible]);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const setTipo = (value) => {
    setForm((p) => ({
      ...p,
      tipoItem: value,
      consumoAutoEnabled: value === "consumible" ? p.consumoAutoEnabled : false,
    }));
  };

  const setUnidad = (value) => setForm((p) => ({ ...p, unidad: value }));

  const crear = async () => {
    setError("");

    if (!canSubmit) {
      setError("Revisa los campos obligatorios antes de crear el ítem.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        nombre: form.nombre.trim(),
        unidad: form.unidad,
        tipoItem: form.tipoItem,

        stockActual: toNum(form.stockActual, 0),
        stockMinimo: toNum(form.stockMinimo, 0),
        stockCritico: toNum(form.stockCritico, 0),
        stockMax: toNum(form.stockMax, 0),

        consumoAuto: {
          enabled: esConsumible && form.consumoAutoEnabled,
          cantidad: esConsumible ? toNum(form.consumoAutoCantidad, 1) : 0,
          cadaDias: esConsumible ? Math.max(1, toNum(form.consumoAutoCadaDias, 7)) : 0,
        },
      };

      await api.post("/stock/ingrediente", payload);

      onSave?.();
      onClose?.();
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Error creando el ítem.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alef-modal-overlay" onClick={onClose}>
      <div className="alef-modal-content stk-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="stk-header">
          <h3 className="stk-title">Nuevo ítem de stock</h3>
          <p className="stk-subtitle">
            Crea un <strong>ingrediente</strong> (para recetas) o un{" "}
            <strong>consumible</strong> (servilletas, bolsas, rollos de papel…).
          </p>
        </header>

        {/* Body */}
        <section className="stk-body">
          <div className="stk-controls">
            {/* Datos principales */}
            <div className="stk-card">
              <div className="stk-card-title">Datos principales</div>
              <div className="stk-grid">
                <div className="stk-field">
                  <label className="stk-label">Nombre <span style={{ opacity: 0.6 }}>(obligatorio)</span></label>
                  <input className="stk-input" name="nombre" value={form.nombre} onChange={update} placeholder="Ej: Harina / Servilletas" autoFocus autoComplete="off" />
                </div>
                <div className="stk-field">
                  <label className="stk-label">Tipo</label>
                  <div className="stk-select-wrap">
                    <AlefSelect label="" value={form.tipoItem} options={tipos} onChange={setTipo} placeholder="Selecciona tipo" />
                  </div>
                </div>
                <div className="stk-field">
                  <label className="stk-label">Unidad</label>
                  <div className="stk-select-wrap">
                    <AlefSelect label="" value={form.unidad} options={unidades} onChange={setUnidad} placeholder="Selecciona unidad" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stock y alertas */}
            <div className="stk-card">
              <div className="stk-card-title">Stock y alertas</div>
              <div className="stk-grid">
                <div className="stk-field">
                  <label className="stk-label">Stock inicial</label>
                  <input className="stk-input" type="number" name="stockActual" min="0" step="1" value={form.stockActual} onChange={update} />
                </div>
                <div className="stk-field">
                  <label className="stk-label">Stock mínimo</label>
                  <input className="stk-input" type="number" name="stockMinimo" min="0" step="1" value={form.stockMinimo} onChange={update} />
                </div>
                <div className="stk-field">
                  <label className="stk-label">Stock crítico</label>
                  <input className="stk-input" type="number" name="stockCritico" min="0" step="1" value={form.stockCritico} onChange={update} />
                </div>
                <div className="stk-field">
                  <label className="stk-label">Stock máximo <span style={{ opacity: 0.6 }}>(obligatorio)</span></label>
                  <input className="stk-input" type="number" name="stockMax" min="1" step="1" value={form.stockMax} onChange={update} />
                </div>
              </div>
              <p className="stk-hint">Coherencia: <strong>crítico ≤ mínimo ≤ máximo</strong>.</p>
            </div>

            {/* Consumo automático */}
            {esConsumible && (
              <div className="stk-card">
                <div className="stk-card-title">Consumo automático por tiempo</div>
                <label className="stk-toggle">
                  <input
                    type="checkbox"
                    checked={form.consumoAutoEnabled}
                    onChange={(e) => setForm((p) => ({ ...p, consumoAutoEnabled: e.target.checked }))}
                    className="stk-checkbox"
                  />
                  Activar consumo automático
                </label>

                {form.consumoAutoEnabled && (
                  <div className="stk-grid stk-grid--top">
                    <div className="stk-field">
                      <label className="stk-label">Unidades por ciclo</label>
                      <input className="stk-input" type="number" min="1" step="1" value={form.consumoAutoCantidad} onChange={(e) => setForm((p) => ({ ...p, consumoAutoCantidad: e.target.value }))} placeholder="Ej: 1" />
                    </div>
                    <div className="stk-field">
                      <label className="stk-label">Cada cuántos días</label>
                      <input className="stk-input" type="number" min="1" step="1" value={form.consumoAutoCadaDias} onChange={(e) => setForm((p) => ({ ...p, consumoAutoCadaDias: e.target.value }))} placeholder="Ej: 7" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && <div className="stk-error">{error}</div>}

            <p className="stk-hint">
              Tip: si configuras consumo automático, se generarán movimientos <strong>consumo_auto</strong> para trazabilidad.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="stk-footer">
          <button className="stk-btn stk-btn--ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className="stk-btn stk-btn--primary"
            onClick={crear}
            disabled={loading || !canSubmit}
            title={!canSubmit ? "Completa los campos obligatorios" : ""}
          >
            {loading ? "Guardando…" : "Crear ítem"}
          </button>
        </footer>
      </div>
    </div>
  );
}
