// src/components/Categories/AdicionalesEditor.jsx
//
// Editor reutilizable para la lista de adicionales de un producto.
// Cada adicional puede ser:
//   (a) Legacy: solo nombre + precio → modificador de precio, NO toca stock.
//   (b) Con stock (v2): vincula a un Producto del catálogo → descuenta stock al vender.
//
// Props:
//   - adicionales: array de { nombre, precio, productoId?, cantidad?, consumeStock? }
//   - onChange: (nuevoArray) => void
//   - productosDisponibles: array de productos del catálogo (al menos { _id, nombre, controlStock, receta, precios })
//
// Diseño:
//   - Lista con +/− para añadir/eliminar filas.
//   - Cada fila: nombre, precio. Toggle "Descuenta stock" que despliega:
//     selector de producto (datalist filtrable) + input cantidad.

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

  // Productos candidatos para vincular: los que gestionan stock (controlStock o receta).
  // Si el usuario quiere vincular a algo sin stock, también se permite (ej. caso futuro).
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

  const add = () => {
    const next = [...adicionales, defaultRow()];
    onChange(next);
  };

  const remove = (idx) => {
    const next = adicionales.filter((_, i) => i !== idx);
    onChange(next);
    setQueryByRow((q) => {
      const c = { ...q };
      delete c[idx];
      return c;
    });
  };

  const resolveProductoByQuery = (query) => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return null;
    // 1) Match exacto por nombre (datalist devuelve valor)
    const exact = candidatos.find((p) => String(p.nombre).toLowerCase() === q);
    if (exact) return exact;
    // 2) Match parcial
    return candidatos.find((p) => String(p.nombre).toLowerCase().includes(q)) || null;
  };

  return (
    <fieldset className="fieldset--crear fieldset--adicional">
      <legend className="legend--crear">Adicionales / Extras</legend>
      <p className="help-text--crear">
        Opciones que el cliente puede añadir al producto (ej: "Extra queso",
        "Pan aparte"). Cada adicional puede ser <strong>solo precio</strong> (no afecta stock)
        o estar <strong>vinculado a un producto del catálogo</strong> para descontar stock automáticamente.
      </p>

      {adicionales.length === 0 && (
        <p className="help-text--crear" style={{ fontStyle: "italic" }}>
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
            className="adicional-row"
            style={{
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: 10,
              marginBottom: 10,
              background: linked ? "#f7fbff" : "#fafafa",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8 }}>
              <label className="label--crear" style={{ margin: 0 }}>
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

              <label className="label--crear" style={{ margin: 0 }}>
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
                className="boton--secundario"
                onClick={() => remove(idx)}
                disabled={disabled}
                title="Quitar este adicional"
                style={{ alignSelf: "end" }}
              >
                🗑️
              </button>
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={!!ad.consumeStock}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    if (!enabled) {
                      // Desvincular: quitar productoId y consumeStock
                      update(idx, { consumeStock: false });
                    } else {
                      update(idx, { consumeStock: true });
                    }
                  }}
                  disabled={disabled}
                />
                <span>
                  <strong>Descuenta stock</strong> al vender (vincular a producto del catálogo)
                </span>
              </label>
            </div>

            {ad.consumeStock && (
              <div
                style={{
                  marginTop: 8,
                  padding: 8,
                  background: "#eef5ff",
                  borderRadius: 4,
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: 8,
                }}
              >
                <label className="label--crear" style={{ margin: 0 }}>
                  Producto vinculado
                  <input
                    list={`adicional-productos-${idx}`}
                    value={rowQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setQueryByRow((q) => ({ ...q, [idx]: v }));
                      const prod = resolveProductoByQuery(v);
                      update(idx, { productoId: prod?._id || null });
                    }}
                    placeholder="Buscar producto del catálogo…"
                    className="input--crear"
                    disabled={disabled}
                  />
                  <datalist id={`adicional-productos-${idx}`}>
                    {candidatos.map((p) => (
                      <option key={String(p._id)} value={p.nombre}>
                        {p.controlStock ? " (stock directo)" : ""}
                        {Array.isArray(p.receta) && p.receta.length > 0 ? " (receta)" : ""}
                      </option>
                    ))}
                  </datalist>
                  {linked && linkedProduct && (
                    <small style={{ color: "#2a5" }}>
                      ✓ Vinculado a: <strong>{linkedProduct.nombre}</strong>
                      {linkedProduct.controlStock ? " (stock directo)" : ""}
                      {Array.isArray(linkedProduct.receta) && linkedProduct.receta.length > 0
                        ? " (gestiona por receta)"
                        : ""}
                    </small>
                  )}
                  {!linked && rowQuery && (
                    <small style={{ color: "#c22" }}>
                      ⚠ No se encontró un producto con ese nombre. Selecciona uno de la lista.
                    </small>
                  )}
                </label>

                <label className="label--crear" style={{ margin: 0 }}>
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
                  <small style={{ color: "#666" }}>
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
