// src/components/Stock/EditarIngredienteModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import AlefSelect from "../AlefSelect/AlefSelect";
import ModalBase from "../MapaEditor/ModalBase";
import "../MapaEditor/ModalCrearMesa.css";
import { toNum, clampMin } from "./stockHelpers";

const unidades = ["g", "kg", "ml", "l", "uds", "caja", "pack", "botella"];
const tipos = [
  { label: "Ingrediente", value: "ingrediente" },
  { label: "Consumible", value: "consumible" },
];

function buildFormFromIngrediente(ing) {
  const tipoItem = ing?.tipoItem || "ingrediente";
  const esConsumible = tipoItem === "consumible";
  const consumoAutoSrc = ing?.consumoAuto || {};
  const enabled = Boolean(consumoAutoSrc.enabled);

  return {
    nombre: String(ing?.nombre || ""),
    unidad: String(ing?.unidad || "g"),
    tipoItem,
    stockMax: String(toNum(ing?.stockMax, 1)),
    stockMinimo: String(toNum(ing?.stockMinimo, 0)),
    stockCritico: String(toNum(ing?.stockCritico, 0)),
    archivado: Boolean(ing?.archivado),
    consumoAuto: {
      enabled: esConsumible ? enabled : false,
      cantidad: String(clampMin(toNum(consumoAutoSrc.cantidad, 1), 0)),
      cadaDias: String(clampMin(toNum(consumoAutoSrc.cadaDias, 7), 1)),
    },
  };
}

function normalizeForm(form) {
  const tipoItem = String(form?.tipoItem || "ingrediente");
  const esConsumible = tipoItem === "consumible";

  return {
    nombre: String(form?.nombre || "").trim(),
    unidad: String(form?.unidad || "g"),
    tipoItem,
    stockMax: clampMin(toNum(form?.stockMax, 1), 1),
    stockMinimo: clampMin(toNum(form?.stockMinimo, 0), 0),
    stockCritico: clampMin(toNum(form?.stockCritico, 0), 0),
    archivado: Boolean(form?.archivado),
    consumoAuto: esConsumible
      ? {
          enabled: Boolean(form?.consumoAuto?.enabled),
          cantidad: clampMin(toNum(form?.consumoAuto?.cantidad, 1), 0),
          cadaDias: clampMin(toNum(form?.consumoAuto?.cadaDias, 7), 1),
        }
      : { enabled: false, cantidad: 0, cadaDias: 0 },
  };
}

function shallowDiff(prev, next) {
  const out = {};
  for (const k of Object.keys(next)) {
    if (k === "consumoAuto") continue;
    if (prev[k] !== next[k]) out[k] = next[k];
  }
  const pAuto = prev.consumoAuto || {};
  const nAuto = next.consumoAuto || {};
  const autoChanged =
    pAuto.enabled !== nAuto.enabled ||
    pAuto.cantidad !== nAuto.cantidad ||
    pAuto.cadaDias !== nAuto.cadaDias;
  if (next.tipoItem === "consumible" && autoChanged) {
    out.consumoAuto = { ...nAuto };
  }
  return out;
}

