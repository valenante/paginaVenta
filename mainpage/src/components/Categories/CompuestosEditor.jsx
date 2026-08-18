// src/components/Categories/CompuestosEditor.jsx
//
// Editor reutilizable para definir un producto como COMPUESTO:
// - componentes[]: hijos FIJOS que acompañan siempre al padre (menú del día).
// - seleccionables[]: grupos donde el cliente elige (surtido croquetas).
//
// Usa clases del tema oscuro en CrearProducto.css (compuesto-*).

import React, { useMemo, useState } from "react";
import { toInputText, toNum, clampIntNum } from "../../utils/numeroInput";

/**
 * Los inputs numéricos guardan STRING mientras el usuario teclea (para poder
 * vaciarlos y escribir "1.29"). La conversión a número se hace aquí, al guardar.
 * Las usan CrearProducto y EditProducts en su handleSubmit.
 */
export function normalizarComponentes(componentes) {
  return (Array.isArray(componentes) ? componentes : []).map((c) => ({
    ...c,
    cantidad: Math.max(0, toNum(c?.cantidad, 0)),
  }));
}

export function normalizarSeleccionables(seleccionables) {
  return (Array.isArray(seleccionables) ? seleccionables : []).map((sel) => ({
    ...sel,
    slotsTotal: clampIntNum(sel?.slotsTotal, 1, Infinity, 1),
    minPorOpcion: clampIntNum(sel?.minPorOpcion, 0, Infinity, 0),
    maxPorOpcion:
      sel?.maxPorOpcion === "" || sel?.maxPorOpcion == null
        ? null
        : clampIntNum(sel.maxPorOpcion, 0, Infinity, 0),
    opciones: (Array.isArray(sel?.opciones) ? sel.opciones : []).map((op) => ({
      ...op,
      cantidadPorSlot: Math.max(0, toNum(op?.cantidadPorSlot, 0)),
    })),
  }));
}

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

  const [queries, setQueries] = useState({});

  // Componentes fijos
  const addComponente = () => onChangeComponentes([...componentes, defaultComponente()]);
  const removeComponente = (idx) => onChangeComponentes(componentes.filter((_, i) => i !== idx));
  const patchComponente = (idx, patch) =>
    onChangeComponentes(componentes.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  // Seleccionables
  const addSeleccionable = () => onChangeSeleccionables([...seleccionables, defaultSeleccionable()]);
  const removeSeleccionable = (idx) =>
    onChangeSeleccionables(seleccionables.filter((_, i) => i !== idx));
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
    <fieldset className="fieldset--crear">
      <legend className="legend--crear">Producto compuesto (opcional)</legend>
      <p className="help-text--crear">
        Define este producto como combo: <strong>componentes fijos</strong> (siempre van juntos,
        ej: menú del día) o <strong>grupos seleccionables</strong> (el cliente elige, ej: surtido
        de 6 croquetas). El precio del padre manda; cada hijo descuenta stock del producto real
        del catálogo.
      </p>

      {/* ─────────── Componentes fijos ─────────── */}
      <div className="compuesto-section--crear">
        <div className="compuesto-section__titulo--crear">
          Componentes fijos ({componentes.length})
        </div>
        <p className="help-text--crear">
          Hijos que SIEMPRE acompañan al padre al vender. Ej: Menú del día → ensalada + plato +
          postre + bebida.
        </p>

        {componentes.length === 0 && (
          <p className="adicional-editor__empty--crear">
            Sin componentes fijos. Añade uno o deja vacío si este producto no los usa.
          </p>
        )}

        {componentes.map((comp, idx) => {
          const qKey = `comp-${idx}`;
          const vinculado = comp.productoId ? productoById.get(String(comp.productoId)) : null;
          const qVal = queries[qKey] ?? (vinculado?.nombre || "");
          const escribioAlgo = qVal.trim().length > 0;
          return (
            <div key={idx} className="compuesto-row--crear">
              <label className="label--crear compuesto-row__label-small--crear">Producto del catálogo
                <input
                  list={`comp-opts-${idx}`}
                  value={qVal}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQueries((q) => ({ ...q, [qKey]: v }));
                    const prod = resolveProductoByQuery(v);
                    patchComponente(idx, { productoId: prod?._id || null });
                  }}
                  placeholder={
                    productosOrdenados.length === 0
                      ? "No hay productos en el catálogo"
                      : `Escribe para buscar entre ${productosOrdenados.length} productos…`
                  }
                  className="input--crear"
                  disabled={disabled || productosOrdenados.length === 0}
                />
                <datalist id={`comp-opts-${idx}`}>
                  {productosOrdenados.map((p) => (
                    <option key={String(p._id)} value={p.nombre} />
                  ))}
                </datalist>
                {vinculado ? (
                  <small className="adicional-row__feedback--crear is-ok">Vinculado a <strong>{vinculado.nombre}</strong>
                  </small>
                ) : escribioAlgo ? (
                  <small className="adicional-row__feedback--crear is-err">No se encontró ningún producto con ese nombre. Escribe el nombre exacto o elige de la lista desplegable.
                  </small>
                ) : (
                  <small className="help-text--crear">
                    Al enfocar el campo verás la lista de productos. Empieza a escribir para filtrarla.
                  </small>
                )}
              </label>

              <label className="label--crear compuesto-row__label-small--crear">
                Cantidad
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={toInputText(comp.cantidad)}
                  onChange={(e) =>
                    patchComponente(idx, { cantidad: e.target.value })
                  }
                  className="input--crear"
                  disabled={disabled}
                />
              </label>

              <label className="label--crear compuesto-row__label-small--crear">
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
                className="adicional-row__btn-trash--crear"
                onClick={() => removeComponente(idx)}
                disabled={disabled}
                title="Quitar componente"
              >
                🗑️
              </button>
            </div>
          );
        })}

        <button
          type="button"
          className="boton--secundario"
          onClick={addComponente}
          disabled={disabled}
        >
          + Añadir componente fijo
        </button>
      </div>

      {/* ─────────── Grupos seleccionables ─────────── */}
      <div className="compuesto-section--crear">
        <div className="compuesto-section__titulo--crear">
          Grupos seleccionables ({seleccionables.length})
        </div>
        <p className="help-text--crear">
          Grupos donde el cliente elige. Ej: "Elige 6 croquetas" con opciones [jamón, rabo,
          cochinillo]. El cliente distribuye el total entre las opciones en el TPV.
        </p>

        {seleccionables.length === 0 && (
          <p className="adicional-editor__empty--crear">Sin grupos seleccionables.</p>
        )}

        {seleccionables.map((sel, selIdx) => (
          <div key={selIdx} className="compuesto-seleccionable--crear">
            <div className="compuesto-seleccionable__head--crear">
              <label className="label--crear compuesto-row__label-small--crear">
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
              <label className="label--crear compuesto-row__label-small--crear">
                Total a elegir
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={toInputText(sel.slotsTotal)}
                  onChange={(e) =>
                    patchSeleccionable(selIdx, { slotsTotal: e.target.value })
                  }
                  className="input--crear"
                  disabled={disabled}
                />
              </label>
              <label className="label--crear compuesto-row__label-small--crear">
                Mín. por opción
                <input
                  type="number"
                  min="0"
                  value={toInputText(sel.minPorOpcion)}
                  onChange={(e) =>
                    patchSeleccionable(selIdx, { minPorOpcion: e.target.value })
                  }
                  className="input--crear"
                  disabled={disabled}
                />
              </label>
              <label className="label--crear compuesto-row__label-small--crear">
                Máx. por opción (vacío = ilimitado)
                <input
                  type="number"
                  min="0"
                  value={toInputText(sel.maxPorOpcion)}
                  onChange={(e) =>
                    patchSeleccionable(selIdx, { maxPorOpcion: e.target.value })
                  }
                  className="input--crear"
                  disabled={disabled}
                />
              </label>
              <button
                type="button"
                className="adicional-row__btn-trash--crear"
                onClick={() => removeSeleccionable(selIdx)}
                disabled={disabled}
                title="Quitar grupo"
              >
                🗑️
              </button>
            </div>

            {/* Opciones */}
            <div className="compuesto-seleccionable__opciones--crear">
              <div className="compuesto-seleccionable__opciones-titulo--crear">
                Opciones ({(sel.opciones || []).length})
              </div>
              {(sel.opciones || []).length === 0 && (
                <p className="compuesto-opcion-empty--crear">
                  Añade al menos una opción para que el cliente pueda elegir.
                </p>
              )}

              {(sel.opciones || []).map((op, opIdx) => {
                const qKey = `sel-${selIdx}-op-${opIdx}`;
                const vinc = op.productoId
                  ? productoById.get(String(op.productoId))
                  : null;
                const qVal = queries[qKey] ?? (vinc?.nombre || "");
                const escribioAlgo = qVal.trim().length > 0;
                return (
                  <div key={opIdx} className="compuesto-opcion-row--crear">
                    <label className="label--crear compuesto-row__label-small--crear">Producto del catálogo
                      <input
                        list={`op-opts-${selIdx}-${opIdx}`}
                        value={qVal}
                        onChange={(e) => {
                          const v = e.target.value;
                          setQueries((q) => ({ ...q, [qKey]: v }));
                          const prod = resolveProductoByQuery(v);
                          patchOpcion(selIdx, opIdx, {
                            productoId: prod?._id || null,
                          });
                        }}
                        placeholder={
                          productosOrdenados.length === 0
                            ? "No hay productos en el catálogo"
                            : `Escribe para buscar entre ${productosOrdenados.length} productos…`
                        }
                        className="input--crear"
                        disabled={disabled || productosOrdenados.length === 0}
                      />
                      <datalist id={`op-opts-${selIdx}-${opIdx}`}>
                        {productosOrdenados.map((p) => (
                          <option key={String(p._id)} value={p.nombre} />
                        ))}
                      </datalist>
                      {vinc ? (
                        <small className="adicional-row__feedback--crear is-ok">
                          ✓ <strong>{vinc.nombre}</strong>
                        </small>
                      ) : escribioAlgo ? (
                        <small className="adicional-row__feedback--crear is-err">No se encontró. Escribe el nombre exacto.
                        </small>
                      ) : null}
                    </label>

                    <label className="label--crear compuesto-row__label-small--crear">
                      Cant/slot
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={toInputText(op.cantidadPorSlot)}
                        onChange={(e) =>
                          patchOpcion(selIdx, opIdx, {
                            cantidadPorSlot: e.target.value,
                          })
                        }
                        className="input--crear"
                        disabled={disabled}
                      />
                    </label>

                    <label className="label--crear compuesto-row__label-small--crear">
                      Etiqueta (opcional)
                      <input
                        type="text"
                        value={op.label || ""}
                        onChange={(e) =>
                          patchOpcion(selIdx, opIdx, { label: e.target.value })
                        }
                        placeholder="Vacío = nombre producto"
                        className="input--crear"
                        disabled={disabled}
                      />
                    </label>

                    <button
                      type="button"
                      className="adicional-row__btn-trash--crear"
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
              >
                + Añadir opción
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="boton--secundario"
          onClick={addSeleccionable}
          disabled={disabled}
        >
          + Añadir grupo seleccionable
        </button>
      </div>
    </fieldset>
  );
}
