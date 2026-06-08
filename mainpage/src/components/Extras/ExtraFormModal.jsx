// src/components/Extras/ExtraFormModal.jsx
// Modal de crear/editar extra — mismo look que CategoriaFormModal (clases .catmodal-*).
// "Diferencias obvias" de un extra: precio único + opción de descontar stock de un producto.
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Portal from "../ui/Portal";
import "../Categories/CategoriaFormModal.css"; // reutiliza estilos .catmodal-*
import "./ExtrasPanel.css";

const to2 = (n) => Number(Math.round(Number(n) * 100) / 100);
const sanitizeNombre = (s) => String(s ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
const parsePrecio = (v) => {
  const n = Number(String(v ?? "").replace(",", "."));
  if (!Number.isFinite(n)) return null;
  const p = to2(n);
  if (p <= 0 || p > 999999) return null;
  return p;
};

export default function ExtraFormModal({ extra, productos = [], onClose, onSave }) {
  const isEdit = !!extra;

  const productoById = useMemo(() => {
    const m = new Map();
    for (const p of productos) m.set(String(p._id), p);
    return m;
  }, [productos]);

  const [nombre, setNombre] = useState(extra?.nombre ?? "");
  const [precio, setPrecio] = useState(extra?.precio != null ? String(extra.precio) : "");
  const [consumeStock, setConsumeStock] = useState(!!extra?.consumeStock);
  const [productoQuery, setProductoQuery] = useState(
    extra?.productoId ? (productoById.get(String(extra.productoId))?.nombre || "") : ""
  );
  const [cantidad, setCantidad] = useState(extra?.cantidad ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resolveProductoId = useCallback(() => {
    const q = String(productoQuery || "").trim().toLowerCase();
    if (!q) return null;
    const exact = productos.find((p) => String(p.nombre).toLowerCase() === q);
    if (exact) return exact._id;
    const partial = productos.find((p) => String(p.nombre).toLowerCase().includes(q));
    return partial?._id || null;
  }, [productoQuery, productos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const n = sanitizeNombre(nombre);
    const p = parsePrecio(precio);
    if (!n) { setError("Escribe un nombre válido."); return; }
    if (p == null) { setError("Escribe un precio válido (> 0)."); return; }

    const useStock = !!consumeStock;
    const productoId = useStock ? resolveProductoId() : null;
    if (useStock && !productoId) {
      setError("Selecciona el producto vinculado para descontar stock.");
      return;
    }
    const cant = useStock ? (Number(cantidad) || 1) : 1;

    setSaving(true);
    try {
      await onSave(
        { nombre: n, precio: p, consumeStock: useStock, productoId, cantidad: cant },
        extra?._id
      );
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
        err?.response?.data?.error ||
        "No se pudo guardar el extra."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <div className="catmodal-overlay">
        <div className="catmodal-card">
          <div className="catmodal-header">
            <h2 className="catmodal-title">{isEdit ? "Editar extra" : "Nuevo extra"}</h2>
            <button type="button" className="catmodal-close" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>

          {error && <div className="catmodal-error">{error}</div>}

          <form onSubmit={handleSubmit} className="catmodal-form">
            <label className="catmodal-label">
              Nombre
              <input
                className="catmodal-input"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Extra queso, Pan, Salsa…"
                maxLength={60}
                autoFocus
              />
            </label>

            <label className="catmodal-label">
              Precio (€)
              <input
                className="catmodal-input catmodal-input--orden"
                type="number"
                step="0.01"
                min="0"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0.00"
              />
            </label>

            <label className="catmodal-check">
              <input
                type="checkbox"
                checked={consumeStock}
                onChange={(e) => setConsumeStock(e.target.checked)}
              />
              <span>Descuenta stock de un producto del catálogo</span>
            </label>

            {consumeStock && (
              <div className="catmodal-advanced">
                <label className="catmodal-label">
                  Producto vinculado
                  <span className="catmodal-hint">Al vender este extra se descuenta stock de este producto</span>
                  <input
                    className="catmodal-input"
                    list="extra-productos-list"
                    value={productoQuery}
                    onChange={(e) => setProductoQuery(e.target.value)}
                    placeholder="Buscar producto…"
                  />
                  <datalist id="extra-productos-list">
                    {productos.map((p) => (
                      <option key={p._id} value={p.nombre} />
                    ))}
                  </datalist>
                </label>
                <label className="catmodal-label">
                  Cantidad a descontar por unidad
                  <input
                    className="catmodal-input catmodal-input--orden"
                    type="number"
                    min="0"
                    step="0.01"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                  />
                </label>
              </div>
            )}

            <div className="catmodal-actions">
              <button type="button" className="catmodal-btn catmodal-btn--cancel" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="catmodal-btn catmodal-btn--save" disabled={saving}>
                {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear extra"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
