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

    // consumo automático (solo consumibles)
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

    // si es consumible y activa consumo auto, validar los campos
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
      // si vuelves a ingrediente, apaga consumo auto para no enviar basura
      consumoAutoEnabled: value === "consumible" ? p.consumoAutoEnabled : false,
    }));
  };

  const setUnidad = (value) => setForm((p) => ({ ...p, unidad: value }));

  const crear = async () => {
    setError("");

    // validación rápida extra
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
      <div className="alef-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="crear-ingrediente-modal">
          <h3>➕ Nuevo ítem de stock</h3>
          <p className="help-text--crear" style={{ marginTop: 6 }}>
            Crea un <strong>ingrediente</strong> (para recetas) o un{" "}
            <strong>consumible</strong> (servilletas, bolsas, rollos de papel…).
            Los consumibles pueden configurarse para <strong>descontarse automáticamente</strong>
            con el paso del tiempo.
          </p>

          {/* =========================
              DATOS PRINCIPALES
          ========================== */}
          <h4 className="subtitulo--crear">🧾 Datos principales</h4>
          <p className="help-text--crear">
            El nombre y la unidad se usan en stock, recetas, pantallas y movimientos.
          </p>

          {/* Nombre */}
          <label className="label--editar">
            Nombre <span style={{ opacity: 0.8 }}>(obligatorio)</span>
            <input
              className="input--editar"
              name="nombre"
              value={form.nombre}
              onChange={update}
              placeholder="Ej: Harina / Servilletas / Aceite de oliva"
              autoFocus
            />
          </label>

          {/* Tipo item */}
          <AlefSelect
            label="Tipo"
            value={form.tipoItem}
            options={tipos}
            onChange={setTipo}
            placeholder="Selecciona tipo"
          />
          <p className="help-text--crear" style={{ marginTop: 6 }}>
            <strong>Ingrediente:</strong> se descuenta cuando lo uses en recetas.{" "}
            <strong>Consumible:</strong> se controla por stock independiente y puede tener consumo automático.
          </p>

          {/* Unidad */}
          <AlefSelect
            label="Unidad"
            value={form.unidad}
            options={unidades}
            onChange={setUnidad}
            placeholder="Selecciona unidad"
          />

          {/* =========================
              STOCK Y UMBRALES
          ========================== */}
          <h4 className="subtitulo--crear">📦 Stock y alertas</h4>
          <p className="help-text--crear">
            Define los umbrales para que el sistema marque el ítem como <strong>bajo</strong> o <strong>crítico</strong>.
          </p>

          <label className="label--editar">
            Stock inicial
            <input
              className="input--editar"
              type="number"
              name="stockActual"
              min="0"
              step="1"
              value={form.stockActual}
              onChange={update}
            />
          </label>

          <label className="label--editar">
            Stock mínimo
            <input
              className="input--editar"
              type="number"
              name="stockMinimo"
              min="0"
              step="1"
              value={form.stockMinimo}
              onChange={update}
            />
            <p className="help-text--crear">
              Si el stock baja de este valor, aparecerá como <strong>🟠 Bajo</strong>.
            </p>
          </label>

          <label className="label--editar">
            Stock crítico
            <input
              className="input--editar"
              type="number"
              name="stockCritico"
              min="0"
              step="1"
              value={form.stockCritico}
              onChange={update}
            />
            <p className="help-text--crear">
              Si el stock baja de este valor, aparecerá como <strong>🔴 Crítico</strong>.
            </p>
          </label>

          <label className="label--editar">
            Stock máximo <span style={{ opacity: 0.8 }}>(obligatorio)</span>
            <input
              className="input--editar"
              type="number"
              name="stockMax"
              min="1"
              step="1"
              value={form.stockMax}
              onChange={update}
            />
            <p className="help-text--crear">
              Se usa para calcular la barra de porcentaje (nivel actual vs máximo).
            </p>
          </label>

          {/* =========================
              CONSUMO AUTOMÁTICO
          ========================== */}
          {esConsumible && (
            <>
              <h4 className="subtitulo--crear">⏳ Consumo automático por tiempo</h4>
              <p className="help-text--crear">
                Útil para consumibles que se gastan “solos”. Ejemplo:{" "}
                <strong>1 caja de servilletas cada 7 días</strong>.
                El sistema descontará stock y registrará el movimiento automáticamente.
              </p>

              <label className="label--editar estado--editar">
                <input
                  type="checkbox"
                  checked={form.consumoAutoEnabled}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, consumoAutoEnabled: e.target.checked }))
                  }
                  className="checkbox--editar"
                />
                Activar consumo automático
              </label>

              {form.consumoAutoEnabled && (
                <>
                  <label className="label--editar">
                    Unidades a descontar por ciclo
                    <input
                      className="input--editar"
                      type="number"
                      min="1"
                      step="1"
                      value={form.consumoAutoCantidad}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, consumoAutoCantidad: e.target.value }))
                      }
                      placeholder="Ej: 1"
                    />
                    <p className="help-text--crear">
                      Cuántas unidades se descuentan cada vez (ej: 1 caja / 2 packs).
                    </p>
                  </label>

                  <label className="label--editar">
                    Cada cuántos días
                    <input
                      className="input--editar"
                      type="number"
                      min="1"
                      step="1"
                      value={form.consumoAutoCadaDias}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, consumoAutoCadaDias: e.target.value }))
                      }
                      placeholder="Ej: 7"
                    />
                    <p className="help-text--crear">
                      Frecuencia del descuento automático (ej: cada 7 días).
                    </p>
                  </label>
                </>
              )}
            </>
          )}

          {/* =========================
              ERRORES
          ========================== */}
          {error && (
            <div style={{ marginTop: 10, color: "#ff9b9b", fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* =========================
              BOTONES
          ========================== */}
          <div className="botones--editar" style={{ marginTop: 14 }}>
            <button className="boton--cancelar" onClick={onClose} disabled={loading}>
              Cancelar
            </button>

            <button
              className="boton--editar"
              onClick={crear}
              disabled={loading || !canSubmit}
              title={!canSubmit ? "Completa los campos obligatorios" : ""}
            >
              {loading ? "Guardando…" : "Crear ítem"}
            </button>
          </div>

          {/* Hint final */}
          <p className="help-text--crear" style={{ marginTop: 10 }}>
            Tip: si configuras consumo automático, el sistema generará movimientos tipo{" "}
            <strong>consumo_auto</strong> para mantener trazabilidad.
          </p>
        </div>
      </div>
    </div>
  );
}
