// src/components/Stock/CrearIngredienteModal.jsx
import React, { useMemo, useState } from "react";
import api from "../../utils/api";
import AlefSelect from "../AlefSelect/AlefSelect";
import ModalBase from "../MapaEditor/ModalBase";
import "../MapaEditor/ModalCrearMesa.css"; // trae clases .alef* compartidas
import { toNum } from "./stockHelpers";

const unidades = ["g", "kg", "ml", "l", "uds", "caja", "pack", "botella"];
const tipos = [
  { label: "Ingrediente (para recetas)", value: "ingrediente" },
  { label: "Consumible (se consume solo)", value: "consumible" },
];

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
      return (
        toNum(form.consumoAutoCadaDias, 0) >= 1 &&
        toNum(form.consumoAutoCantidad, 0) > 0
      );
    }
    return true;
  }, [form, esConsumible]);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const crear = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!canSubmit) {
      setError("Revisa los campos obligatorios antes de crear el ítem.");
      return;
    }
    try {
      setLoading(true);
      await api.post("/stock/ingrediente", {
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
          cadaDias: esConsumible
            ? Math.max(1, toNum(form.consumoAutoCadaDias, 7))
            : 0,
        },
      });
      onSave?.();
      onClose?.();
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.response?.data?.error ||
          "Error creando el ítem."
      );
    } finally {
      setLoading(false);
    }
  };

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
        type="submit"
        form="alefCrearIngredienteForm"
        className="alefBtn primary"
        disabled={loading || !canSubmit}
      >
        {loading ? "Guardando…" : "Crear ítem"}
      </button>
    </div>
  );

  return (
    <ModalBase
      open={true}
      title="Nuevo ítem de stock"
      subtitle="Crea un ingrediente (para recetas) o un consumible (servilletas, bolsas…)."
      onClose={onClose}
      footer={footer}
      width={720}
    >
      <form id="alefCrearIngredienteForm" onSubmit={crear} className="alefForm">
        <div className="alefForm-grid">
          <label className="alefField">
            <span className="alefField-label">Nombre</span>
            <input
              className="alefField-input"
              name="nombre"
              value={form.nombre}
              onChange={update}
              placeholder="Ej: Harina, Servilletas…"
              autoFocus
              autoComplete="off"
              required
            />
          </label>

          <label className="alefField">
            <span className="alefField-label">Tipo</span>
            <AlefSelect
              label=""
              value={form.tipoItem}
              options={tipos}
              onChange={(value) =>
                setForm((p) => ({
                  ...p,
                  tipoItem: value,
                  consumoAutoEnabled:
                    value === "consumible" ? p.consumoAutoEnabled : false,
                }))
              }
              placeholder="Selecciona tipo"
            />
          </label>

          <label className="alefField">
            <span className="alefField-label">Unidad</span>
            <AlefSelect
              label=""
              value={form.unidad}
              options={unidades}
              onChange={(value) => setForm((p) => ({ ...p, unidad: value }))}
              placeholder="Selecciona unidad"
            />
          </label>

          <label className="alefField">
            <span className="alefField-label">Stock inicial</span>
            <input
              className="alefField-input"
              type="number"
              name="stockActual"
              min="0"
              step="1"
              value={form.stockActual}
              onChange={update}
            />
          </label>

          <label className="alefField">
            <span className="alefField-label">Stock mínimo</span>
            <input
              className="alefField-input"
              type="number"
              name="stockMinimo"
              min="0"
              step="1"
              value={form.stockMinimo}
              onChange={update}
            />
          </label>

          <label className="alefField">
            <span className="alefField-label">Stock crítico</span>
            <input
              className="alefField-input"
              type="number"
              name="stockCritico"
              min="0"
              step="1"
              value={form.stockCritico}
              onChange={update}
            />
          </label>

          <label className="alefField">
            <span className="alefField-label">Stock máximo *</span>
            <input
              className="alefField-input"
              type="number"
              name="stockMax"
              min="1"
              step="1"
              value={form.stockMax}
              onChange={update}
              required
            />
          </label>
        </div>

        <div className="alefHint">
          📦 Coherencia: <b>crítico ≤ mínimo ≤ máximo</b>.
        </div>

        {esConsumible && (
          <>
            <label className="alefField">
              <span className="alefField-label">
                <input
                  type="checkbox"
                  checked={form.consumoAutoEnabled}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      consumoAutoEnabled: e.target.checked,
                    }))
                  }
                  style={{ marginRight: 8 }}
                />
                Activar consumo automático por tiempo
              </span>
            </label>
            {form.consumoAutoEnabled && (
              <div className="alefForm-grid">
                <label className="alefField">
                  <span className="alefField-label">Unidades por ciclo</span>
                  <input
                    className="alefField-input"
                    type="number"
                    min="1"
                    step="1"
                    value={form.consumoAutoCantidad}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        consumoAutoCantidad: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="alefField">
                  <span className="alefField-label">Cada cuántos días</span>
                  <input
                    className="alefField-input"
                    type="number"
                    min="1"
                    step="1"
                    value={form.consumoAutoCadaDias}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        consumoAutoCadaDias: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            )}
          </>
        )}

        {error && <div className="alefError">{error}</div>}
      </form>
    </ModalBase>
  );
}
