// src/components/Costes/RecetaModal.jsx
// Modal de receta con soporte de variantes (clavePrecio).
// Si el producto tiene >1 precio, agrupa ingredientes por variante.
// Si tiene 1 solo precio, UI plana como antes.

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  const [searchForVariant, setSearchForVariant] = useState(null); // null = no search, string = clavePrecio

  const precios = data?.precios || [];
  const multiVariante = precios.length > 1;

  useEffect(() => {
    if (data?.receta) setLineas(data.receta.map((r, i) => ({ ...r, _key: i })));
  }, [data]);

  // ── Búsqueda de ingredientes ──
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

  const addIngrediente = (pp, clavePrecio) => {
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
      clavePrecio: clavePrecio || null,
    }]);
    setSearchForVariant(null);
    setSearchQ("");
  };

  const updateLinea = (idx, field, value) => {
    setLineas(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const updated = { ...l, [field]: value };
      const costeUd = calcCosteUnitario(updated);
      updated.costeUnitario = costeUd;
      updated.costeLinea = Math.round(updated.cantidad * costeUd * 100) / 100;
      return updated;
    }));
  };

  const removeLinea = (idx) => setLineas(prev => prev.filter((_, i) => i !== idx));

  // ── Costes por variante ──
  const costesPorVariante = useMemo(() => {
    if (!multiVariante) {
      const total = lineas.reduce((s, l) => s + (l.costeLinea || 0), 0);
      return { _all: total };
    }
    const map = {};
    for (const p of precios) map[p.clave] = 0;
    for (const l of lineas) {
      const key = l.clavePrecio || "_universal";
      map[key] = (map[key] || 0) + (l.costeLinea || 0);
    }
    // Distribuir universales a cada variante
    const universal = map._universal || 0;
    delete map._universal;
    for (const p of precios) {
      map[p.clave] = Math.round(((map[p.clave] || 0) + universal) * 100) / 100;
    }
    return map;
  }, [lineas, precios, multiVariante]);

  const costeTotalGlobal = lineas.reduce((s, l) => s + (l.costeLinea || 0), 0);

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

  // ── Navegar al PP del ingrediente ──
  const handleIngredienteClick = useCallback((linea) => {
    if (!linea.productoProveedorId || !linea.proveedorId) {
      alert("Este ingrediente no tiene proveedor asociado.");
      return;
    }
    window.open(`/configuracion/proveedores/${linea.proveedorId}/productos?pp=${linea.productoProveedorId}`, "_blank");
  }, []);

  // ── Render helpers ──
  const renderLinea = (l, globalIdx) => (
    <div key={l._key || globalIdx} className="rec-table__row">
      <span className="rec-ing-name rec-ing-name--link" onClick={() => handleIngredienteClick(l)}>{l.nombre}</span>
      <span>
        <input
          type="number"
          className="rec-input"
          value={l.cantidad}
          min="0"
          step="any"
          onChange={e => updateLinea(globalIdx, "cantidad", Number(e.target.value) || 0)}
        />
      </span>
      <span>
        <select className="rec-select" value={l.unidad} onChange={e => updateLinea(globalIdx, "unidad", e.target.value)}>
          {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </span>
      <span className="rec-cost">{l.costeUnitario?.toFixed(4)}€</span>
      <span className="rec-cost rec-cost--total">{l.costeLinea?.toFixed(2)}€</span>
      <span>
        <button className="rec-remove" onClick={() => removeLinea(globalIdx)}>✕</button>
      </span>
    </div>
  );

  const renderSearchBlock = (clavePrecio) => {
    if (searchForVariant !== clavePrecio) {
      return (
        <button className="rec-add-btn" onClick={() => { setSearchForVariant(clavePrecio); setSearchQ(""); }}>
          + Añadir ingrediente
        </button>
      );
    }
    return (
      <div className="rec-search">
        <input
          type="text"
          className="rec-search__input"
          placeholder="Buscar ingrediente..."
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          autoFocus
        />
        {searching && <div className="rec-search__loading">Buscando...</div>}
        {searchResults.length > 0 && (
          <div className="rec-search__results">
            {searchResults.map(pp => (
              <button key={pp._id} className="rec-search__item" onClick={() => addIngrediente(pp, clavePrecio)}>
                <span className="rec-search__name">{pp.nombre}</span>
                <span className="rec-search__meta">{pp.precioBase}€/{pp.unidad} | {pp.formato}</span>
              </button>
            ))}
          </div>
        )}
        <button className="rec-search__cancel" onClick={() => { setSearchForVariant(null); setSearchQ(""); }}>Cancelar</button>
      </div>
    );
  };

  const renderMargen = (clave, precio) => {
    const coste = costesPorVariante[clave] || 0;
    const margen = precio > 0 ? Math.round((1 - coste / precio) * 100) : 0;
    return (
      <div className="rec-variant-summary">
        <span>Coste: <strong>{coste.toFixed(2)}€</strong></span>
        <span className={`rec-margin ${margen < 40 ? "rec-margin--warn" : ""}`}>
          Margen: {(precio - coste).toFixed(2)}€ ({margen}%)
        </span>
      </div>
    );
  };

  if (loading) return createPortal(
    <div className="rec-overlay">
      <div className="rec-modal">
        <div className="rec-loading">Cargando receta...</div>
      </div>
    </div>,
    document.body
  );

  return createPortal(
    <div className="rec-overlay">
      <div className="rec-modal">
        <div className="rec-header">
          <h3>📋 Receta: {productoNombre}</h3>
          <button className="rec-close" onClick={onClose}>✕</button>
        </div>

        <div className="rec-body">
          {multiVariante ? (
            /* ── Multi-variante: sección por cada precio ── */
            precios.map(p => {
              const variantLineas = lineas
                .map((l, globalIdx) => ({ ...l, _globalIdx: globalIdx }))
                .filter(l => l.clavePrecio === p.clave);

              return (
                <div key={p.clave} className="rec-variant-section">
                  <div className="rec-variant-header">
                    <span className="rec-variant-label">{p.label || p.clave}</span>
                    <span className="rec-variant-price">{p.precio}€</span>
                  </div>

                  {variantLineas.length > 0 && (
                    <div className="rec-table">
                      <div className="rec-table__head">
                        <span>Ingrediente</span>
                        <span>Cantidad</span>
                        <span>Unidad</span>
                        <span>Coste/ud</span>
                        <span>Coste línea</span>
                        <span></span>
                      </div>
                      {variantLineas.map(l => renderLinea(l, l._globalIdx))}
                    </div>
                  )}

                  {variantLineas.length === 0 && (
                    <p className="rec-empty-sm">Sin ingredientes para esta variante.</p>
                  )}

                  {renderSearchBlock(p.clave)}
                  {renderMargen(p.clave, p.precio)}
                </div>
              );
            })
          ) : (
            /* ── Precio único: UI plana ── */
            <>
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
                  {lineas.map((l, i) => renderLinea(l, i))}
                </div>
              )}
              {lineas.length === 0 && (
                <p className="rec-empty">No hay ingredientes. Añade el primer ingrediente para definir la receta.</p>
              )}
              {renderSearchBlock(null)}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="rec-footer">
          {!multiVariante && (
            <>
              <div className="rec-total">
                <span>Coste total receta:</span>
                <strong>{costeTotalGlobal.toFixed(2)}€</strong>
              </div>
              {precios.length > 0 && (
                <div className="rec-margins">
                  {precios.map(p => {
                    const margen = p.precio > 0 ? Math.round((1 - costeTotalGlobal / p.precio) * 100) : 0;
                    return (
                      <span key={p.clave} className={`rec-margin ${margen < 40 ? "rec-margin--warn" : ""}`}>
                        {p.label}: {p.precio}€ → {margen}%
                      </span>
                    );
                  })}
                </div>
              )}
            </>
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
