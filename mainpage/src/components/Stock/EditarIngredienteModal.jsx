// src/components/Stock/EditarIngredienteModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import AlefSelect from "../AlefSelect/AlefSelect";
import "./EditarIngredienteModal.css";

// ⚙️ Opciones
const unidades = ["g", "kg", "ml", "L", "uds", "caja", "pack", "botella"];
const tipos = [
  { label: "Ingrediente", value: "ingrediente" },
  { label: "Consumible", value: "consumible" },
];

// 🧰 Helpers
const toNum = (v, fallback = 0) => {
  if (v === "" || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const clampMin = (n, min = 0) => Math.max(min, n);

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

  const stockMax = clampMin(toNum(form?.stockMax, 1), 1);
  const stockMinimo = clampMin(toNum(form?.stockMinimo, 0), 0);
  const stockCritico = clampMin(toNum(form?.stockCritico, 0), 0);

  const nombre = String(form?.nombre || "").trim();
  const unidad = String(form?.unidad || "g");

  const enabled = Boolean(form?.consumoAuto?.enabled);
  const cantidad = clampMin(toNum(form?.consumoAuto?.cantidad, 1), 0);
  const cadaDias = clampMin(toNum(form?.consumoAuto?.cadaDias, 7), 1);

  return {
    nombre,
    unidad,
    tipoItem,
    stockMax,
    stockMinimo,
    stockCritico,
    archivado: Boolean(form?.archivado),
    consumoAuto: esConsumible
      ? { enabled, cantidad, cadaDias }
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
  const unidadChip = form?.unidad || "ud";

  const validar = () => {
    const f = currentNorm;
    if (!f) return "Formulario inválido.";
    if (f.nombre.length < 2) return "El nombre debe tener al menos 2 caracteres.";
    if (!f.unidad.trim()) return "La unidad es obligatoria.";

    if (f.stockMinimo > f.stockMax)
      return "El stock mínimo no puede ser mayor que el stock máximo.";
    if (f.stockCritico > f.stockMinimo)
      return "El stock crítico no puede ser mayor que el stock mínimo.";

    if (f.tipoItem === "consumible" && f.consumoAuto.enabled) {
      if (f.consumoAuto.cantidad <= 0) return "La cantidad por ciclo debe ser mayor a 0.";
      if (f.consumoAuto.cadaDias < 1) return "La frecuencia debe ser al menos 1 día.";
    }

    return "";
  };

  const onChangeTipo = (value) => {
    setError("");

    const prevTipo = form?.tipoItem;
    if (prevTipo === "consumible" && value === "ingrediente") {
      const estabaAuto = Boolean(form?.consumoAuto?.enabled);
      if (estabaAuto) {
        const ok = window.confirm(
          "Cambiar a Ingrediente desactivará el consumo automático. ¿Continuar?"
        );
        if (!ok) return;
      }
      setForm((p) => ({
        ...p,
        tipoItem: value,
        consumoAuto: { ...p.consumoAuto, enabled: false },
      }));
      return;
    }

    setForm((p) => ({ ...p, tipoItem: value }));
  };

  const guardar = async () => {
    if (!ingrediente?._id) return;

    setError("");
    const msg = validar();
    if (msg) return setError(msg);
    if (!hasChanges) return;

    try {
      setLoading(true);

      const diff = shallowDiff(initialNorm, currentNorm);

      // refuerzo coherencia consumoAuto si es consumible
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
    } catch (e) {
      const errMsg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Error actualizando el ítem.";
      setError(String(errMsg));
    } finally {
      setLoading(false);
    }
  };

  // Atajos teclado: Esc cierra / Enter guarda
  useEffect(() => {
    if (!form) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter") {
        if (e.target?.tagName?.toLowerCase() === "textarea") return;
        if (!loading && hasChanges) guardar();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, loading, hasChanges]);

  if (!form || !ingrediente) return null;

  return (
    <div
      className="alef-modal-overlay stock-editar-overlay"
      onClick={() => !loading && onClose?.()}
    >
      <div
        className="alef-modal-content stock-editar-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER (idéntico a AjustarStockModal) ===== */}
        <header className="stock-editar-header">
          <div className="stock-editar-titleRow">
            <h3 className="stock-editar-title">✏️ Editar ítem</h3>

            {/* chips con misma clase visual */}
            <div className="stock-editar-chipRow">
              <span className="stock-editar-chip">{unidadChip}</span>
              <span className="stock-editar-chip">
                {form.tipoItem === "consumible" ? "Consumible" : "Ingrediente"}
              </span>
            </div>
          </div>

          <p className="stock-editar-subtitle">
            Edita nombre, unidad, umbrales y consumo automático. El{" "}
            <strong>stock actual</strong> se ajusta en “Ajustar stock” para mantener trazabilidad.
          </p>

          <div className="stock-editar-item">
            <span className="stock-editar-itemName">{ingrediente.nombre}</span>
            <span className="stock-editar-itemMeta">
              Stock actual: <strong>{toNum(ingrediente.stockActual, 0)}</strong> {unidadChip} ·
              Máx actual: <strong>{toNum(ingrediente.stockMax, 0)}</strong> {unidadChip}
            </span>
          </div>
        </header>

        {/* ===== BODY (idéntico a AjustarStockModal) ===== */}
        <section className="stock-editar-body">
          <div className="stock-editar-controls">
            {/* Card: Datos */}
            <div className="stock-editar-card">
              <div className="stock-editar-cardTitle">🧾 Datos principales</div>

              <div className="stock-editar-grid">
                <div className="stock-editar-field">
                  <label className="stock-editar-label">Nombre</label>
                  <input
                    className="stock-editar-input"
                    value={form.nombre}
                    onChange={(e) => {
                      setError("");
                      setForm((p) => ({ ...p, nombre: e.target.value }));
                    }}
                    placeholder="Ej: Harina / Servilletas / Aceite"
                    autoFocus
                    disabled={loading}
                  />
                </div>

                <div className="stock-editar-field">
                  <label className="stock-editar-label">Tipo</label>
                  <div className="stock-editar-selectWrap">
                    <AlefSelect
                      label=""
                      value={form.tipoItem}
                      options={tipos}
                      onChange={onChangeTipo}
                      placeholder="Selecciona tipo"
                    />
                  </div>
                </div>

                <div className="stock-editar-field">
                  <label className="stock-editar-label">Unidad</label>
                  <div className="stock-editar-selectWrap">
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
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Umbrales */}
            <div className="stock-editar-card">
              <div className="stock-editar-cardTitle">📦 Stock y alertas</div>

              <div className="stock-editar-grid">
                <div className="stock-editar-field">
                  <label className="stock-editar-label">Stock máximo</label>
                  <input
                    className="stock-editar-input"
                    type="number"
                    min="1"
                    step="1"
                    value={form.stockMax}
                    onChange={(e) => {
                      setError("");
                      setForm((p) => ({ ...p, stockMax: e.target.value }));
                    }}
                    onBlur={() =>
                      setForm((p) => ({
                        ...p,
                        stockMax: String(clampMin(toNum(p.stockMax, 1), 1)),
                      }))
                    }
                    disabled={loading}
                  />
                </div>

                <div className="stock-editar-field">
                  <label className="stock-editar-label">Stock mínimo</label>
                  <input
                    className="stock-editar-input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stockMinimo}
                    onChange={(e) => {
                      setError("");
                      setForm((p) => ({ ...p, stockMinimo: e.target.value }));
                    }}
                    onBlur={() =>
                      setForm((p) => ({
                        ...p,
                        stockMinimo: String(clampMin(toNum(p.stockMinimo, 0), 0)),
                      }))
                    }
                    disabled={loading}
                  />
                </div>

                <div className="stock-editar-field">
                  <label className="stock-editar-label">Stock crítico</label>
                  <input
                    className="stock-editar-input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stockCritico}
                    onChange={(e) => {
                      setError("");
                      setForm((p) => ({ ...p, stockCritico: e.target.value }));
                    }}
                    onBlur={() =>
                      setForm((p) => ({
                        ...p,
                        stockCritico: String(clampMin(toNum(p.stockCritico, 0), 0)),
                      }))
                    }
                    disabled={loading}
                  />
                </div>
              </div>

              <p className="stock-editar-hint">
                Coherencia: <strong>crítico ≤ mínimo ≤ máximo</strong>.
              </p>
            </div>

            {/* Card: Consumo auto (si consumible) */}
            {esConsumible && (
              <div className="stock-editar-card">
                <div className="stock-editar-cardTitle">⏳ Consumo automático</div>

                <label className="stock-editar-toggle">
                  <input
                    type="checkbox"
                    checked={form.consumoAuto.enabled}
                    onChange={(e) => {
                      setError("");
                      setForm((p) => ({
                        ...p,
                        consumoAuto: { ...p.consumoAuto, enabled: e.target.checked },
                      }));
                    }}
                    className="stock-editar-checkbox"
                    disabled={loading}
                  />
                  Activar consumo automático
                </label>

                {form.consumoAuto.enabled && (
                  <div className="stock-editar-grid stock-editar-grid--top">
                    <div className="stock-editar-field">
                      <label className="stock-editar-label">Unidades por ciclo</label>
                      <input
                        className="stock-editar-input"
                        type="number"
                        min="1"
                        step="1"
                        value={form.consumoAuto.cantidad}
                        onChange={(e) => {
                          setError("");
                          setForm((p) => ({
                            ...p,
                            consumoAuto: { ...p.consumoAuto, cantidad: e.target.value },
                          }));
                        }}
                        onBlur={() =>
                          setForm((p) => ({
                            ...p,
                            consumoAuto: {
                              ...p.consumoAuto,
                              cantidad: String(clampMin(toNum(p.consumoAuto.cantidad, 1), 1)),
                            },
                          }))
                        }
                        disabled={loading}
                      />
                    </div>

                    <div className="stock-editar-field">
                      <label className="stock-editar-label">Cada cuántos días</label>
                      <input
                        className="stock-editar-input"
                        type="number"
                        min="1"
                        step="1"
                        value={form.consumoAuto.cadaDias}
                        onChange={(e) => {
                          setError("");
                          setForm((p) => ({
                            ...p,
                            consumoAuto: { ...p.consumoAuto, cadaDias: e.target.value },
                          }));
                        }}
                        onBlur={() =>
                          setForm((p) => ({
                            ...p,
                            consumoAuto: {
                              ...p.consumoAuto,
                              cadaDias: String(clampMin(toNum(p.consumoAuto.cadaDias, 7), 1)),
                            },
                          }))
                        }
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Card: Archivado */}
            <div className="stock-editar-card">
              <div className="stock-editar-cardTitle">🗄️ Estado</div>

              <label className="stock-editar-toggle">
                <input
                  type="checkbox"
                  checked={form.archivado}
                  onChange={(e) => {
                    setError("");
                    setForm((p) => ({ ...p, archivado: e.target.checked }));
                  }}
                  className="stock-editar-checkbox"
                  disabled={loading}
                />
                Archivar ítem
              </label>

              <p className="stock-editar-hint">
                Tip: <strong>Enter</strong> guarda · <strong>Esc</strong> cierra
              </p>
            </div>

            {error && <div className="stock-editar-error">{error}</div>}
          </div>
        </section>

        {/* ===== FOOTER (idéntico a AjustarStockModal) ===== */}
        <footer className="stock-editar-actions">
          <button
            type="button"
            className="btn-cancelar"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="btn-confirmar"
            onClick={guardar}
            disabled={loading || !hasChanges}
            title={!hasChanges ? "No hay cambios para guardar" : ""}
          >
            {loading ? "Guardando…" : "Guardar cambios"}
          </button>
        </footer>
      </div>
    </div>
  );
}
