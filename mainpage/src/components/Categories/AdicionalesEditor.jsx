// src/components/Categories/AdicionalesEditor.jsx
//
// Editor reutilizable para la lista de adicionales de un producto.
// Cada adicional puede ser:
//   (a) Legacy: solo nombre + precio → modificador de precio, NO toca stock.
//   (b) Con stock (v2): vincula a un Producto del catálogo → descuenta stock al vender.
//
// Usa las clases del tema oscuro definidas en CrearProducto.css.

import React, { useMemo, useState } from "react";

const defaultRow = () => ({
  nombre: "",
  precio: 0,
  productoId: null,
  cantidad: 1,
  consumeStock: false,
});

export default function AdicionalesEditor({
  adicionales = [],
  onChange,
  productosDisponibles = [],
  disabled = false,
}) {
  const [queryByRow, setQueryByRow] = useState({});

  const candidatos = useMemo(
    () => (productosDisponibles || []).slice().sort((a, b) =>
      String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es")
    ),
    [productosDisponibles]
  );

  const mapById = useMemo(() => {
    const m = new Map();
    for (const p of candidatos) m.set(String(p._id), p);
    return m;
  }, [candidatos]);

  const update = (idx, patch) => {
    const next = adicionales.map((ad, i) => (i === idx ? { ...ad, ...patch } : ad));
    onChange(next);
  };

  const add = () => onChange([...adicionales, defaultRow()]);

  const remove = (idx) => {
    onChange(adicionales.filter((_, i) => i !== idx));
    setQueryByRow((q) => {
      const c = { ...q };
      delete c[idx];
      return c;
    });
  };

  const resolveProductoByQuery = (query) => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return null;
    const exact = candidatos.find((p) => String(p.nombre).toLowerCase() === q);
    if (exact) return exact;
    return candidatos.find((p) => String(p.nombre).toLowerCase().includes(q)) || null;
  };

  return (
    <fieldset className="fieldset--crear fieldset--adicional">
      <legend className="legend--crear">Adicionales / Extras</legend>
      <p className="help-text--crear">
        Opciones que el cliente puede añadir al producto (ej: "Extra queso", "Pan aparte").
        Cada adicional puede ser <strong>solo precio</strong> (no afecta stock) o estar
        <strong> vinculado a un producto del catálogo</strong> para descontar stock automáticamente.
      </p>

      {adicionales.length === 0 && (
        <p className="adicional-editor__empty--crear">
          Este producto no tiene adicionales configurados.
        </p>
      )}

      {adicionales.map((ad, idx) => {
        const linked = !!ad.productoId;
        const linkedProduct = linked ? mapById.get(String(ad.productoId)) : null;
        const rowQuery = queryByRow[idx] ?? (linkedProduct?.nombre || "");

        return (
          <div
            key={idx}
            className={`adicional-row--crear ${linked ? "is-linked" : ""}`}
          >
            <div className="adicional-row__main--crear">
              <label className="label--crear adicional-row__label-small--crear">
                Nombre visible
                <input
                  type="text"
                  value={ad.nombre || ""}
                  onChange={(e) => update(idx, { nombre: e.target.value })}
                  placeholder="Ej: Extra queso, Pan, Sin cebolla"
                  className="input--crear"
                  disabled={disabled}
                />
              </label>

              <label className="label--crear adicional-row__label-small--crear">
                Precio extra (€)
                <input
                  type="number"
                  value={ad.precio ?? 0}
                  onChange={(e) => update(idx, { precio: parseFloat(e.target.value) || 0 })}
                  className="input--crear"
                  min="0"
                  step="0.01"
                  disabled={disabled}
                />
              </label>

              <button
                type="button"
                className="adicional-row__btn-trash--crear"
                onClick={() => remove(idx)}
                disabled={disabled}
                title="Quitar este adicional"
              >
                🗑️
              </button>
            </div>

            <label className="adicional-row__toggle--crear">
              <input
                type="checkbox"
                checked={!!ad.consumeStock}
                onChange={(e) => update(idx, { consumeStock: e.target.checked })}
                disabled={disabled}
              />
              <span>
                <strong>Descuenta stock</strong> al vender (vincular a producto del catálogo)
              </span>
            </label>

            {ad.consumeStock && (
              <div className="adicional-row__stock-panel--crear">
                <label className="label--crear adicional-row__label-small--crear">
                  🔍 Producto del catálogo
                  <input
                    list={`adicional-productos-${idx}`}
                    value={rowQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setQueryByRow((q) => ({ ...q, [idx]: v }));
                      const prod = resolveProductoByQuery(v);
                      update(idx, { productoId: prod?._id || null });
                    }}
                    placeholder={
                      candidatos.length === 0
                        ? "No hay productos en el catálogo"
                        : `Escribe para buscar entre ${candidatos.length} productos…`
                    }
                    className="input--crear"
                    disabled={disabled || candidatos.length === 0}
                  />
                  <datalist id={`adicional-productos-${idx}`}>
                    {candidatos.map((p) => (
                      <option key={String(p._id)} value={p.nombre} />
                    ))}
                  </datalist>
                  {linked && linkedProduct ? (
                    <small className="adicional-row__feedback--crear is-ok">
                      ✓ Vinculado a <strong>{linkedProduct.nombre}</strong>
                      {linkedProduct.controlStock ? " (stock directo)" : ""}
                      {Array.isArray(linkedProduct.receta) && linkedProduct.receta.length > 0
                        ? " (gestiona por receta)"
                        : ""}
                    </small>
                  ) : rowQuery ? (
                    <small className="adicional-row__feedback--crear is-err">
                      ⚠ No se encontró un producto con ese nombre. Escribe el nombre exacto o elige uno de la lista.
                    </small>
                  ) : (
                    <small className="help-text--crear">
                      Al enfocar el campo verás la lista. Empieza a escribir para filtrarla.
                    </small>
                  )}
                </label>

                <label className="label--crear adicional-row__label-small--crear">
                  Cantidad por unidad
                  <input
                    type="number"
                    value={ad.cantidad ?? 1}
                    onChange={(e) => update(idx, { cantidad: parseFloat(e.target.value) || 0 })}
                    className="input--crear"
                    min="0"
                    step="0.01"
                    disabled={disabled}
                  />
                  <small className="help-text--crear">
                    Ej: "Extra queso" de 30g → pon 30. "1 pan extra" → pon 1.
                  </small>
                </label>
              </div>
            )}
          </div>
        );
      })}

      <button type="button" className="boton--secundario" onClick={add} disabled={disabled}>
        + Añadir adicional
      </button>
    </fieldset>
  );
}
