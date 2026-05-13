// src/components/Costes/RecetaModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useReceta, guardarReceta, buscarIngredientes } from "../../Hooks/useRecetas";
import "./RecetaModal.css";

const UNIDADES = ["ud", "g", "kg", "ml", "cl", "litro"];

export default function RecetaModal({ productoId, productoNombre, onClose, onSaved }) {
  const { data, loading } = useReceta(productoId);
  const [lineas, setLineas] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (data?.receta) setLineas(data.receta.map((r, i) => ({ ...r, _key: i })));
  }, [data]);

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const items = await buscarIngredientes(q);
      setSearchResults(items);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(searchQ), 300);
    return () => clearTimeout(t);
  }, [searchQ, doSearch]);

  const addIngrediente = (pp) => {
    setLineas(prev => [...prev, {
      _key: Date.now(),
      productoProveedorId: pp._id,
      nombre: pp.nombre,
      cantidad: 1,
      unidad: pp.unidad === "kg" ? "g" : pp.unidad === "litro" ? "ml" : "ud",
      costeUnitario: pp.costePorUnidad || 0,
      costeLinea: pp.costePorUnidad || 0,
      precioBase: pp.precioBase,
      factorConversion: pp.factorConversion || 1,
      unidadProveedor: pp.unidad,
    }]);
    setShowSearch(false);
    setSearchQ("");
  };

  const updateLinea = (idx, field, value) => {
    setLineas(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const updated = { ...l, [field]: value };
      // Recalcular coste
      const costeUd = calcCosteUnitario(updated);
      updated.costeUnitario = costeUd;
      updated.costeLinea = Math.round(updated.cantidad * costeUd * 100) / 100;
      return updated;
    }));
  };

  const removeLinea = (idx) => setLineas(prev => prev.filter((_, i) => i !== idx));

  const costeTotal = lineas.reduce((s, l) => s + (l.costeLinea || 0), 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await guardarReceta(productoId, lineas.map(l => ({
        productoProveedorId: l.productoProveedorId,
        ingrediente: l.ingrediente || null,
        nombre: l.nombre,
        cantidad: l.cantidad,
        unidad: l.unidad,
        clavePrecio: l.clavePrecio || null,
      })));
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return createPortal(
    <div className="rec-overlay" onClick={onClose}>
      <div className="rec-modal" onClick={e => e.stopPropagation()}>
        <div className="rec-loading">Cargando receta...</div>
      </div>
    </div>,
    document.body
  );

  return createPortal(
    <div className="rec-overlay" onClick={onClose}>
      <div className="rec-modal" onClick={e => e.stopPropagation()}>
        <div className="rec-header">
          <h3>📋 Receta: {productoNombre}</h3>
          <button className="rec-close" onClick={onClose}>✕</button>
        </div>

        <div className="rec-body">
          {/* Ingredient list */}
          {lineas.length > 0 && (
            <div className="rec-table">
              <div className="rec-table__head">
                <span>Ingrediente</span>
                <span>Cantidad</span>
                <span>Unidad</span>
                <span>Coste/ud</span>
                <span>Coste línea</span>
                <span></span>
              </div>
              {lineas.map((l, i) => (
                <div key={l._key || i} className="rec-table__row">
                  <span className="rec-ing-name">{l.nombre}</span>
                  <span>
                    <input
                      type="number"
                      className="rec-input"
                      value={l.cantidad}
                      min="0"
                      step="any"
                      onChange={e => updateLinea(i, "cantidad", Number(e.target.value) || 0)}
                    />
                  </span>
                  <span>
                    <select className="rec-select" value={l.unidad} onChange={e => updateLinea(i, "unidad", e.target.value)}>
                      {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </span>
                  <span className="rec-cost">{l.costeUnitario?.toFixed(4)}€</span>
                  <span className="rec-cost rec-cost--total">{l.costeLinea?.toFixed(2)}€</span>
                  <span>
                    <button className="rec-remove" onClick={() => removeLinea(i)}>✕</button>
                  </span>
                </div>
              ))}
            </div>
          )}

          {lineas.length === 0 && (
            <p className="rec-empty">No hay ingredientes. Añade el primer ingrediente para definir la receta.</p>
          )}

          {/* Add ingredient */}
          {showSearch ? (
            <div className="rec-search">
              <input
                type="text"
                className="rec-search__input"
                placeholder="Buscar ingrediente (ej: calamar, harina, aceite...)"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                autoFocus
              />
              {searching && <div className="rec-search__loading">Buscando...</div>}
              {searchResults.length > 0 && (
                <div className="rec-search__results">
                  {searchResults.map(pp => (
                    <button key={pp._id} className="rec-search__item" onClick={() => addIngrediente(pp)}>
                      <span className="rec-search__name">{pp.nombre}</span>
                      <span className="rec-search__meta">{pp.precioBase}€/{pp.unidad} | {pp.formato}</span>
                    </button>
                  ))}
                </div>
              )}
              <button className="rec-search__cancel" onClick={() => { setShowSearch(false); setSearchQ(""); }}>Cancelar</button>
            </div>
          ) : (
            <button className="rec-add-btn" onClick={() => setShowSearch(true)}>+ Añadir ingrediente</button>
          )}
        </div>

        {/* Footer: total + save */}
        <div className="rec-footer">
          <div className="rec-total">
            <span>Coste total receta:</span>
            <strong>{costeTotal.toFixed(2)}€</strong>
          </div>
          {data?.precios?.length > 0 && (
            <div className="rec-margins">
              {data.precios.map(p => {
                const margen = p.precio > 0 ? Math.round((1 - costeTotal / p.precio) * 100) : 0;
                return (
                  <span key={p.clave} className={`rec-margin ${margen < 40 ? "rec-margin--warn" : ""}`}>
                    {p.label}: {p.precio}€ → {margen}%
                  </span>
                );
              })}
            </div>
          )}
          <div className="rec-actions">
            <button className="sug-btn sug-btn--secondary" onClick={onClose}>Cancelar</button>
            <button className="sug-btn sug-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar receta"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function calcCosteUnitario(linea) {
  if (!linea.precioBase) return linea.costeUnitario || 0;
  const factor = linea.factorConversion || 1;
  const costePorUBase = linea.precioBase / factor;
  const uPP = (linea.unidadProveedor || "").toLowerCase();
  const uR = (linea.unidad || "ud").toLowerCase();
  if (uPP === "kg" && uR === "g") return costePorUBase / 1000;
  if (uPP === "kg" && uR === "kg") return costePorUBase;
  if (uPP === "litro" && uR === "ml") return costePorUBase / 1000;
  if (uPP === "litro" && uR === "cl") return costePorUBase / 100;
  if (uPP === "litro" && uR === "litro") return costePorUBase;
  return costePorUBase;
}
