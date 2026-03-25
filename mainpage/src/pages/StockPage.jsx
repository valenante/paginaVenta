// src/pages/StockPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

import AjustarStockModal from "../components/Stock/AjustarStockModal";
import CrearIngredienteModal from "../components/Stock/CrearIngredienteModal";
import UpsellStock from "../components/Stock/UpsellStock";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import EditarIngredienteModal from "../components/Stock/EditarIngredienteModal";

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

const getEstadoProd = (p) => {
  if (p.estado === "agotado") return "agotado";
  if (p.stock <= 0) return "agotado";
  if (p.stockCritico > 0 && p.stock <= p.stockCritico) return "critico";
  if (p.stockMinimo > 0 && p.stock <= p.stockMinimo) return "bajo";
  if (p.stock <= 3) return "bajo";
  return "ok";
};

/* ================================================================
   Component
================================================================ */
const StockPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isPlanEsencial =
    user?.plan === "esencial" || user?.plan === "tpv-esencial";

  // ── Tab ──
  const [tab, setTab] = useState("productos"); // "productos" | "ingredientes"

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
  const fetchId = useRef(0);

  // ── State: productos con stock ──
  const [prodLoading, setProdLoading] = useState(true);
  const [productos, setProductos] = useState([]);
  const [prodSearch, setProdSearch] = useState("");
  const [prodFiltro, setProdFiltro] = useState("todos");
  const [prodEditing, setProdEditing] = useState(null); // { _id, stock }
  const [prodConfiguring, setProdConfiguring] = useState(null); // { _id, stockMinimo, stockCritico, stockMax }
  const [prodSaving, setProdSaving] = useState(null);

  // ── Counters for tab badges ──
  const ingCriticos = useMemo(
    () => ingredientes.filter((i) => getEstadoIng(i) === "critico").length,
    [ingredientes]
  );
  const prodAlertas = useMemo(
    () => productos.filter((p) => ["agotado", "critico"].includes(getEstadoProd(p))).length,
    [productos]
  );

  /* ================================================================
     Fetch: ingredientes
  ================================================================ */
  const fetchStock = async () => {
    const id = ++fetchId.current;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/stock/ingredientes", {
        params: { page, limit: ITEMS_PER_PAGE, search },
      });
      if (id !== fetchId.current) return;
      setIngredientes(data.ingredientes || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      if (id !== fetchId.current) return;
      setError(err?.response?.data?.message || "No se pudo cargar el stock.");
    } finally {
      if (id === fetchId.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [page, search]);

  /* ================================================================
     Fetch: productos con controlStock
  ================================================================ */
  const fetchProductos = async () => {
    setProdLoading(true);
    try {
      const { data } = await api.get("/productos", {
        params: { limit: 500 },
      });
      const items = (data?.data?.items ?? data?.data ?? data?.items ?? []);
      setProductos(items.filter((p) => p.controlStock));
    } catch {
      setProductos([]);
    } finally {
      setProdLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  /* ================================================================
     Helpers
  ================================================================ */
  const ingredientesFiltrados = useMemo(() => {
    if (estadoFiltro === "todos") return ingredientes;
    return ingredientes.filter((ing) => getEstadoIng(ing) === estadoFiltro);
  }, [ingredientes, estadoFiltro]);

  const productosFiltrados = useMemo(() => {
    let arr = productos;
    if (prodSearch) {
      const q = prodSearch.toLowerCase();
      arr = arr.filter((p) => p.nombre?.toLowerCase().includes(q));
    }
    if (prodFiltro !== "todos") {
      arr = arr.filter((p) => getEstadoProd(p) === prodFiltro);
    }
    return arr;
  }, [productos, prodSearch, prodFiltro]);

  const showFlash = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2500);
  };

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
     Actions: productos stock
  ================================================================ */
  const guardarStockProducto = async (prod) => {
    const nuevoStock = Number(prodEditing?.stock);
    if (!Number.isFinite(nuevoStock) || nuevoStock < 0) return;

    setProdSaving(prod._id);
    try {
      await api.put(`/productos/${prod._id}`, { stock: nuevoStock });
      showFlash(`Stock de "${prod.nombre}" actualizado`);
      setProdEditing(null);
      fetchProductos();
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
      showFlash(`Umbrales de "${prod.nombre}" actualizados`);
      setProdConfiguring(null);
      fetchProductos();
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
            <h2>Gestión de stock</h2>
            <p>Control centralizado de productos, ingredientes y alertas.</p>
          </div>

          {/* ── KPI PILLS ── */}
          <div className="stock-kpis">
            <div className="stock-kpi">
              <span className="stock-kpi-value">{productos.length}</span>
              <span className="stock-kpi-label">Productos</span>
            </div>
            <div className="stock-kpi">
              <span className="stock-kpi-value">{ingredientes.length}</span>
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
        {!isPlanEsencial && (
          <nav className="stock-tabs">
            <button
              className={`stock-tab ${tab === "productos" ? "active" : ""}`}
              onClick={() => setTab("productos")}
            >
              Stock directo
              {prodAlertas > 0 && <span className="stock-tab-badge stock-tab-badge--red">{prodAlertas}</span>}
            </button>
            <button
              className={`stock-tab ${tab === "ingredientes" ? "active" : ""}`}
              onClick={() => setTab("ingredientes")}
            >
              Ingredientes
              {ingCriticos > 0 && <span className="stock-tab-badge stock-tab-badge--red">{ingCriticos}</span>}
            </button>
          </nav>
        )}
      </header>

      {/* ── FLASH ── */}
      {flash && <div className="stock-flash">{flash}</div>}

      {/* ── UPSELL ── */}
      {isPlanEsencial && (
        <div className="stock-upsell-wrapper">
          <UpsellStock />
        </div>
      )}

      {/* ================================================================
         TAB: PRODUCTOS CON STOCK DIRECTO
      ================================================================ */}
      {!isPlanEsencial && tab === "productos" && (
        <>
          {/* toolbar */}
          <div className="stock-toolbar">
            <input
              className="stock-search"
              placeholder="Buscar producto…"
              value={prodSearch}
              onChange={(e) => setProdSearch(e.target.value)}
            />

            <div className="stock-header-filtros">
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
                  onClick={() => setProdFiltro(key)}
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

          {prodLoading ? (
            <div className="stock-loading">Cargando productos…</div>
          ) : productosFiltrados.length === 0 ? (
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
          ) : (
            <div className="stock-grid stock-grid--productos">
              {productosFiltrados.map((prod) => {
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
                          step="1"
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
                        <span className={`stock-prod-number ${estado}`}>
                          {prod.stock ?? 0}
                        </span>
                      )}
                      <span className="stock-prod-unit">uds</span>
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
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ================================================================
         TAB: INGREDIENTES
      ================================================================ */}
      {!isPlanEsencial && tab === "ingredientes" && (
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
            <div className="stock-error">{error}</div>
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
        </>
      )}
    </div>
  );
};

export default StockPage;
