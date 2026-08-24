// src/components/Iva/IvaPanel.jsx
// Panel de gestión de IVA por categoría — bulk assignment.

import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "../../utils/api";
import "./IvaPanel.css";

const IVA_RATES = [
  { value: 10, label: "10% (reducido)", desc: "Hostelería en sala" },
  { value: 21, label: "21% (general)", desc: "Alcohol takeaway, retail" },
  { value: 4, label: "4% (superreducido)", desc: "Venta retail básicos" },
  { value: 0, label: "0% (exento)", desc: "Exento" },
];

const TABS = [
  { key: "plato", label: "Platos", emoji: "🍽️" },
  { key: "bebida", label: "Bebidas", emoji: "🥂" },
];

export default function IvaPanel() {
  const [tab, setTab] = useState("plato");
  const [resumen, setResumen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // categoria being saved
  const [editCat, setEditCat] = useState(null); // { categoria, iva }
  const [toast, setToast] = useState(null);

  // Fetch resumen
  const fetchResumen = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/productos/iva-resumen");
      const raw = res?.data ?? res;
      const items = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setResumen(items);
    } catch { setResumen([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchResumen(); }, [fetchResumen]);

  // Filter by tab
  const filtrados = useMemo(() => {
    const tipoFilter = tab === "plato" ? ["plato", "tapaRacion"] : [tab];
    return resumen
      .filter(r => tipoFilter.includes(r.tipo))
      .sort((a, b) => (a.categoria || "").localeCompare(b.categoria || "", "es"));
  }, [resumen, tab]);

  // Save IVA for a category
  const guardar = async (categoria, iva) => {
    setSaving(categoria);
    try {
      // ── D-85 · SE LEE LO QUE EL BACKEND CONTESTA, QUE PARA ESO LO DICE ────────────────
      // Aquí se hacía `await api.put(...)` tirando la respuesta y se pintaba el toast verde de
      // forma incondicional. El backend YA devuelve `actualizados: result.modifiedCount`
      // (`productosController.js` -> `bulkAsignarIva`), justo el dato que delata un cambio que
      // no tocó nada — y nadie lo leía.
      //
      // Que casen 0 documentos no es raro: el `updateMany` filtra por `{categoria, tipo}` con
      // igualdad EXACTA de dos strings que nadie normaliza igual (el zod hace `.trim()` sobre la
      // categoria entrante, `Producto.categoria` no declara `trim: true`), y el `tipo` sale de la
      // PESTAÑA activa, no de la fila. Con el bug dentro: HTTP 200, `actualizados: 0`, toast
      // verde, y el usuario se va convencido de haber cambiado el IVA de su carta.
      //
      // Zona fiscal ⇒ Art. 5: un 0 tiene que GRITAR. Y si el backend no informa del recuento,
      // tampoco se afirma un exito rotundo: «no lo se» no es «esta bien».
      const res = await api.put("/productos/bulk-iva", { categoria, iva, tipo: tab });
      const cuerpo = res?.data?.data ?? res?.data ?? {};
      const n = Number(cuerpo.actualizados);

      if (Number.isFinite(n) && n > 0) {
        setToast({ ok: true, msg: `${categoria}: ${n} producto${n === 1 ? "" : "s"} a IVA ${iva}%` });
      } else if (n === 0) {
        setToast({ ok: false, msg: `${categoria}: 0 productos actualizados. El IVA NO ha cambiado.` });
      } else {
        setToast({ ok: false, msg: `${categoria}: el servidor no confirmó cuántos productos cambió. Comprueba la carta.` });
      }
      setEditCat(null);
      await fetchResumen();
    } catch (err) {
      setToast({ ok: false, msg: err?.response?.data?.message || "Error al guardar" });
    }
    setSaving(null);
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const sinIva = filtrados.filter(r => r.iva == null || r.mixto);
  const conIva = filtrados.filter(r => r.iva != null && !r.mixto);

  return (
    <div className="iva-panel">
      {/* Top bar */}
      <div className="iva-panel__top">
        <div className="iva-panel__tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`iva-tab ${tab === t.key ? "is-active" : ""}`}
              onClick={() => { setTab(t.key); setEditCat(null); }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {sinIva.length > 0 && (
          <span className="iva-panel__warn">
            {sinIva.length} {sinIva.length === 1 ? "categoría" : "categorías"} sin IVA uniforme
          </span>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`iva-toast ${toast.ok ? "iva-toast--ok" : "iva-toast--err"}`}>
          {toast.ok ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Info */}
      <p className="iva-panel__info">
        En hostelería, todo lo consumido en sala es <strong>10%</strong>. Solo usa 21% para alcohol takeaway o productos no alimentarios.
      </p>

      {loading ? (
        <div className="iva-panel__loading">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="iva-panel__empty">No hay categorías de {tab === "plato" ? "platos" : "bebidas"}</div>
      ) : (
        <div className="iva-table">
          <div className="iva-table__head">
            <span>Categoría</span>
            <span>Productos</span>
            <span>IVA actual</span>
            <span></span>
          </div>

          {filtrados.map(r => {
            const isEditing = editCat?.categoria === r.categoria;
            return (
              <div key={r.categoria} className={`iva-table__row ${r.mixto ? "iva-table__row--warn" : ""}`}>
                <span className="iva-table__cat">{r.categoria}</span>
                <span className="iva-table__count">{r.productos}</span>

                {isEditing ? (
                  <div className="iva-table__edit">
                    <select
                      className="iva-select"
                      value={editCat.iva}
                      onChange={e => setEditCat({ ...editCat, iva: Number(e.target.value) })}
                    >
                      {IVA_RATES.map(rate => (
                        <option key={rate.value} value={rate.value}>{rate.label}</option>
                      ))}
                    </select>
                    <button
                      className="iva-btn iva-btn--save"
                      disabled={saving === r.categoria}
                      onClick={() => guardar(r.categoria, editCat.iva)}
                    >
                      {saving === r.categoria ? "..." : "Aplicar"}
                    </button>
                    <button
                      className="iva-btn iva-btn--cancel"
                      onClick={() => setEditCat(null)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`iva-table__rate ${r.iva == null || r.mixto ? "iva-table__rate--warn" : ""}`}>
                      {r.mixto ? "Mixto" : r.iva != null ? `${r.iva}%` : "Sin IVA"}
                    </span>
                    <button
                      className="iva-btn iva-btn--edit"
                      onClick={() => setEditCat({ categoria: r.categoria, iva: r.iva ?? 10 })}
                    >
                      Cambiar
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
