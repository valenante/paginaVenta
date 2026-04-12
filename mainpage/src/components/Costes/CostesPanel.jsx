// src/components/Costes/CostesPanel.jsx
// Panel de gestión de costes por variante de precio.
// Base del futuro módulo "Finanzas": precio coste → precio venta → ganancia.

import React, { useEffect, useMemo, useState } from "react";
import useCostes from "../../hooks/useCostes";
import "./CostesPanel.css";

const TABS = [
  { key: "plato", label: "Platos", emoji: "🍽️" },
  { key: "bebida", label: "Bebidas", emoji: "🥂" },
];

const FILTROS = [
  { key: "todos", label: "Todos" },
  { key: "sinCoste", label: "Sin coste" },
  { key: "margenBajo", label: "Margen < 40%" },
  { key: "negativo", label: "Negativos" },
];

const PAGE_SIZES = [12, 24, 48, 96];

const fmtMoney = (n) => `${(Number(n) || 0).toFixed(2)}€`;
const fmtPct = (n) => `${(Number(n) || 0).toFixed(1)}%`;

function margenClass(pct, negativo) {
  if (negativo) return "coste-margen--neg";
  if (pct >= 60) return "coste-margen--ok";
  if (pct >= 30) return "coste-margen--warn";
  return "coste-margen--bad";
}

function calcMargen(precio, coste) {
  const p = Number(precio) || 0;
  const c = Number(coste) || 0;
  const unit = p - c;
  const pct = p > 0 ? (unit / p) * 100 : 0;
  return { unit, pct, negativo: p > 0 && c > 0 && c > p };
}

