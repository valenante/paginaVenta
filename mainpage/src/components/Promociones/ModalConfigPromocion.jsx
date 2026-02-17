import React, { useMemo, useState } from "react";
import api from "../../utils/api";
import AlertaMensaje from "../AlertaMensaje/AlertaMensaje";
import ModalConfirmacion from "../Modal/ModalConfirmacion"; // ajusta ruta si hace falta
import "./ModalConfigPromocion.css";

// Helpers
const toDateInput = (v) => {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const toNumberOrEmpty = (v) => (v === "" || v == null ? "" : String(v));

const parseNumberOrNull = (v) => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export default function ModalConfigPromocion({ producto, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    tipo: producto.promocion?.tipo || "mensaje",
    precioPromocional: toNumberOrEmpty(producto.promocion?.precioPromocional),
    descuentoPorcentaje: toNumberOrEmpty(producto.promocion?.descuentoPorcentaje),
    mensaje: producto.promocion?.mensaje || "",
    desde: toDateInput(producto.promocion?.desde),
    hasta: toDateInput(producto.promocion?.hasta),
  }));

  const [saving, setSaving] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [confirmDesactivar, setConfirmDesactivar] = useState(false);

  // Precio base para preview (si existe)
  const precioBase = useMemo(() => {
    const n =
      producto?.precios?.precioBase ??
      producto?.precios?.base ??
      producto?.precioBase ??
      producto?.precio ??
      null;
    const num = Number(n);
    return Number.isFinite(num) ? num : null;
  }, [producto]);

  const errors = useMemo(() => {
    const e = {};

    // Fechas
    if (form.desde && form.hasta && form.desde > form.hasta) {
      e.fechas = "La fecha 'Desde' no puede ser posterior a 'Hasta'.";
    }

    // Tipo
    if (form.tipo === "mensaje") {
      if (!form.mensaje.trim()) e.mensaje = "El mensaje es obligatorio.";
    }

    if (form.tipo === "precio") {
      const p = parseNumberOrNull(form.precioPromocional);
      if (p == null || p <= 0) e.precioPromocional = "Indica un precio válido (> 0).";
      if (precioBase != null && p != null && p >= precioBase) {
        e.precioPromocional = "El precio promocional debería ser menor que el precio base.";
      }
    }

    if (form.tipo === "porcentaje") {
      const d = parseNumberOrNull(form.descuentoPorcentaje);
      if (d == null || d <= 0) e.descuentoPorcentaje = "Indica un % válido (> 0).";
      if (d != null && d > 95) e.descuentoPorcentaje = "El % no puede ser mayor a 95.";
    }

    return e;
  }, [form, precioBase]);

  const isValid = Object.keys(errors).length === 0;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      // Si cambia el tipo, limpiamos campos no usados (coherencia)
      if (name === "tipo") {
        const next = { ...prev, tipo: value };
        if (value !== "precio") next.precioPromocional = "";
        if (value !== "porcentaje") next.descuentoPorcentaje = "";
        if (value === "mensaje") {
          // ok
        }
        return next;
      }

      return { ...prev, [name]: value };
    });
  };

  const buildPayload = () => {
    const payload = {
      tipo: form.tipo,
      mensaje: form.mensaje?.trim() || "",
      // mandamos fechas como string YYYY-MM-DD o null
      desde: form.desde || null,
      hasta: form.hasta || null,
      activa: true,
    };

    if (form.tipo === "precio") {
      payload.precioPromocional = parseNumberOrNull(form.precioPromocional);
      payload.descuentoPorcentaje = null;
    } else if (form.tipo === "porcentaje") {
      payload.descuentoPorcentaje = parseNumberOrNull(form.descuentoPorcentaje);
      payload.precioPromocional = null;
    } else {
      payload.precioPromocional = null;
      payload.descuentoPorcentaje = null;
    }

    return payload;
  };

  const guardarPromocion = async () => {
    if (!isValid) {
      setAlerta({ tipo: "error", mensaje: "Revisa los campos marcados antes de guardar." });
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload();

      const { data } = await api.put(`/productos/${producto._id}/promocion`, payload);

      // ✅ contrato correcto (tu backend devuelve { ok, producto, promocion })
      const productoActualizado = data?.producto || data;
      onSaved(productoActualizado);
      // opcional: cerrar
      // onClose();
    } catch (err) {
      console.error(err);
      setAlerta({ tipo: "error", mensaje: "Error guardando la promoción" });
    } finally {
      setSaving(false);
    }
  };

  const desactivarPromocion = async () => {
    try {
      setSaving(true);
      const { data } = await api.delete(`/productos/${producto._id}/promocion`);
      const productoActualizado = data?.producto || data;
      onSaved(productoActualizado);
      // onClose();
    } catch (err) {
      console.error(err);
      setAlerta({ tipo: "error", mensaje: "No se pudo desactivar la promoción." });
    } finally {
      setSaving(false);
      setConfirmDesactivar(false);
    }
  };

  // Preview (opcional)
  const preview = useMemo(() => {
    if (precioBase == null) return null;

    if (form.tipo === "precio") {
      const p = parseNumberOrNull(form.precioPromocional);
      if (p == null) return null;
      return `Precio final: ${p.toFixed(2)}€ (antes ${precioBase.toFixed(2)}€)`;
    }

    if (form.tipo === "porcentaje") {
      const d = parseNumberOrNull(form.descuentoPorcentaje);
      if (d == null) return null;
      const final = precioBase * (1 - d / 100);
      return `Precio final aprox: ${final.toFixed(2)}€ (${d}% desc. sobre ${precioBase.toFixed(2)}€)`;
    }

    return null;
  }, [form.tipo, form.precioPromocional, form.descuentoPorcentaje, precioBase]);

  const promoActiva = !!producto?.promocion?.activa;

  return (
    <div className="modal-overlay">
      <div className="modal card modal-promocion" role="dialog" aria-modal="true">
        <header className="modal-header">
          <h3>Configurar promoción</h3>
          <button onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <div className="modal-body">
          <label>Tipo de promoción</label>

          <select name="tipo" value={form.tipo} onChange={handleChange} disabled={saving}>
            <option value="mensaje">Mensaje</option>
            <option value="precio">Precio fijo</option>
            <option value="porcentaje">Descuento %</option>

            {/* Si no está implementado de verdad, mejor NO exponerlo en producción */}
            {/* <option value="happy_hour" disabled>Happy Hour (próximamente)</option> */}
          </select>

          {form.tipo === "precio" && (
            <>
              <input
                name="precioPromocional"
                type="number"
                min="0"
                step="0.01"
                placeholder="Precio promocional"
                value={form.precioPromocional}
                onChange={handleChange}
                disabled={saving}
              />
              {errors.precioPromocional && <p className="form-error">{errors.precioPromocional}</p>}
            </>
          )}

          {form.tipo === "porcentaje" && (
            <>
              <input
                name="descuentoPorcentaje"
                type="number"
                min="1"
                max="95"
                step="1"
                placeholder="% descuento"
                value={form.descuentoPorcentaje}
                onChange={handleChange}
                disabled={saving}
              />
              {errors.descuentoPorcentaje && <p className="form-error">{errors.descuentoPorcentaje}</p>}
            </>
          )}

          {/* Mensaje: requerido solo si tipo mensaje, opcional para el resto */}
          <textarea
            name="mensaje"
            placeholder={form.tipo === "mensaje" ? "Texto promocional (obligatorio)" : "Texto opcional"}
            value={form.mensaje}
            onChange={handleChange}
            disabled={saving}
          />
          {errors.mensaje && <p className="form-error">{errors.mensaje}</p>}

          <div className="row">
            <input type="date" name="desde" value={form.desde} onChange={handleChange} disabled={saving} />
            <input type="date" name="hasta" value={form.hasta} onChange={handleChange} disabled={saving} />
          </div>
          {errors.fechas && <p className="form-error">{errors.fechas}</p>}

          {preview && <div className="promo-preview">{preview}</div>}
        </div>

        <footer className="modal-actions">
          <button className="btn btn-secundario" onClick={onClose} disabled={saving}>
            Cancelar
          </button>

          {/* ✅ Botón desactivar usando TU modal (solo si estaba activa) */}
          {promoActiva && (
            <button
              className="btn btn-secundario"
              onClick={() => setConfirmDesactivar(true)}
              disabled={saving}
              style={{ marginRight: 8 }}
            >
              Desactivar
            </button>
          )}

          <button
            className="btn btn-primario"
            onClick={guardarPromocion}
            disabled={saving || !isValid}
            title={!isValid ? "Revisa los campos marcados" : ""}
          >
            {saving ? "Guardando..." : "Guardar promoción"}
          </button>
        </footer>

        {alerta && <AlertaMensaje {...alerta} onClose={() => setAlerta(null)} />}
      </div>

      {/* ✅ TU modal de confirmación */}
      {confirmDesactivar && (
        <ModalConfirmacion
          titulo="Desactivar promoción"
          mensaje={`¿Seguro que quieres desactivar la promoción de "${producto.nombre}"?`}
          onClose={() => setConfirmDesactivar(false)}
          onConfirm={desactivarPromocion}
        />
      )}
    </div>
  );
}
