// src/components/Categories/CompuestosEditor.jsx
//
// Editor reutilizable para definir un producto como COMPUESTO:
// - componentes[]: hijos FIJOS que acompañan siempre al padre (menú del día).
// - seleccionables[]: grupos donde el cliente elige (surtido croquetas).
//
// Props:
//   - componentes:      Array de { productoId, cantidad, clavePrecio?, label? }
//   - seleccionables:   Array de { nombre, slotsTotal, minPorOpcion?, maxPorOpcion?, opciones: [] }
//   - onChangeComponentes(next)
//   - onChangeSeleccionables(next)
//   - productosDisponibles: lista del catálogo (para selectors)
//   - disabled: bool

import React, { useMemo, useState } from "react";

const defaultComponente = () => ({
  productoId: null,
  cantidad: 1,
  clavePrecio: null,
  label: "",
});

const defaultSeleccionable = () => ({
  nombre: "",
  slotsTotal: 1,
  minPorOpcion: 0,
  maxPorOpcion: null,
  opciones: [],
});

const defaultOpcion = () => ({
  productoId: null,
  cantidadPorSlot: 1,
  clavePrecio: null,
  label: "",
});

export default function CompuestosEditor({
  componentes = [],
  seleccionables = [],
  onChangeComponentes,
  onChangeSeleccionables,
  productosDisponibles = [],
  disabled = false,
}) {
  const productosOrdenados = useMemo(
    () => (productosDisponibles || []).slice().sort((a, b) =>
      String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es")
    ),
    [productosDisponibles]
  );
  const productoById = useMemo(() => {
    const m = new Map();
    for (const p of productosOrdenados) m.set(String(p._id), p);
    return m;
  }, [productosOrdenados]);

  const resolveProductoByQuery = (query) => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return null;
    const exact = productosOrdenados.find((p) => String(p.nombre).toLowerCase() === q);
    if (exact) return exact;
    return productosOrdenados.find((p) => String(p.nombre).toLowerCase().includes(q)) || null;
  };

  // Estado local para inputs de búsqueda (datalist) por componente/opción
  const [queries, setQueries] = useState({}); // { "comp-0": "Patatas...", "sel-0-opc-2": "..." }

  // ===== Componentes fijos =====
  const addComponente = () => onChangeComponentes([...componentes, defaultComponente()]);
  const removeComponente = (idx) => onChangeComponentes(componentes.filter((_, i) => i !== idx));
  const patchComponente = (idx, patch) =>
    onChangeComponentes(componentes.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  // ===== Seleccionables =====
  const addSeleccionable = () => onChangeSeleccionables([...seleccionables, defaultSeleccionable()]);
  const removeSeleccionable = (idx) => onChangeSeleccionables(seleccionables.filter((_, i) => i !== idx));
  const patchSeleccionable = (idx, patch) =>
    onChangeSeleccionables(seleccionables.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const addOpcion = (selIdx) => {
    const sel = seleccionables[selIdx];
    if (!sel) return;
    patchSeleccionable(selIdx, { opciones: [...(sel.opciones || []), defaultOpcion()] });
  };
  const removeOpcion = (selIdx, opIdx) => {
    const sel = seleccionables[selIdx];
    if (!sel) return;
    patchSeleccionable(selIdx, { opciones: (sel.opciones || []).filter((_, i) => i !== opIdx) });
  };
  const patchOpcion = (selIdx, opIdx, patch) => {
    const sel = seleccionables[selIdx];
    if (!sel) return;
    const nuevasOps = (sel.opciones || []).map((o, i) => (i === opIdx ? { ...o, ...patch } : o));
    patchSeleccionable(selIdx, { opciones: nuevasOps });
  };

  return (
    <fieldset className="fieldset--crear" style={{ marginTop: 16 }}>
      <legend className="legend--crear">🧩 Producto compuesto (opcional)</legend>
      <p className="help-text--crear">
        Define este producto como combo: pueden ser <strong>componentes fijos</strong> (siempre van
        juntos, ej: menú del día) o <strong>grupos seleccionables</strong> (el cliente elige, ej:
        surtido de 6 croquetas). El precio del padre manda; cada hijo descuenta stock del producto
        real del catálogo.
      </p>

      {/* ──────────────────────── COMPONENTES FIJOS ──────────────────────── */}
      <div style={{ marginTop: 12 }}>
        <h4 style={{ margin: "8px 0", fontSize: 14 }}>
          Componentes fijos ({componentes.length})
        </h4>
        <p className="help-text--crear" style={{ fontSize: 12 }}>
          Hijos que SIEMPRE acompañan al padre al vender. Ej: Menú del día → ensalada + plato +
          postre + bebida.
        </p>

        {componentes.length === 0 && (
          <p style={{ fontStyle: "italic", color: "#999", fontSize: 13 }}>
            Sin componentes fijos. Añade uno o deja vacío si este producto no los usa.
          </p>
        )}

        {componentes.map((comp, idx) => {
          const qKey = `comp-${idx}`;
          const vinculado = comp.productoId ? productoById.get(String(comp.productoId)) : null;
          const qVal = queries[qKey] ?? (vinculado?.nombre || "");
          return (
            <div
              key={idx}
              style={{
                border: "1px solid #ddd",
                borderRadius: 6,
                padding: 10,
                marginBottom: 8,
                background: "#fafafa",
                display: "grid",
                gridTemplateColumns: "3fr 1fr 2fr auto",
                gap: 8,
                alignItems: "end",
              }}
            >
              <label className="label--crear" style={{ margin: 0, fontSize: 12 }}>
                Producto
                <input
                  list={`comp-opts-${idx}`}
                  value={qVal}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQueries((q) => ({ ...q, [qKey]: v }));
                    const prod = resolveProductoByQuery(v);
                    patchComponente(idx, { productoId: prod?._id || null });
                  }}
                  placeholder="Buscar producto…"
                  className="input--crear"
                  disabled={disabled}
                />
                <datalist id={`comp-opts-${idx}`}>
                  {productosOrdenados.map((p) => (
                    <option key={String(p._id)} value={p.nombre} />
                  ))}
                </datalist>
              </label>

              <label className="label--crear" style={{ margin: 0, fontSize: 12 }}>
                Cantidad
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={comp.cantidad ?? 1}
                  onChange={(e) =>
                    patchComponente(idx, { cantidad: parseFloat(e.target.value) || 0 })
                  }
                  className="input--crear"
                  disabled={disabled}
                />
              </label>

              <label className="label--crear" style={{ margin: 0, fontSize: 12 }}>
                Etiqueta (opcional)
                <input
                  type="text"
                  value={comp.label || ""}
                  onChange={(e) => patchComponente(idx, { label: e.target.value })}
                  placeholder="Ej: Entrante, Bebida…"
                  className="input--crear"
                  disabled={disabled}
                />
              </label>

              <button
                type="button"
                className="boton--secundario"
                onClick={() => removeComponente(idx)}
                disabled={disabled}
                title="Quitar componente"
              >
                🗑️
              </button>
            </div>
          );
        })}

        <button type="button" className="boton--secundario" onClick={addComponente} disabled={disabled}>
          + Añadir componente fijo
        </button>
      </div>

      {/* ──────────────────────── SELECCIONABLES ──────────────────────── */}
      <div style={{ marginTop: 20 }}>
        <h4 style={{ margin: "8px 0", fontSize: 14 }}>
          Grupos seleccionables ({seleccionables.length})
        </h4>
        <p className="help-text--crear" style={{ fontSize: 12 }}>
          Grupos donde el cliente elige. Ej: "Elige 6 croquetas" con opciones [jamón, rabo, cochinillo].
          El cliente distribuye el total entre las opciones en el TPV.
        </p>

        {seleccionables.length === 0 && (
          <p style={{ fontStyle: "italic", color: "#999", fontSize: 13 }}>
            Sin grupos seleccionables.
          </p>
        )}

        {seleccionables.map((sel, selIdx) => (
          <div
            key={selIdx}
            style={{
              border: "2px solid #b3d4ff",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              background: "#f5faff",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
              <label className="label--crear" style={{ margin: 0, fontSize: 12 }}>
                Nombre del grupo
                <input
                  type="text"
                  value={sel.nombre || ""}
                  onChange={(e) => patchSeleccionable(selIdx, { nombre: e.target.value })}
                  placeholder="Ej: Elige 6 croquetas"
                  className="input--crear"
                  disabled={disabled}
                />
              </label>
              <label className="label--crear" style={{ margin: 0, fontSize: 12 }}>
                Total a elegir
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={sel.slotsTotal ?? 1}
                  onChange={(e) => patchSeleccionable(selIdx, { slotsTotal: parseInt(e.target.value, 10) || 1 })}
                  className="input--crear"
                  disabled={disabled}
                />
              </label>
              <label className="label--crear" style={{ margin: 0, fontSize: 12 }}>
                Mín. por opción
                <input
                  type="number"
                  min="0"
                  value={sel.minPorOpcion ?? 0}
                  onChange={(e) => patchSeleccionable(selIdx, { minPorOpcion: parseInt(e.target.value, 10) || 0 })}
                  className="input--crear"
                  disabled={disabled}
                />
              </label>
              <label className="label--crear" style={{ margin: 0, fontSize: 12 }}>
                Máx. por opción (vacío = ilimitado)
                <input
                  type="number"
                  min="0"
                  value={sel.maxPorOpcion ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    patchSeleccionable(selIdx, {
                      maxPorOpcion: v === "" ? null : parseInt(v, 10) || 0,
                    });
                  }}
                  className="input--crear"
                  disabled={disabled}
                />
              </label>
              <button
                type="button"
                className="boton--secundario"
                onClick={() => removeSeleccionable(selIdx)}
                disabled={disabled}
                title="Quitar grupo"
              >
                🗑️
              </button>
            </div>

            {/* Opciones del seleccionable */}
            <div style={{ marginTop: 10, paddingLeft: 8, borderLeft: "3px solid #b3d4ff" }}>
              <h5 style={{ margin: "6px 0", fontSize: 13 }}>
                Opciones ({(sel.opciones || []).length})
              </h5>
              {(sel.opciones || []).length === 0 && (
                <p style={{ fontStyle: "italic", color: "#888", fontSize: 12 }}>
                  Añade al menos una opción para que el cliente pueda elegir.
                </p>
              )}

              {(sel.opciones || []).map((op, opIdx) => {
                const qKey = `sel-${selIdx}-op-${opIdx}`;
                const vinc = op.productoId ? productoById.get(String(op.productoId)) : null;
                const qVal = queries[qKey] ?? (vinc?.nombre || "");
                return (
                  <div
                    key={opIdx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "3fr 1fr 2fr auto",
                      gap: 8,
                      alignItems: "end",
                      marginBottom: 6,
                      padding: 6,
                      background: "white",
                      borderRadius: 4,
                    }}
                  >
                    <label className="label--crear" style={{ margin: 0, fontSize: 12 }}>
                      Producto opción
                      <input
                        list={`op-opts-${selIdx}-${opIdx}`}
                        value={qVal}
                        onChange={(e) => {
                          const v = e.target.value;
                          setQueries((q) => ({ ...q, [qKey]: v }));
                          const prod = resolveProductoByQuery(v);
                          patchOpcion(selIdx, opIdx, { productoId: prod?._id || null });
                        }}
                        placeholder="Buscar producto…"
                        className="input--crear"
                        disabled={disabled}
                      />
                      <datalist id={`op-opts-${selIdx}-${opIdx}`}>
                        {productosOrdenados.map((p) => (
                          <option key={String(p._id)} value={p.nombre} />
                        ))}
                      </datalist>
                    </label>

                    <label className="label--crear" style={{ margin: 0, fontSize: 12 }}>
                      Cant/slot
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={op.cantidadPorSlot ?? 1}
                        onChange={(e) =>
                          patchOpcion(selIdx, opIdx, { cantidadPorSlot: parseFloat(e.target.value) || 0 })
                        }
                        className="input--crear"
                        disabled={disabled}
                      />
                    </label>

                    <label className="label--crear" style={{ margin: 0, fontSize: 12 }}>
                      Etiqueta (opcional)
                      <input
                        type="text"
                        value={op.label || ""}
                        onChange={(e) => patchOpcion(selIdx, opIdx, { label: e.target.value })}
                        placeholder="Vacío = nombre producto"
                        className="input--crear"
                        disabled={disabled}
                      />
                    </label>

                    <button
                      type="button"
                      className="boton--secundario"
                      onClick={() => removeOpcion(selIdx, opIdx)}
                      disabled={disabled}
                      title="Quitar opción"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                className="boton--secundario"
                onClick={() => addOpcion(selIdx)}
                disabled={disabled}
                style={{ fontSize: 12 }}
              >
                + Añadir opción
              </button>
            </div>
          </div>
        ))}

        <button type="button" className="boton--secundario" onClick={addSeleccionable} disabled={disabled}>
          + Añadir grupo seleccionable
        </button>
      </div>
    </fieldset>
  );
}
