// src/components/Stock/CrearIngredienteModal.jsx
import React, { useMemo, useState } from "react";
import api from "../../utils/api";
import AlefSelect from "../AlefSelect/AlefSelect";
import "./CrearIngredienteModal.css";

const unidades = ["g", "kg", "ml", "L", "uds", "caja", "pack", "botella"];

const tipos = [
  { label: "Ingrediente (para recetas)", value: "ingrediente" },
  { label: "Consumible (se consume solo)", value: "consumible" },
];

// helpers
const toNum = (v, fallback = 0) => {
  if (v === "" || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

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
      setError("⚠ Error creando el ítem. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alef-modal-overlay" onClick={onClose}>
      <div
        className="alef-modal-content alefIngredienteModalContent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="alefIngredienteModal">
          {/* HEADER (sticky en móvil) */}
          <div className="alefIngredienteHeader">
            <h3 className="alefIngredienteTitle">➕ Nuevo ítem de stock</h3>
            <p className="alefIngredienteSub">
              Crea un <strong>ingrediente</strong> (para recetas) o un{" "}
              <strong>consumible</strong> (servilletas, bolsas, rollos de papel…).
              Los consumibles pueden <strong>descontarse automáticamente</strong> con el paso del tiempo.
            </p>
          </div>

          {/* BODY (scroll interno, perfecto móvil) */}
          <div className="alefIngredienteScroll">
            {/* DATOS PRINCIPALES */}
            <div className="alefIngredienteSection">
              <h4 className="alefIngredienteH4">🧾 Datos principales</h4>
              <p className="alefIngredienteHint">
                El nombre y la unidad se usan en stock, recetas, pantallas y movimientos.
              </p>

              <div className="alefIngredienteGrid">
                <div className="alefIngredienteField">
                  <label className="alefIngredienteLabel">
                    Nombre <span className="alefIngredienteReq">(obligatorio)</span>
                  </label>
                  <input
                    className="alefIngredienteInput"
                    name="nombre"
                    value={form.nombre}
                    onChange={update}
                    placeholder="Ej: Harina / Servilletas / Aceite de oliva"
                    autoFocus
                    autoComplete="off"
                  />
                </div>

                <div className="alefIngredienteField">
                  <label className="alefIngredienteLabel">Tipo</label>
                  {/* mantenemos tu AlefSelect, pero lo “encapsulamos” visualmente */}
                  <div className="alefIngredienteSelectWrap">
                    <AlefSelect
                      label=""
                      value={form.tipoItem}
                      options={tipos}
                      onChange={setTipo}
                      placeholder="Selecciona tipo"
                    />
                  </div>
                  <p className="alefIngredienteMicro">
                    <strong>Ingrediente:</strong> se descuenta en recetas.{" "}
                    <strong>Consumible:</strong> stock independiente + consumo automático.
                  </p>
                </div>

                <div className="alefIngredienteField">
                  <label className="alefIngredienteLabel">Unidad</label>
                  <div className="alefIngredienteSelectWrap">
                    <AlefSelect
                      label=""
                      value={form.unidad}
                      options={unidades}
                      onChange={setUnidad}
                      placeholder="Selecciona unidad"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* STOCK Y UMBRALES */}
            <div className="alefIngredienteSection">
              <h4 className="alefIngredienteH4">📦 Stock y alertas</h4>
              <p className="alefIngredienteHint">
                Define umbrales para marcar el ítem como <strong>bajo</strong> o <strong>crítico</strong>.
              </p>

              <div className="alefIngredienteGrid">
                <div className="alefIngredienteField">
                  <label className="alefIngredienteLabel">Stock inicial</label>
                  <input
                    className="alefIngredienteInput"
                    type="number"
                    name="stockActual"
                    min="0"
                    step="1"
                    value={form.stockActual}
                    onChange={update}
                  />
                </div>

                <div className="alefIngredienteField">
                  <label className="alefIngredienteLabel">Stock mínimo</label>
                  <input
                    className="alefIngredienteInput"
                    type="number"
                    name="stockMinimo"
                    min="0"
                    step="1"
                    value={form.stockMinimo}
                    onChange={update}
                  />
                  <p className="alefIngredienteMicro">
                    Si baja de esto → <strong>🟠 Bajo</strong>.
                  </p>
                </div>

                <div className="alefIngredienteField">
                  <label className="alefIngredienteLabel">Stock crítico</label>
                  <input
                    className="alefIngredienteInput"
                    type="number"
                    name="stockCritico"
                    min="0"
                    step="1"
                    value={form.stockCritico}
                    onChange={update}
                  />
                  <p className="alefIngredienteMicro">
                    Si baja de esto → <strong>🔴 Crítico</strong>.
                  </p>
                </div>

                <div className="alefIngredienteField">
                  <label className="alefIngredienteLabel">
                    Stock máximo <span className="alefIngredienteReq">(obligatorio)</span>
                  </label>
                  <input
                    className="alefIngredienteInput"
                    type="number"
                    name="stockMax"
                    min="1"
                    step="1"
                    value={form.stockMax}
                    onChange={update}
                  />
                  <p className="alefIngredienteMicro">
                    Se usa para la barra de porcentaje (actual vs máximo).
                  </p>
                </div>
              </div>
            </div>

            {/* CONSUMO AUTOMÁTICO */}
            {esConsumible && (
              <div className="alefIngredienteSection">
                <h4 className="alefIngredienteH4">⏳ Consumo automático por tiempo</h4>
                <p className="alefIngredienteHint">
                  Ejemplo: <strong>1 caja de servilletas cada 7 días</strong>. Se descuenta stock y se registra el movimiento.
                </p>

                <label className="alefIngredienteToggle">
                  <input
                    type="checkbox"
                    checked={form.consumoAutoEnabled}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, consumoAutoEnabled: e.target.checked }))
                    }
                    className="alefIngredienteCheckbox"
                  />
                  Activar consumo automático
                </label>

                {form.consumoAutoEnabled && (
                  <div className="alefIngredienteGrid">
                    <div className="alefIngredienteField">
                      <label className="alefIngredienteLabel">Unidades por ciclo</label>
                      <input
                        className="alefIngredienteInput"
                        type="number"
                        min="1"
                        step="1"
                        value={form.consumoAutoCantidad}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, consumoAutoCantidad: e.target.value }))
                        }
                        placeholder="Ej: 1"
                      />
                      <p className="alefIngredienteMicro">
                        Cuántas unidades se descuentan cada vez (1 caja / 2 packs).
                      </p>
                    </div>

                    <div className="alefIngredienteField">
                      <label className="alefIngredienteLabel">Cada cuántos días</label>
                      <input
                        className="alefIngredienteInput"
                        type="number"
                        min="1"
                        step="1"
                        value={form.consumoAutoCadaDias}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, consumoAutoCadaDias: e.target.value }))
                        }
                        placeholder="Ej: 7"
                      />
                      <p className="alefIngredienteMicro">
                        Frecuencia del descuento automático (ej: cada 7 días).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && <div className="alefIngredienteError">{error}</div>}

            <p className="alefIngredienteHint">
              Tip: si configuras consumo automático, se generarán movimientos{" "}
              <strong>consumo_auto</strong> para trazabilidad.
            </p>
          </div>

          {/* FOOTER (sticky en móvil + botones 50/50) */}
          <div className="alefIngredienteFooter">
            <button
              className="alefIngredienteBtn ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              className="alefIngredienteBtn primary"
              onClick={crear}
              disabled={loading || !canSubmit}
              title={!canSubmit ? "Completa los campos obligatorios" : ""}
            >
              {loading ? "Guardando…" : "Crear ítem"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