const CostesPanel = () => {
  const [tab, setTab] = useState("plato");
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const {
    items, loading, error, saving,
    hasChanges, dirtyCount, dirty,
    setCosteLocal, discardChanges,
    getCosteActual, saveProducto, saveAll,
  } = useCostes({ tipo: tab });

  /* =====================================================
   * Reset de paginación al cambiar filtros / tipo
   * ===================================================== */
  useEffect(() => { setPage(1); }, [tab, search, filtro, categoriaFiltro, pageSize]);

  /* =====================================================
   * Categorías disponibles (para el dropdown)
   * ===================================================== */
  const categoriasDisponibles = useMemo(() => {
    const set = new Set();
    for (const p of items) {
      if (p.categoria) set.add(p.categoria);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  /* =====================================================
   * Lista filtrada (plana)
   * ===================================================== */
  const filtrados = useMemo(() => {
    const searchNorm = search.trim().toLowerCase();
    const out = [];

    for (const p of items) {
      if (searchNorm && !p.nombre?.toLowerCase().includes(searchNorm)) continue;
      if (categoriaFiltro !== "todas" && p.categoria !== categoriaFiltro) continue;

      if (filtro !== "todos") {
        const keep = (p.precios || []).some((pr) => {
          const coste = getCosteActual(p, pr.clave);
          const { pct, negativo } = calcMargen(pr.precio, coste);
          if (filtro === "sinCoste") return !coste || coste === 0;
          if (filtro === "margenBajo") return pr.precio > 0 && pct < 40;
          if (filtro === "negativo") return negativo;
          return true;
        });
        if (!keep) continue;
      }

      out.push(p);
    }

    // Ordenar: primero por categoría, luego por nombre
    out.sort((a, b) => {
      const c = String(a.categoria || "").localeCompare(String(b.categoria || ""));
      if (c !== 0) return c;
      return String(a.nombre || "").localeCompare(String(b.nombre || ""));
    });

    return out;
  }, [items, search, filtro, categoriaFiltro, getCosteActual]);

  /* =====================================================
   * Paginación
   * ===================================================== */
  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => filtrados.slice((pageSafe - 1) * pageSize, pageSafe * pageSize),
    [filtrados, pageSafe, pageSize]
  );

  const sinCosteCount = useMemo(
    () => filtrados.filter((p) => (p.precios || []).every((pr) => !getCosteActual(p, pr.clave))).length,
    [filtrados, getCosteActual]
  );

  /* =====================================================
   * Handlers
   * ===================================================== */
  const handleGuardarTodo = async () => {
    await saveAll();
  };

  /* =====================================================
   * Render
   * ===================================================== */
  return (
    <div className="costes-panel">
      {/* ===== HEADER ===== */}
      <div className="costes-panel__top">
        <div className="costes-panel__tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`costes-tab ${tab === t.key ? "is-active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>

        <div className="costes-panel__actions">
          {hasChanges && (
            <>
              <span className="costes-dirty-pill">
                {dirtyCount} cambio{dirtyCount !== 1 ? "s" : ""} pendiente{dirtyCount !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                className="costes-btn costes-btn--ghost"
                onClick={() => discardChanges()}
                disabled={saving}
              >
                Descartar
              </button>
            </>
          )}
          <button
            type="button"
            className="costes-btn costes-btn--primary"
            onClick={handleGuardarTodo}
            disabled={!hasChanges || saving}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      {/* ===== FILTROS ===== */}
      <div className="costes-panel__filters">
        <input
          type="text"
          className="costes-search"
          placeholder="Buscar producto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="costes-select"
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          title="Filtrar por categoría"
        >
          <option value="todas">Todas las categorías</option>
          {categoriasDisponibles.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="costes-filter-chips">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`costes-chip ${filtro === f.key ? "is-active" : ""}`}
              onClick={() => setFiltro(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="costes-panel__count">
          {filtrados.length} productos · {sinCosteCount} sin coste
        </div>
      </div>

      {/* ===== ESTADOS ===== */}
      {loading && <p className="costes-info">Cargando productos…</p>}
      {error && <p className="costes-error">{error}</p>}
      {!loading && filtrados.length === 0 && (
        <p className="costes-info">
          {items.length === 0
            ? "Todavía no hay productos de este tipo."
            : "Ningún producto coincide con los filtros actuales."}
        </p>
      )}

      {/* ===== GRID DE PRODUCTOS ===== */}
      {!loading && pageItems.length > 0 && (
        <div className="costes-grid">
          {pageItems.map((p) => (
            <ProductoCard
              key={p._id}
              producto={p}
              dirty={dirty[p._id] || {}}
              onChangeCoste={(clave, val) => setCosteLocal(p._id, clave, val)}
              onSave={() => saveProducto(p._id)}
              onDiscard={() => discardChanges(p._id)}
              saving={saving}
              getCosteActual={getCosteActual}
            />
          ))}
        </div>
      )}

      {/* ===== PAGINADOR ===== */}
      {!loading && filtrados.length > 0 && (
        <div className="costes-pager">
          <div className="costes-pager__info">
            Página {pageSafe} de {totalPages} · Mostrando {pageItems.length} de {filtrados.length}
          </div>

          <div className="costes-pager__controls">
            <button
              type="button"
              className="costes-btn costes-btn--tiny"
              onClick={() => setPage(1)}
              disabled={pageSafe <= 1}
            >« Primero</button>
            <button
              type="button"
              className="costes-btn costes-btn--tiny"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pageSafe <= 1}
            >‹ Anterior</button>
            <button
              type="button"
              className="costes-btn costes-btn--tiny"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageSafe >= totalPages}
            >Siguiente ›</button>
            <button
              type="button"
              className="costes-btn costes-btn--tiny"
              onClick={() => setPage(totalPages)}
              disabled={pageSafe >= totalPages}
            >Último »</button>
          </div>

          <div className="costes-pager__size">
            <label>Por página:</label>
            <select
              className="costes-select costes-select--sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

/* =====================================================
 * Card de producto (con todas sus variantes)
 * ===================================================== */
function ProductoCard({ producto, dirty, onChangeCoste, onSave, onDiscard, saving, getCosteActual }) {
  const precios = producto.precios || [];
  const hasDirty = Object.keys(dirty).length > 0;

  return (
    <div className={`costes-card ${hasDirty ? "is-dirty" : ""}`}>
      <div className="costes-card__head">
        <div className="costes-card__title">
          <div className="costes-card__name">{producto.nombre}</div>
          <div className="costes-card__cat">{producto.categoria || "(sin categoría)"}</div>
        </div>
        {producto.costeActualizadoAt && (
          <div className="costes-card__meta">
            {new Date(producto.costeActualizadoAt).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="costes-card__variants">
        {precios.length === 0 && (
          <div className="costes-variant costes-variant--empty">
            Sin variantes de precio configuradas.
          </div>
        )}
        {precios.map((pr) => {
          const coste = getCosteActual(producto, pr.clave);
          const { unit, pct, negativo } = calcMargen(pr.precio, coste);
          const cls = margenClass(pct, negativo);
          const isDirty = dirty[pr.clave] !== undefined;

          return (
            <div key={pr.clave} className={`costes-variant ${isDirty ? "is-dirty" : ""}`}>
              <div className="costes-variant__label">
                <span className="costes-variant__name">{pr.label}</span>
                <span className="costes-variant__precio">{fmtMoney(pr.precio)}</span>
              </div>

              <div className="costes-variant__input">
                <label className="costes-variant__input-label">Coste</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={coste === 0 && !isDirty ? "" : coste}
                  placeholder="0.00"
                  onChange={(e) => onChangeCoste(pr.clave, e.target.value)}
                />
                <span className="costes-variant__unit">€</span>
              </div>

              <div className={`costes-variant__margen ${cls}`}>
                <span className="costes-variant__margen-unit">{fmtMoney(unit)}</span>
                <span className="costes-variant__margen-pct">{fmtPct(pct)}</span>
                {negativo && <span className="costes-variant__warn">⚠ Precio &lt; coste</span>}
              </div>
            </div>
          );
        })}
      </div>

      {hasDirty && (
        <div className="costes-card__actions">
          <button
            type="button"
            className="costes-btn costes-btn--ghost costes-btn--tiny"
            onClick={onDiscard}
            disabled={saving}
          >
            Deshacer
          </button>
          <button
            type="button"
            className="costes-btn costes-btn--primary costes-btn--tiny"
            onClick={onSave}
            disabled={saving}
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}

export default CostesPanel;
