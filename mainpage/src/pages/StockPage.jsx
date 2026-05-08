// src/pages/StockPage.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useFeaturesPlan } from "../context/FeaturesPlanContext";
import { useToast } from "../context/ToastContext";

import AjustarStockModal from "../components/Stock/AjustarStockModal";
import CrearIngredienteModal from "../components/Stock/CrearIngredienteModal";
import UpsellStock from "../components/Stock/UpsellStock";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import EditarIngredienteModal from "../components/Stock/EditarIngredienteModal";
import HistorialMovimientosModal from "../components/Stock/HistorialMovimientosModal";
import LotesView from "../components/Stock/LotesView.jsx";
import { formatStock } from "../utils/stockFormat";

import "../styles/StockPage.css";

const ITEMS_PER_PAGE = 12;

/* ================================================================
   Helpers
================================================================ */
const getEstadoIng = (it) => {
  if (it.stockActual <= (it.stockCritico ?? 0)) return "critico";
  if (it.stockActual <= (it.stockMinimo ?? 0)) return "bajo";
  return "ok";
};

// Fix #10: removed magic "stock <= 3" threshold
const getEstadoProd = (p) => {
  if (p.estado === "agotado") return "agotado";
  if (p.stock <= 0) return "agotado";
  if (p.stockCritico > 0 && p.stock <= p.stockCritico) return "critico";
  if (p.stockMinimo > 0 && p.stock <= p.stockMinimo) return "bajo";
  return "ok";
};