export default function EditarIngredienteModal({ ingrediente, onClose, onSave }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initialForm = useMemo(
    () => (ingrediente ? buildFormFromIngrediente(ingrediente) : null),
    [ingrediente]
  );
  const initialNorm = useMemo(
    () => (initialForm ? normalizeForm(initialForm) : null),
    [initialForm]
  );

  useEffect(() => {
    if (!initialForm) return;
    setForm(initialForm);
    setError("");
  }, [initialForm]);

  const currentNorm = useMemo(() => (form ? normalizeForm(form) : null), [form]);

  const hasChanges = useMemo(() => {
    if (!initialNorm || !currentNorm) return false;
    return JSON.stringify(initialNorm) !== JSON.stringify(currentNorm);
  }, [initialNorm, currentNorm]);

  const esConsumible = form?.tipoItem === "consumible";

  const validar = () => {
    const f = currentNorm;
    if (!f) return "Formulario inválido.";
    if (f.nombre.length < 2) return "El nombre debe tener al menos 2 caracteres.";
    if (f.stockMinimo > f.stockMax)
      return "El mínimo no puede ser mayor que el máximo.";
    if (f.stockCritico > f.stockMinimo)
      return "El crítico no puede ser mayor que el mínimo.";
    if (f.tipoItem === "consumible" && f.consumoAuto.enabled) {
      if (f.consumoAuto.cantidad <= 0) return "Cantidad por ciclo > 0.";
      if (f.consumoAuto.cadaDias < 1) return "Frecuencia mínima 1 día.";
    }
    return "";
  };

  const guardar = async (e) => {
    e?.preventDefault?.();
    if (!ingrediente?._id) return;
    setError("");
    const msg = validar();
    if (msg) return setError(msg);
    if (!hasChanges) return;

    try {
      setLoading(true);
      const diff = shallowDiff(initialNorm, currentNorm);
      if (currentNorm.tipoItem === "consumible") {
        const pAuto = initialNorm.consumoAuto || {};
        const nAuto = currentNorm.consumoAuto || {};
        const autoChanged =
          pAuto.enabled !== nAuto.enabled ||
          pAuto.cantidad !== nAuto.cantidad ||
          pAuto.cadaDias !== nAuto.cadaDias;
        if (autoChanged) diff.consumoAuto = { ...nAuto };
      }
      await api.put(`/stock/ingrediente/${ingrediente._id}`, diff);
      onSave?.();
      onClose?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Error actualizando el ítem."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!form || !ingrediente) return null;

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
        form="alefEditarIngredienteForm"
        className="alefBtn primary"
        disabled={loading || !hasChanges}
      >
        {loading ? "Guardando…" : "Guardar cambios"}
      </button>
    </div>
  );

  return (
    <ModalBase
      open={true}
      title={`Editar · ${ingrediente.nombre}`}
      subtitle="El stock actual se ajusta desde 'Ajustar stock' para mantener trazabilidad."
      onClose={onClose}
      footer={footer}
      width={720}
    >
      <form
        id="alefEditarIngredienteForm"
        onSubmit={guardar}
        className="alefForm"
      >
        <div className="alefForm-grid">
          <label className="alefField">
            <span className="alefField-label">Nombre</span>
            <input
              className="alefField-input"
              value={form.nombre}
              onChange={(e) => {
                setError("");
                setForm((p) => ({ ...p, nombre: e.target.value }));
              }}
              placeholder="Ej: Harina, Aceite…"
              disabled={loading}
              autoFocus
            />
          </label>

          <label className="alefField">
            <span className="alefField-label">Tipo</span>
            <AlefSelect
              label=""
              value={form.tipoItem}
              options={tipos}
              onChange={(value) => {
                setError("");
                setForm((p) => ({ ...p, tipoItem: value }));
              }}
              placeholder="Selecciona tipo"
            />
          </label>

          <label className="alefField">
            <span className="alefField-label">Unidad</span>
            <AlefSelect
              label=""
              value={form.unidad}
              options={unidades}
              onChange={(value) => {
                setError("");
                setForm((p) => ({ ...p, unidad: value }));
              }}
              placeholder="Selecciona unidad"
            />
          </label>

          <label className="alefField">
            <span className="alefField-label">Stock máximo</span>
            <input
              className="alefField-input"
              type="number"
              min="1"
              step="1"
              value={form.stockMax}
              onChange={(e) => {
                setError("");
                setForm((p) => ({ ...p, stockMax: e.target.value }));
              }}
              disabled={loading}
            />
          </label>

          <label className="alefField">
            <span className="alefField-label">Stock mínimo</span>
            <input
              className="alefField-input"
              type="number"
              min="0"
              step="1"
              value={form.stockMinimo}
              onChange={(e) => {
                setError("");
                setForm((p) => ({ ...p, stockMinimo: e.target.value }));
              }}
              disabled={loading}
            />
          </label>

          <label className="alefField">
            <span className="alefField-label">Stock crítico</span>
            <input
              className="alefField-input"
              type="number"
              min="0"
              step="1"
              value={form.stockCritico}
              onChange={(e) => {
                setError("");
                setForm((p) => ({ ...p, stockCritico: e.target.value }));
              }}
              disabled={loading}
            />
          </label>
        </div>

        <div className="alefHint">
          📦 Coherencia: <b>crítico ≤ mínimo ≤ máximo</b>. Stock actual:{" "}
          <b>
            {toNum(ingrediente.stockActual, 0)} {form.unidad}
          </b>
        </div>

        {esConsumible && (
          <>
            <label className="alefField">
              <span className="alefField-label">
                <input
                  type="checkbox"
                  checked={form.consumoAuto.enabled}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      consumoAuto: {
                        ...p.consumoAuto,
                        enabled: e.target.checked,
                      },
                    }))
                  }
                  disabled={loading}
                  style={{ marginRight: 8 }}
                />
                Activar consumo automático
              </span>
            </label>

            {form.consumoAuto.enabled && (
              <div className="alefForm-grid">
                <label className="alefField">
                  <span className="alefField-label">Unidades por ciclo</span>
                  <input
                    className="alefField-input"
                    type="number"
                    min="1"
                    step="1"
                    value={form.consumoAuto.cantidad}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        consumoAuto: {
                          ...p.consumoAuto,
                          cantidad: e.target.value,
                        },
                      }))
                    }
                    disabled={loading}
                  />
                </label>
                <label className="alefField">
                  <span className="alefField-label">Cada cuántos días</span>
                  <input
                    className="alefField-input"
                    type="number"
                    min="1"
                    step="1"
                    value={form.consumoAuto.cadaDias}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        consumoAuto: {
                          ...p.consumoAuto,
                          cadaDias: e.target.value,
                        },
                      }))
                    }
                    disabled={loading}
                  />
                </label>
              </div>
            )}
          </>
        )}

        <label className="alefField">
          <span className="alefField-label">
            <input
              type="checkbox"
              checked={form.archivado}
              onChange={(e) =>
                setForm((p) => ({ ...p, archivado: e.target.checked }))
              }
              disabled={loading}
              style={{ marginRight: 8 }}
            />
            🗄️ Archivar ítem
          </span>
        </label>

        {error && <div className="alefError">{error}</div>}
      </form>
    </ModalBase>
  );
}
