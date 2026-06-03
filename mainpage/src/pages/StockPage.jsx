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
import ModalBase from "../components/MapaEditor/ModalBase";
import "../styles/StockPage.css";

const ITEMS_PER_PAGE = 12;

/* ================================================================
   Helpers
================================================================ */
const getEstadoIng = (it) => {
  if (it.stockActual <= 0) return "agotado";
  if (it.stockActual <= (it.stockCritico ?? 0)) return "critico";
  if (it.stockActual <= (it.stockMinimo ?? 0)) return "bajo";
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
  const [tab, setTab] = useState("ingredientes");

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

  // ── AbortControllers ──
  const ingControllerRef = useRef(null);
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

  // ── Umbrales inteligentes (state) ──
  const [thresholdsMode, setThresholdsMode] = useState("sugerir");
  const [sugerenciasMap, setSugerenciasMap] = useState(new Map());
  const [sugerenciasLoading, setSugerenciasLoading] = useState(false);
  const [showUmbralesModal, setShowUmbralesModal] = useState(false);
  const [sugerenciasList, setSugerenciasList] = useState([]);

  // ── Counters for tab badges (fix #11: use total from server for ingredients) ──
  const ingCriticos = useMemo(
    () => ingredientes.filter((i) => getEstadoIng(i) === "critico").length,
    [ingredientes]
  );
  const ingBajos = useMemo(
    () => ingredientes.filter((i) => getEstadoIng(i) === "bajo").length,
    [ingredientes]
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

  // ── Umbrales inteligentes (callbacks — after fetchStock is defined) ──
  const fetchSugerencias = useCallback(async () => {
    setSugerenciasLoading(true);
    try {
      const [configRes, sugRes] = await Promise.all([
        api.get("/config/automations").catch(() => ({ data: { data: { automations: {} } } })),
        api.get("/stock/umbrales-sugeridos").catch(() => ({ data: { data: { items: [] } } })),
      ]);
      setThresholdsMode(configRes.data?.data?.automations?.autoThresholdsMode || "sugerir");
      const items = sugRes.data?.data?.items || sugRes.data?.items || [];
      console.log("[stock] sugerencias loaded:", items.length, "mode:", configRes.data?.data?.automations?.autoThresholdsMode);
      setSugerenciasList(items);
      const map = new Map();
      for (const s of items) map.set(s.itemId, s);
      setSugerenciasMap(map);
    } catch (err) { console.warn("[stock] fetchSugerencias error:", err.message); }
    finally { setSugerenciasLoading(false); }
  }, []);

  useEffect(() => { fetchSugerencias(); }, [fetchSugerencias]);

  const aplicarUmbral = useCallback(async (item) => {
    try {
      await api.post("/stock/umbrales-sugeridos/aplicar", { items: [item] });
      showToast("Umbrales aplicados para " + item.nombre, "success");
      fetchStock(); fetchSugerencias();
    } catch { showToast("Error al aplicar umbrales", "error"); }
  }, [fetchStock, fetchSugerencias, showToast]);

  const ignorarUmbral = useCallback(async (item) => {
    try {
      const endpoint = item.itemType === "ingrediente" ? `/stock/ingrediente/${item.itemId}` : `/productos/${item.itemId}`;
      await api.put(endpoint, { umbralManual: true });
      setSugerenciasMap((prev) => { const next = new Map(prev); next.delete(item.itemId); return next; });
      setSugerenciasList((prev) => prev.filter((s) => s.itemId !== item.itemId));
      showToast("Umbral manual para " + item.nombre, "info");
    } catch { showToast("Error", "error"); }
  }, [showToast]);

  const aplicarTodosUmbrales = useCallback(async (items) => {
    try {
      await api.post("/stock/umbrales-sugeridos/aplicar", { items });
      showToast(`Umbrales aplicados para ${items.length} productos`, "success");
      setShowUmbralesModal(false);
      fetchStock(); fetchSugerencias();
    } catch { showToast("Error al aplicar umbrales", "error"); }
  }, [fetchStock, fetchSugerencias, showToast]);

  /* ================================================================
     Helpers
  ================================================================ */
  const ingredientesFiltrados = useMemo(() => {
    if (estadoFiltro === "todos") return ingredientes;
    if (estadoFiltro === "agotado") return ingredientes.filter((ing) => ing.stockActual <= 0);
    return ingredientes.filter((ing) => getEstadoIng(ing) === estadoFiltro);
  }, [ingredientes, estadoFiltro]);

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
  const checkDependenciasYEliminar = async (ing) => {
    try {
      const { data } = await api.get(`/stock/ingrediente/${ing._id}/dependencias`);
      if (data?.tieneDependencias) {
        setModal({ type: "eliminar-deps", ingrediente: ing, deps: data });
      } else {
        setModal({ type: "eliminar", ingrediente: ing });
      }
    } catch {
      setModal({ type: "eliminar", ingrediente: ing });
    }
  };

  const eliminarIngrediente = async (id, force = false) => {
    try {
      await api.delete(`/stock/ingrediente/${id}${force ? "?force=true" : ""}`);
      showFlash("Ingrediente archivado");
      fetchStock();
      setModal(null);
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === "INGREDIENTE_IN_USE") {
        const deps = err?.response?.data?.deps;
        setModal({ type: "eliminar-deps", ingrediente: modal?.ingrediente, deps });
      } else {
        showToast(err?.response?.data?.message || "Error eliminando el ingrediente.", "error");
      }
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
              <span className="stock-kpi-value">{totalIngCount || ingredientes.length}</span>
              <span className="stock-kpi-label">Items</span>
            </div>
            {ingCriticos > 0 && (
              <div className="stock-kpi stock-kpi--alert">
                <span className="stock-kpi-value">{ingCriticos}</span>
                <span className="stock-kpi-label">Criticos</span>
              </div>
            )}
            {ingBajos > 0 && (
              <div className="stock-kpi stock-kpi--warn">
                <span className="stock-kpi-value">{ingBajos}</span>
                <span className="stock-kpi-label">Bajos</span>
              </div>
            )}
          </div>
        </div>

        {/* ── SUGERENCIAS INTELIGENTES ── */}
        {sugerenciasList.filter(s => s.cambio && !s.umbralManual).length > 0 && (
          <button
            className="alefBtn primary"
            style={{ margin: "0.75rem 0" }}
            onClick={() => setShowUmbralesModal(true)}
          >
            🤖 {sugerenciasList.filter(s => s.cambio && !s.umbralManual).length} umbrales sugeridos — Revisar
          </button>
        )}

        {/* ── TABS ── */}
        <nav className="stock-tabs">
          <button
            className={`stock-tab ${tab === "ingredientes" ? "active" : ""}`}
            onClick={() => setTab("ingredientes")}
          >
            Inventario
            {ingCriticos > 0 && <span className="stock-tab-badge stock-tab-badge--red">{ingCriticos}</span>}
          </button>
          {hasStockAvanzado && (
            <button
              className={`stock-tab ${tab === "lotes" ? "active" : ""}`}
              onClick={() => setTab("lotes")}
            >
              Lotes
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
          )}
        </nav>
      </header>

      {/* ── FLASH ── */}
      {flash && <div className="stock-flash">{flash}</div>}

      {/* ── UPSELL ── */}
      {!hasStockAvanzado && tab === "ingredientes" && (
        <div className="stock-upsell-wrapper">
          <UpsellStock />
        </div>
      )}

      {/* ================================================================
         TAB: INVENTARIO (unificado)
      ================================================================ */}
      {tab === "ingredientes" && (
        <>
          {/* toolbar */}
          <div className="stock-toolbar">
            <button
              className="btn-nuevo"
              onClick={() => setModal({ type: "crear" })}
            >
              + Nuevo ingrediente
            </button>

            {thresholdsMode !== "off" && sugerenciasList.filter(s => s.cambio && !s.umbralManual).length > 0 && (
              <button
                className="btn-nuevo"
                onClick={() => setShowUmbralesModal(true)}
                title="ALEF sugiere umbrales para tus productos"
              >
                🤖 Umbrales inteligentes ({sugerenciasList.filter(s => s.cambio && !s.umbralManual).length})
              </button>
            )}

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
                ["agotado", "Agotado"],
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
            Tu inventario completo. Se descuenta automáticamente con cada venta, entero o por receta.
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
                      onClick={() => checkDependenciasYEliminar(ing)}
                    >
                      ✖
                    </button>

                    <div className="stock-card-header">
                      <span className="stock-name">{ing.nombre}</span>
                      <span className={`estado-badge ${estado}`}>
                        {estado === "ok" && "Óptimo"}
                        {estado === "bajo" && "Bajo"}
                        {estado === "critico" && "Crítico"}
                        {estado === "agotado" && "Agotado"}
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

                    {ing.coste > 0 && (
                      <div className="stock-cost">
                        {ing.coste.toFixed(2)} €/{ing.unidad}
                      </div>
                    )}

                    {/* Sugerencia de umbrales inline */}
                    {(() => {
                      const sug = sugerenciasMap.get(String(ing._id));
                      if (!sug || !sug.cambio || sug.umbralManual) return null;
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
              titulo="Archivar ingrediente"
              mensaje={`¿Seguro que deseas archivar "${modal.ingrediente.nombre}"? No tiene recetas ni proveedores asociados.`}
              onConfirm={() => eliminarIngrediente(modal.ingrediente._id)}
              onClose={() => setModal(null)}
            />
          )}
          {modal?.type === "eliminar-deps" && (
            <ModalConfirmacion
              titulo="⚠️ Ingrediente en uso"
              mensaje={
                `"${modal.ingrediente.nombre}" está en uso:\n\n` +
                (modal.deps?.recetas?.length > 0
                  ? `• ${modal.deps.recetas.length} receta${modal.deps.recetas.length > 1 ? "s" : ""}: ${modal.deps.recetas.map(r => r.nombre).slice(0, 5).join(", ")}\n`
                  : "") +
                (modal.deps?.proveedores?.length > 0
                  ? `• ${modal.deps.proveedores.length} proveedor${modal.deps.proveedores.length > 1 ? "es" : ""}: ${modal.deps.proveedores.map(p => p.nombre).slice(0, 5).join(", ")}\n`
                  : "") +
                `\nArchivar igualmente desvinculará los proveedores. Las recetas mantendrán la referencia pero no descontarán stock.`
              }
              textoConfirmar="Archivar igualmente"
              onConfirm={() => eliminarIngrediente(modal.ingrediente._id, true)}
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
        <ModalBase
          open={true}
          title="🤖 Umbrales inteligentes"
          subtitle="Basado en consumo por día de semana (8 semanas) × lead time del proveedor."
          onClose={() => setShowUmbralesModal(false)}
          width={900}
          footer={
            <div className="alefForm-actions">
              <button type="button" className="alefBtn ghost" onClick={() => setShowUmbralesModal(false)}>Cancelar</button>
              <button
                type="button"
                className="alefBtn primary"
                onClick={() => {
                  const checked = [...document.querySelectorAll('.stock-sug-modal__cb:checked')].map(cb => cb.dataset.id);
                  const items = sugerenciasList.filter(s => checked.includes(s.itemId));
                  aplicarTodosUmbrales(items);
                }}
              >
                Aplicar seleccionados
              </button>
            </div>
          }
        >
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <table className="stock-sug-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ width: 30 }}><input type="checkbox" defaultChecked onChange={(e) => {
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
                    <td>{s.actual.minimo} → <strong style={{ color: "#ff6700" }}>{s.sugerido.minimo}</strong></td>
                    <td>{s.actual.maximo} → <strong style={{ color: "#ff6700" }}>{s.sugerido.maximo}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModalBase>
      )}
    </div>
  );
};

export default StockPage;