/* ================================================================
   Component
================================================================ */
const StockPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { hasFeature } = useFeaturesPlan();
  const hasStockAvanzado = hasFeature("stock_avanzado");

  // ── Tab ──
  const [tab, setTab] = useState("productos");

  // ── State: ingredientes ──
  const [loading, setLoading] = useState(true);
  const [ingredientes, setIngredientes] = useState([]);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalIngCount, setTotalIngCount] = useState(0);

  // ── State: productos con stock ──
  const [prodLoading, setProdLoading] = useState(true);
  const [prodError, setProdError] = useState(null);
  const [productos, setProductos] = useState([]);
  const [prodSearch, setProdSearch] = useState("");
  const [prodFiltro, setProdFiltro] = useState("todos");
  const [prodEditing, setProdEditing] = useState(null);
  const [prodConfiguring, setProdConfiguring] = useState(null);
  const [prodSaving, setProdSaving] = useState(null);
  const [prodPage, setProdPage] = useState(1);
  const [prodTipo, setProdTipo] = useState("todos"); // todos, plato, bebida
  const [selectedCat, setSelectedCat] = useState(null); // null = vista categorías, string = vista productos
  const PROD_PER_PAGE = 50;

  // ── AbortControllers ──
  const ingControllerRef = useRef(null);
  const prodControllerRef = useRef(null);
  const flashTimerRef = useRef(null);

  // ── Lotes (unificación): resumen + mapa por item para indicadores en filas ──
  const [lotesPorItem, setLotesPorItem] = useState(new Map()); // itemId → { proximos, caducados, total, proxMinDias }
  const [lotesResumen, setLotesResumen] = useState({ proximos: 0, caducados: 0 });

  const fetchLotesResumen = useCallback(async () => {
    try {
      const { data } = await api.get("/stock/lotes", {
        params: { soloActivos: true },
      });
      const items = data?.items || [];
      const map = new Map();
      let proximos = 0;
      let caducados = 0;
      for (const l of items) {
        const k = String(l.itemId);
        if (!map.has(k)) {
          map.set(k, { proximos: 0, caducados: 0, total: 0, proxMinDias: null });
        }
        const e = map.get(k);
        e.total += 1;
        if (l.estadoCaducidad === "proximo") {
          e.proximos += 1;
          proximos += 1;
          if (e.proxMinDias == null || l.diasHastaCaducidad < e.proxMinDias) {
            e.proxMinDias = l.diasHastaCaducidad;
          }
        }
        if (l.estadoCaducidad === "caducado") {
          e.caducados += 1;
          caducados += 1;
        }
      }
      setLotesPorItem(map);
      setLotesResumen({ proximos, caducados });
    } catch {
      // silencioso: si no hay lotes o falla el feature, no contaminamos la UI
      setLotesPorItem(new Map());
      setLotesResumen({ proximos: 0, caducados: 0 });
    }
  }, []);

  useEffect(() => {
    fetchLotesResumen();
  }, [fetchLotesResumen]);

  // ── Umbrales inteligentes ──
  const [thresholdsMode, setThresholdsMode] = useState("sugerir"); // off, sugerir, auto
  const [sugerenciasMap, setSugerenciasMap] = useState(new Map()); // itemId → sugerencia
  const [sugerenciasLoading, setSugerenciasLoading] = useState(false);
  const [showUmbralesModal, setShowUmbralesModal] = useState(false);
  const [sugerenciasList, setSugerenciasList] = useState([]);

  const fetchSugerencias = useCallback(async () => {
    setSugerenciasLoading(true);
    try {
      const [configRes, sugRes] = await Promise.all([
        api.get("/config/automations").catch(() => ({ data: { data: { automations: {} } } })),
        api.get("/stock/umbrales-sugeridos").catch(() => ({ data: { data: { items: [] } } })),
      ]);
      const mode = configRes.data?.data?.automations?.autoThresholdsMode || "sugerir";
      setThresholdsMode(mode);

      const items = sugRes.data?.data?.items || [];
      setSugerenciasList(items);
      const map = new Map();
      for (const s of items) map.set(s.itemId, s);
      setSugerenciasMap(map);
    } catch { /* silent */ }
    finally { setSugerenciasLoading(false); }
  }, []);

  useEffect(() => { fetchSugerencias(); }, [fetchSugerencias]);

  const aplicarUmbral = useCallback(async (item) => {
    try {
      await api.post("/stock/umbrales-sugeridos/aplicar", { items: [item] });
      showToast("Umbrales aplicados para " + item.nombre, "success");
      // Refresh products + sugerencias
      if (item.itemType === "producto") fetchProductos(); else fetchStock();
      fetchSugerencias();
    } catch { showToast("Error al aplicar umbrales", "error"); }
  }, [fetchSugerencias]);

  const ignorarUmbral = useCallback(async (item) => {
    try {
      const endpoint = item.itemType === "ingrediente" ? `/stock/ingrediente/${item.itemId}` : `/productos/${item.itemId}`;
      await api.put(endpoint, { umbralManual: true });
      // Remove from suggestions
      setSugerenciasMap((prev) => { const next = new Map(prev); next.delete(item.itemId); return next; });
      showToast("Umbral marcado como manual para " + item.nombre, "info");
    } catch { showToast("Error", "error"); }
  }, []);

  const aplicarTodosUmbrales = useCallback(async (items) => {
    try {
      await api.post("/stock/umbrales-sugeridos/aplicar", { items });
      showToast(`Umbrales aplicados para ${items.length} productos`, "success");
      setShowUmbralesModal(false);
      fetchProductos(); fetchStock(); fetchSugerencias();
    } catch { showToast("Error al aplicar umbrales", "error"); }
  }, [fetchSugerencias]);

  // ── Counters for tab badges (fix #11: use total from server for ingredients) ──
  const ingCriticos = useMemo(
    () => ingredientes.filter((i) => getEstadoIng(i) === "critico").length,
    [ingredientes]
  );
  const prodAlertas = useMemo(
    () => productos.filter((p) => ["agotado", "critico"].includes(getEstadoProd(p))).length,
    [productos]
  );

  /* ================================================================
     Fetch: ingredientes (fix #4 + #5)
  ================================================================ */
  const fetchStock = useCallback(async () => {
    ingControllerRef.current?.abort();
    const controller = new AbortController();
    ingControllerRef.current = controller;

    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/stock/ingredientes", {
        params: { page, limit: ITEMS_PER_PAGE, search },
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setIngredientes(data.ingredientes || []);
      setTotalPages(data.totalPages || 1);
      setTotalIngCount(data.total || 0);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setError(err?.response?.data?.message || "No se pudo cargar el stock.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchStock();
    return () => ingControllerRef.current?.abort();
  }, [fetchStock]);

  /* ================================================================
     Fetch: productos con controlStock (fix #1 + #2)
  ================================================================ */
  const fetchProductos = useCallback(async () => {
    prodControllerRef.current?.abort();
    const controller = new AbortController();
    prodControllerRef.current = controller;

    setProdLoading(true);
    setProdError(null);
    try {
      const { data } = await api.get("/productos", {
        params: { controlStock: true, limit: 200 },
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const items = Array.isArray(data) ? data : [];
      setProductos(items);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setProductos([]);
      setProdError("No se pudieron cargar los productos con stock.");
    } finally {
      if (!controller.signal.aborted) setProdLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductos();
    return () => prodControllerRef.current?.abort();
  }, [fetchProductos]);

  /* ================================================================
     Helpers
  ================================================================ */
  const ingredientesFiltrados = useMemo(() => {
    if (estadoFiltro === "todos") return ingredientes;
    return ingredientes.filter((ing) => getEstadoIng(ing) === estadoFiltro);
  }, [ingredientes, estadoFiltro]);

  const productosFiltrados = useMemo(() => {
    let arr = productos;
    if (prodTipo !== "todos") {
      arr = arr.filter((p) => p.tipo === prodTipo);
    }
    if (prodSearch) {
      const q = prodSearch.toLowerCase();
      arr = arr.filter((p) => p.nombre?.toLowerCase().includes(q) || p.categoria?.toLowerCase().includes(q));
    }
    if (prodFiltro !== "todos") {
      arr = arr.filter((p) => getEstadoProd(p) === prodFiltro);
    }
    if (selectedCat) {
      arr = arr.filter((p) => (p.categoria || "Sin categoría") === selectedCat);
    }
    return arr;
  }, [productos, prodSearch, prodFiltro, prodTipo, selectedCat]);

  // Categorías con contadores (para vista de cards de categorías)
  const categorias = useMemo(() => {
    let arr = productos;
    if (prodTipo !== "todos") arr = arr.filter((p) => p.tipo === prodTipo);
    if (prodFiltro !== "todos") arr = arr.filter((p) => getEstadoProd(p) === prodFiltro);
    const map = {};
    for (const p of arr) {
      const cat = p.categoria || "Sin categoría";
      if (!map[cat]) map[cat] = { nombre: cat, total: 0, bajo: 0, critico: 0, agotado: 0 };
      map[cat].total++;
      const est = getEstadoProd(p);
      if (est === "bajo") map[cat].bajo++;
      if (est === "critico") map[cat].critico++;
      if (est === "agotado") map[cat].agotado++;
    }
    return Object.values(map).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productos, prodTipo, prodFiltro]);

  const prodTotalPages = Math.max(1, Math.ceil(productosFiltrados.length / PROD_PER_PAGE));
  const productosPaginados = productosFiltrados.slice((prodPage - 1) * PROD_PER_PAGE, prodPage * PROD_PER_PAGE);

  // Fix #6: flash with cleanup
  const showFlash = useCallback((msg) => {
    setFlash(msg);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(""), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  /* ================================================================
     Actions: ingredientes
  ================================================================ */
  const eliminarIngrediente = async (id) => {
    try {
      await api.delete(`/stock/ingrediente/${id}`);
      showFlash("Ingrediente eliminado");
      fetchStock();
      setModal(null);
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Error eliminando el ingrediente.",
        "error"
      );
    }
  };

  /* ================================================================
     Actions: productos stock (fix #7: optimistic update)
  ================================================================ */
  const guardarStockProducto = async (prod) => {
    const nuevoStock = Number(prodEditing?.stock);
    if (!Number.isFinite(nuevoStock) || nuevoStock < 0) return;

    setProdSaving(prod._id);
    try {
      await api.put(`/productos/${prod._id}`, { stock: nuevoStock });

      // Optimistic local update
      setProductos((prev) =>
        prev.map((p) =>
          p._id === prod._id ? { ...p, stock: nuevoStock } : p
        )
      );
      showFlash(`Stock de "${prod.nombre}" actualizado`);
      setProdEditing(null);
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Error guardando stock.",
        "error"
      );
    } finally {
      setProdSaving(null);
    }
  };

  const guardarUmbralesProducto = async (prod) => {
    const min = Number(prodConfiguring?.stockMinimo ?? 0);
    const crit = Number(prodConfiguring?.stockCritico ?? 0);
    const max = Number(prodConfiguring?.stockMax ?? 0);

    if (crit > min) {
      showToast("Stock critico no puede ser mayor que stock minimo.", "error");
      return;
    }
    if (max > 0 && min > max) {
      showToast("Stock minimo no puede ser mayor que stock maximo.", "error");
      return;
    }

    setProdSaving(prod._id);
    try {
      await api.put(`/productos/${prod._id}`, {
        stockMinimo: min,
        stockCritico: crit,
        stockMax: max,
      });

      // Optimistic local update
      setProductos((prev) =>
        prev.map((p) =>
          p._id === prod._id
            ? { ...p, stockMinimo: min, stockCritico: crit, stockMax: max }
            : p
        )
      );
      showFlash(`Umbrales de "${prod.nombre}" actualizados`);
      setProdConfiguring(null);
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Error guardando umbrales.",
        "error"
      );
    } finally {
      setProdSaving(null);
    }
  };

  /* ================================================================
     Render
  ================================================================ */
  return (
    <div className="stock-root">
      {/* ── HEADER ── */}
      <header className="stock-header">
        <div className="stock-header-top">
          <div>
            <h2>Stock inteligente</h2>
            <p>ALEF calcula umbrales óptimos basándose en tu consumo real.</p>
          </div>

          {/* ── KPI PILLS ── */}
          <div className="stock-kpis">
            <div className="stock-kpi">
              <span className="stock-kpi-value">{productos.length}</span>
              <span className="stock-kpi-label">Productos</span>
            </div>
            <div className="stock-kpi">
              <span className="stock-kpi-value">{totalIngCount || ingredientes.length}</span>
              <span className="stock-kpi-label">Ingredientes</span>
            </div>
            {(prodAlertas > 0 || ingCriticos > 0) && (
              <div className="stock-kpi stock-kpi--alert">
                <span className="stock-kpi-value">{prodAlertas + ingCriticos}</span>
                <span className="stock-kpi-label">Alertas</span>
              </div>
            )}
          </div>
        </div>

        {/* ── TABS ── */}
        <nav className="stock-tabs">
          <button
            className={`stock-tab ${tab === "productos" ? "active" : ""}`}
            onClick={() => setTab("productos")}
          >
            Stock directo
            {prodAlertas > 0 && <span className="stock-tab-badge stock-tab-badge--red">{prodAlertas}</span>}
          </button>
          {hasStockAvanzado && (
            <>
              <button
                className={`stock-tab ${tab === "ingredientes" ? "active" : ""}`}
                onClick={() => setTab("ingredientes")}
              >
                Ingredientes
                {ingCriticos > 0 && <span className="stock-tab-badge stock-tab-badge--red">{ingCriticos}</span>}
              </button>
              <button
                className={`stock-tab ${tab === "lotes" ? "active" : ""}`}
                onClick={() => setTab("lotes")}
              >
                🧪 Lotes
                {lotesResumen.caducados > 0 && (
                  <span className="stock-tab-badge stock-tab-badge--red">
                    {lotesResumen.caducados}
                  </span>
                )}
                {lotesResumen.caducados === 0 && lotesResumen.proximos > 0 && (
                  <span className="stock-tab-badge stock-tab-badge--amber">
                    {lotesResumen.proximos}
                  </span>
                )}
              </button>
            </>
          )}
        </nav>
      </header>

      {/* ── FLASH ── */}
      {flash && <div className="stock-flash">{flash}</div>}

      {/* ── UPSELL — solo fuera de stock directo ── */}
      {!hasStockAvanzado && tab !== "productos" && (
        <div className="stock-upsell-wrapper">
          <UpsellStock />
        </div>
      )}

      {/* ================================================================
         TAB: PRODUCTOS CON STOCK DIRECTO
      ================================================================ */}
      {tab === "productos" && (
        <>
          {/* toolbar */}
          <div className="stock-toolbar">
            {thresholdsMode !== "off" && sugerenciasList.filter(s => s.cambio).length > 0 && (
              <button
                className="btn-nuevo"
                onClick={() => setShowUmbralesModal(true)}
                title="ALEF sugiere umbrales para tus productos"
              >
                🤖 Umbrales inteligentes ({sugerenciasList.filter(s => s.cambio).length})
              </button>
            )}
            <input
              className="stock-search"
              placeholder="Buscar producto o categoría…"
              value={prodSearch}
              onChange={(e) => { setProdSearch(e.target.value); setProdPage(1); }}
            />

            <div className="stock-header-filtros">
              {[
                ["todos", "Todos"],
                ["plato", "🍽️ Platos"],
                ["bebida", "🥂 Bebidas"],
              ].map(([key, label]) => (
                <button
                  key={`tipo-${key}`}
                  type="button"
                  className={`btn-toggle ${prodTipo === key ? "active" : ""}`}
                  onClick={() => { setProdTipo(key); setSelectedCat(null); setProdPage(1); }}
                >
                  {label}
                </button>
              ))}
              <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
              {[
                ["todos", "Todos"],
                ["ok", "Disponible"],
                ["bajo", "Bajo"],
                ["critico", "Critico"],
                ["agotado", "Agotado"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`btn-toggle ${prodFiltro === key ? "active" : ""}`}
                  onClick={() => { setProdFiltro(key); setSelectedCat(null); setProdPage(1); }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="stock-tab-desc">
            Productos con control de stock activo. El stock se descuenta automáticamente con cada pedido.
            Cuando llega a 0, el producto se marca como <strong>agotado</strong> en la carta.
          </p>

          {/* Fix #2: error state for productos */}
          {prodError && (
            <div className="stock-error">
              <span>{prodError}</span>
              <button className="stock-error-retry" onClick={fetchProductos}>Reintentar</button>
            </div>
          )}

          {prodLoading ? (
            <div className="stock-loading">Cargando productos…</div>
          ) : !prodError && productosFiltrados.length === 0 ? (
            <div className="stock-empty">
              <p>
                {productos.length === 0
                  ? "No hay productos con control de stock activado."
                  : "No hay productos que coincidan con el filtro."}
              </p>
              {productos.length === 0 && (
                <p className="stock-empty-hint">
                  Activa «Control de stock» en la edición de un producto para que aparezca aquí.
                </p>
              )}
            </div>
          ) : !selectedCat ? (
            /* Vista de categorías (cards) */
            <div className="stock-cat-grid">
              {categorias.map((cat) => (
                <button
                  key={cat.nombre}
                  className="stock-cat-card"
                  onClick={() => { setSelectedCat(cat.nombre); setProdPage(1); }}
                >
                  <span className="stock-cat-card__name">{cat.nombre}</span>
                  <span className="stock-cat-card__count">{cat.total} producto{cat.total !== 1 ? "s" : ""}</span>
                  {(cat.bajo > 0 || cat.critico > 0 || cat.agotado > 0) && (
                    <div className="stock-cat-card__alerts">
                      {cat.agotado > 0 && <span className="stock-cat-alert stock-cat-alert--agotado">{cat.agotado} agotado{cat.agotado > 1 ? "s" : ""}</span>}
                      {cat.critico > 0 && <span className="stock-cat-alert stock-cat-alert--critico">{cat.critico} crítico{cat.critico > 1 ? "s" : ""}</span>}
                      {cat.bajo > 0 && <span className="stock-cat-alert stock-cat-alert--bajo">{cat.bajo} bajo{cat.bajo > 1 ? "s" : ""}</span>}
                    </div>
                  )}
                </button>
              ))}
              {categorias.length === 0 && <div className="stock-empty-state">No hay categorías para estos filtros.</div>}
            </div>
          ) : (
            /* Vista de productos de una categoría */
            <>
              <button className="stock-back-cat" onClick={() => setSelectedCat(null)}>← Volver a categorías</button>
              <h3 className="stock-cat-title">{selectedCat} <span className="stock-cat-count">{productosFiltrados.length}</span></h3>
              <div className="stock-grid stock-grid--productos">
              {productosPaginados.map((prod) => {
                const estado = getEstadoProd(prod);
                const isEditing = prodEditing?._id === prod._id;
                const isConfiguring = prodConfiguring?._id === prod._id;
                const porcentaje = prod.stockMax > 0
                  ? Math.min(100, Math.max(0, ((prod.stock ?? 0) / prod.stockMax) * 100))
                  : 0;

                return (
                  <div key={prod._id} className={`stock-card stock-card--prod estado-${estado}`}>
                    {/* header */}
                    <div className="stock-card-header">
                      <div className="stock-prod-info">
                        <span className="stock-name">{prod.nombre}</span>
                        <span className="stock-prod-cat">{prod.categoria}</span>
                      </div>
                      <span className={`estado-badge ${estado}`}>
                        {estado === "ok" && "Disponible"}
                        {estado === "bajo" && "Bajo"}
                        {estado === "critico" && "Critico"}
                        {estado === "agotado" && "Agotado"}
                      </span>
                    </div>

                    {/* Indicador de lotes (unificación Fase 5) */}
                    {(() => {
                      const info = lotesPorItem.get(String(prod._id));
                      if (!info) return null;
                      if (info.caducados > 0) {
                        return (
                          <button
                            type="button"
                            className="stock-lote-badge stock-lote-badge--rojo"
                            onClick={() => setTab("lotes")}
                            title="Ver en pestaña Lotes"
                          >
                            🧪 {info.caducados} lote{info.caducados === 1 ? "" : "s"} caducado{info.caducados === 1 ? "" : "s"}
                          </button>
                        );
                      }
                      if (info.proximos > 0) {
                        return (
                          <button
                            type="button"
                            className="stock-lote-badge stock-lote-badge--amber"
                            onClick={() => setTab("lotes")}
                            title="Ver en pestaña Lotes"
                          >
                            🧪 {info.proximos} lote{info.proximos === 1 ? "" : "s"} en {info.proxMinDias}d
                          </button>
                        );
                      }
                      return null;
                    })()}

                    {/* progress bar */}
                    {prod.stockMax > 0 && (
                      <div className="stock-bar">
                        <div
                          className="stock-bar-fill"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    )}

                    {/* stock value */}
                    <div className="stock-prod-value">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="stock-prod-input"
                          value={prodEditing.stock}
                          onChange={(e) =>
                            setProdEditing((prev) => ({ ...prev, stock: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") guardarStockProducto(prod);
                            if (e.key === "Escape") setProdEditing(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className={`stock-prod-number ${estado}`} title={`${prod.stock ?? 0} unidades exactas`}>
                          {formatStock(prod.stock ?? 0, prod.precios)}
                        </span>
                      )}
                      {!(prod.precios || []).some((p) => Number(p?.factorStock) > 0 && Number(p.factorStock) < 1) && (
                        <span className="stock-prod-unit">uds</span>
                      )}
                      {prod.stockMax > 0 && (
                        <span className="max">max: {prod.stockMax}</span>
                      )}
                    </div>

                    {/* thresholds display */}
                    {(prod.stockMinimo > 0 || prod.stockCritico > 0) && !isConfiguring && (
                      <div className="stock-thresholds">
                        {prod.stockCritico > 0 && (
                          <span className="stock-threshold critico">Critico: &le;{prod.stockCritico}</span>
                        )}
                        {prod.stockMinimo > 0 && (
                          <span className="stock-threshold bajo">Minimo: &le;{prod.stockMinimo}</span>
                        )}
                      </div>
                    )}

                    {/* threshold config form */}
                    {isConfiguring && (
                      <div className="stock-config-form">
                        <label>
                          <span>Stock critico</span>
                          <input
                            type="number" min="0" step="1"
                            value={prodConfiguring.stockCritico}
                            onChange={(e) => setProdConfiguring((prev) => ({ ...prev, stockCritico: e.target.value }))}
                          />
                        </label>
                        <label>
                          <span>Stock minimo</span>
                          <input
                            type="number" min="0" step="1"
                            value={prodConfiguring.stockMinimo}
                            onChange={(e) => setProdConfiguring((prev) => ({ ...prev, stockMinimo: e.target.value }))}
                          />
                        </label>
                        <label>
                          <span>Stock maximo</span>
                          <input
                            type="number" min="0" step="1"
                            value={prodConfiguring.stockMax}
                            onChange={(e) => setProdConfiguring((prev) => ({ ...prev, stockMax: e.target.value }))}
                          />
                        </label>
                        <div className="stock-config-form-actions">
                          <button
                            className="btn-ajustar"
                            onClick={() => guardarUmbralesProducto(prod)}
                            disabled={prodSaving === prod._id}
                          >
                            {prodSaving === prod._id ? "Guardando…" : "Guardar"}
                          </button>
                          <button
                            className="btn-editar"
                            onClick={() => setProdConfiguring(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* actions */}
                    <div className="stock-card-actions">
                      {isEditing ? (
                        <>
                          <button
                            className="btn-ajustar"
                            onClick={() => guardarStockProducto(prod)}
                            disabled={prodSaving === prod._id}
                          >
                            {prodSaving === prod._id ? "Guardando…" : "Guardar"}
                          </button>
                          <button
                            className="btn-editar"
                            onClick={() => setProdEditing(null)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn-ajustar"
                            onClick={() =>
                              setProdEditing({ _id: prod._id, stock: prod.stock ?? 0 })
                            }
                          >
                            Ajustar stock
                          </button>
                          {!isConfiguring && (
                            <button
                              className="btn-editar"
                              onClick={() =>
                                setProdConfiguring({
                                  _id: prod._id,
                                  stockMinimo: prod.stockMinimo ?? 0,
                                  stockCritico: prod.stockCritico ?? 0,
                                  stockMax: prod.stockMax ?? 0,
                                })
                              }
                            >
                              Umbrales
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Sugerencia inteligente */}
                    {thresholdsMode !== "off" && (() => {
                      const sug = sugerenciasMap.get(String(prod._id));
                      if (!sug || !sug.cambio) return null;
                      if (thresholdsMode === "auto") {
                        return (
                          <div className="stock-sug stock-sug--auto">
                            <span className="stock-sug__label">🤖 Gestionado por ALEF</span>
                            <span className="stock-sug__detail">mín {sug.sugerido.minimo} | máx {sug.sugerido.maximo} ({sug.consumoDiario}/día)</span>
                          </div>
                        );
                      }
                      return (
                        <div className="stock-sug">
                          <span className="stock-sug__label">🤖 ALEF sugiere: mín {sug.sugerido.minimo} | máx {sug.sugerido.maximo}</span>
                          <span className="stock-sug__detail">{sug.consumoDiario}/día × {sug.leadTime}d lead time</span>
                          <div className="stock-sug__actions">
                            <button className="stock-sug__btn stock-sug__btn--apply" onClick={() => aplicarUmbral(sug)}>Aplicar</button>
                            <button className="stock-sug__btn stock-sug__btn--ignore" onClick={() => ignorarUmbral(sug)}>Ignorar</button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
              </div>
            </>
          )}

          {/* Paginación productos */}
          {prodTotalPages > 1 && (
            <div className="stock-pagination">
              <button
                disabled={prodPage <= 1}
                onClick={() => setProdPage((p) => p - 1)}
              >
                ← Anterior
              </button>
              <span>
                {prodPage} / {prodTotalPages} · {productosFiltrados.length} productos
              </span>
              <button
                disabled={prodPage >= prodTotalPages}
                onClick={() => setProdPage((p) => p + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* ================================================================
         TAB: INGREDIENTES
      ================================================================ */}
      {hasStockAvanzado && tab === "ingredientes" && (
        <>
          {/* toolbar */}
          <div className="stock-toolbar">
            <button
              className="btn-nuevo"
              onClick={() => setModal({ type: "crear" })}
            >
              + Nuevo ingrediente
            </button>

            <input
              className="stock-search"
              placeholder="Buscar ingrediente…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <div className="stock-header-filtros">
              {[
                ["todos", "Todos"],
                ["ok", "Óptimo"],
                ["bajo", "Bajo"],
                ["critico", "Crítico"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`btn-toggle ${estadoFiltro === key ? "active" : ""}`}
                  onClick={() => {
                    setEstadoFiltro(key);
                    setPage(1);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="stock-tab-desc">
            Ingredientes que se vinculan a productos mediante recetas.
            Se descontarán automáticamente según la cantidad definida en cada receta.
          </p>

          {loading ? (
            <div className="stock-loading">Cargando ingredientes…</div>
          ) : error ? (
            <div className="stock-error">
              <span>{error}</span>
              <button className="stock-error-retry" onClick={fetchStock}>Reintentar</button>
            </div>
          ) : ingredientesFiltrados.length === 0 ? (
            <div className="stock-empty">
              <p>No hay ingredientes que mostrar.</p>
              <button
                className="btn-nuevo"
                onClick={() => setModal({ type: "crear" })}
              >
                + Crear primer ingrediente
              </button>
            </div>
          ) : (
            <div className="stock-grid">
              {ingredientesFiltrados.map((ing) => {
                const estado = getEstadoIng(ing);
                const porcentaje = ing.stockMax > 0
                  ? Math.min(100, Math.max(0, (ing.stockActual / ing.stockMax) * 100))
                  : 0;

                return (
                  <div key={ing._id} className={`stock-card estado-${estado}`}>
                    <button
                      className="btn-eliminar-ingrediente"
                      aria-label="Eliminar"
                      onClick={() =>
                        setModal({ type: "eliminar", ingrediente: ing })
                      }
                    >
                      ✖
                    </button>

                    <div className="stock-card-header">
                      <span className="stock-name">{ing.nombre}</span>
                      <span className={`estado-badge ${estado}`}>
                        {estado === "ok" && "Óptimo"}
                        {estado === "bajo" && "Bajo"}
                        {estado === "critico" && "Crítico"}
                      </span>
                    </div>

                    {/* Indicador de lotes (unificación Fase 5) */}
                    {(() => {
                      const info = lotesPorItem.get(String(ing._id));
                      if (!info) return null;
                      if (info.caducados > 0) {
                        return (
                          <button
                            type="button"
                            className="stock-lote-badge stock-lote-badge--rojo"
                            onClick={() => setTab("lotes")}
                            title="Ver en pestaña Lotes"
                          >
                            🧪 {info.caducados} lote{info.caducados === 1 ? "" : "s"} caducado{info.caducados === 1 ? "" : "s"}
                          </button>
                        );
                      }
                      if (info.proximos > 0) {
                        return (
                          <button
                            type="button"
                            className="stock-lote-badge stock-lote-badge--amber"
                            onClick={() => setTab("lotes")}
                            title="Ver en pestaña Lotes"
                          >
                            🧪 {info.proximos} lote{info.proximos === 1 ? "" : "s"} en {info.proxMinDias}d
                          </button>
                        );
                      }
                      return null;
                    })()}

                    <div className="stock-bar">
                      <div
                        className="stock-bar-fill"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>

                    <div className="stock-details">
                      <strong>
                        {ing.stockActual} {ing.unidad}
                      </strong>
                      <span className="max">
                        máx: {ing.stockMax} {ing.unidad}
                      </span>
                    </div>

                    <div className="stock-card-actions">
                      <button
                        className="btn-ajustar"
                        onClick={() =>
                          setModal({ type: "ajustar", ingrediente: ing })
                        }
                      >
                        Ajustar stock
                      </button>
                      <button
                        className="btn-editar"
                        onClick={() =>
                          setModal({ type: "editar", ingrediente: ing })
                        }
                      >
                        Editar
                      </button>
                      <button
                        className="btn-editar"
                        onClick={() =>
                          setModal({ type: "historial", ingrediente: ing })
                        }
                      >
                        Historial
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* pagination */}
          {totalPages > 1 && (
            <div className="stock-pagination">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </button>
              <span>
                Página {page} de {totalPages}
              </span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Siguiente
              </button>
            </div>
          )}

          {/* modals */}
          {modal?.type === "ajustar" && (
            <AjustarStockModal
              ingrediente={modal.ingrediente}
              onClose={() => setModal(null)}
              onSave={() => {
                showFlash("Stock actualizado");
                fetchStock();
              }}
            />
          )}
          {modal?.type === "crear" && (
            <CrearIngredienteModal
              onClose={() => setModal(null)}
              onSave={() => {
                showFlash("Ingrediente creado correctamente");
                fetchStock();
              }}
            />
          )}
          {modal?.type === "eliminar" && (
            <ModalConfirmacion
              titulo="Eliminar ingrediente"
              mensaje={`¿Seguro que deseas eliminar "${modal.ingrediente.nombre}"? Esta acción no se puede deshacer.`}
              onConfirm={() => eliminarIngrediente(modal.ingrediente._id)}
              onClose={() => setModal(null)}
            />
          )}
          {modal?.type === "editar" && (
            <EditarIngredienteModal
              ingrediente={modal.ingrediente}
              onClose={() => setModal(null)}
              onSave={() => {
                showFlash("Ingrediente actualizado correctamente");
                fetchStock();
              }}
            />
          )}
          {modal?.type === "historial" && (
            <HistorialMovimientosModal
              ingrediente={modal.ingrediente}
              onClose={() => setModal(null)}
            />
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: LOTES (unificado desde StockLotesPage)
      ══════════════════════════════════════════════════ */}
      {hasStockAvanzado && tab === "lotes" && (
        <LotesView onChange={fetchLotesResumen} />
      )}

      {/* Modal: Umbrales inteligentes global */}
      {showUmbralesModal && (
        <div className="stock-sug-modal-overlay" onClick={() => setShowUmbralesModal(false)}>
          <div className="stock-sug-modal" onClick={(e) => e.stopPropagation()}>
            <div className="stock-sug-modal__header">
              <h3>🤖 Umbrales inteligentes</h3>
              <button className="stock-sug-modal__close" onClick={() => setShowUmbralesModal(false)}>✕</button>
            </div>
            <p className="stock-sug-modal__desc">
              Basado en consumo por día de semana (8 semanas) × lead time del proveedor.
              Selecciona los productos y aplica.
            </p>
            <div className="stock-sug-modal__table-wrap">
              <table className="stock-sug-modal__table">
                <thead>
                  <tr>
                    <th><input type="checkbox" defaultChecked onChange={(e) => {
                      document.querySelectorAll('.stock-sug-modal__cb').forEach(cb => cb.checked = e.target.checked);
                    }} /></th>
                    <th>Producto</th>
                    <th>Consumo/día</th>
                    <th>Lead time</th>
                    <th>Mín actual → sugerido</th>
                    <th>Máx actual → sugerido</th>
                  </tr>
                </thead>
                <tbody>
                  {sugerenciasList.filter(s => s.cambio && !s.umbralManual).map((s) => (
                    <tr key={s.itemId}>
                      <td><input type="checkbox" className="stock-sug-modal__cb" defaultChecked data-id={s.itemId} /></td>
                      <td><strong>{s.nombre}</strong></td>
                      <td>{s.consumoDiario}</td>
                      <td>{s.leadTime}d</td>
                      <td>{s.actual.minimo} → <strong>{s.sugerido.minimo}</strong></td>
                      <td>{s.actual.maximo} → <strong>{s.sugerido.maximo}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="stock-sug-modal__footer">
              <button
                className="btn-nuevo"
                onClick={() => {
                  const checked = [...document.querySelectorAll('.stock-sug-modal__cb:checked')].map(cb => cb.dataset.id);
                  const items = sugerenciasList.filter(s => checked.includes(s.itemId));
                  aplicarTodosUmbrales(items);
                }}
              >
                Aplicar seleccionados
              </button>
              <button className="btn-editar" onClick={() => setShowUmbralesModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockPage;
