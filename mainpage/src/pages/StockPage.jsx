// src/pages/StockPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

import AjustarStockModal from "../components/Stock/AjustarStockModal";
import CrearIngredienteModal from "../components/Stock/CrearIngredienteModal";
import UpsellStock from "../components/Stock/UpsellStock";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import EditarIngredienteModal from "../components/Stock/EditarIngredienteModal";

import "../styles/StockPage.css";

const ITEMS_PER_PAGE = 12;

const StockPage = () => {
  const { user } = useAuth();
  const isPlanEsencial =
    user?.plan === "esencial" || user?.plan === "tpv-esencial";

  // =========================
  // STATE
  // =========================
  const [loading, setLoading] = useState(true);
  const [ingredientes, setIngredientes] = useState([]);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [modal, setModal] = useState(null);

  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos"); // todos | ok | bajo | critico

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchId = useRef(0);

  // =========================
  // FETCH STOCK (safe)
  // =========================
  const fetchStock = async () => {
    const id = ++fetchId.current;
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/stock/ingredientes", {
        params: {
          page,
          limit: ITEMS_PER_PAGE,
          search,
        },
      });

      if (id !== fetchId.current) return;

      setIngredientes(data.ingredientes || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      if (id !== fetchId.current) return;
      setError(
        err?.response?.data?.message || "⚠ No se pudo cargar el stock."
      );
    } finally {
      if (id === fetchId.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [page, search]);

  // =========================
  // HELPERS
  // =========================
  const getEstado = (it) => {
    if (it.stockActual <= it.stockCritico) return "critico";
    if (it.stockActual <= it.stockMinimo) return "bajo";
    return "ok";
  };

  const ingredientesFiltrados = useMemo(() => {
    if (estadoFiltro === "todos") return ingredientes;
    return ingredientes.filter(
      (ing) => getEstado(ing) === estadoFiltro
    );
  }, [ingredientes, estadoFiltro]);

  const showFlash = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2500);
  };

  // =========================
  // ACTIONS
  // =========================
  const eliminarIngrediente = async (id) => {
    try {
      await api.delete(`/stock/ingrediente/${id}`);
      showFlash("Ingrediente eliminado");
      fetchStock();
      setModal(null);
    } catch (err) {
      alert(
        err?.response?.data?.message ||
        "Error eliminando el ingrediente."
      );
    }
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="stock-root">
      {/* ================= HEADER ================= */}
      <header className="stock-header">
        <div>
          <h2>📦 Gestión de stock</h2>
          <p>Control centralizado de ítems, mínimos y alertas.</p>
        </div>

        {!isPlanEsencial && (
          <div className="stock-header-actions">
            <button
              className="btn-nuevo"
              onClick={() => setModal({ type: "crear" })}
            >
              ➕ Nuevo ítem
            </button>

            <input
              className="stock-search"
              placeholder="Buscar ítem…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <div className="stock-header-filtros">
              {[
                ["todos", "Todos"],
                ["ok", "🟢 Óptimo"],
                ["bajo", "🟠 Bajo"],
                ["critico", "🔴 Crítico"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`btn-toggle ${estadoFiltro === key ? "active" : ""
                    }`}
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
        )}
      </header>

      {/* ================= FLASH ================= */}
      {flash && <div className="stock-flash">{flash}</div>}

      {/* ================= UPSALE ================= */}
      {isPlanEsencial && (
        <div className="stock-upsell-wrapper">
          <UpsellStock />
        </div>
      )}

      {/* ================= CONTENT ================= */}
      {!isPlanEsencial && (
        <>
          {loading ? (
            <div className="stock-loading">Cargando stock…</div>
          ) : error ? (
            <div className="stock-error">{error}</div>
          ) : ingredientesFiltrados.length === 0 ? (
            <div className="stock-empty">
              <p>No hay ítems de stock que mostrar.</p>
              <button
                className="btn-nuevo"
                onClick={() => setModal({ type: "crear" })}
              >
                ➕ Crear primer ítem
              </button>
            </div>
          ) : (
            <div className="stock-grid">
              {ingredientesFiltrados.map((ing) => {
                const estado = getEstado(ing);
                const porcentaje = Math.min(
                  100,
                  Math.max(
                    0,
                    (ing.stockActual / ing.stockMax) * 100
                  )
                );

                return (
                  <div
                    key={ing._id}
                    className={`stock-card estado-${estado}`}
                  >
                    <button
                      className="btn-eliminar-ingrediente"
                      aria-label="Eliminar ítem"
                      onClick={() =>
                        setModal({
                          type: "eliminar",
                          ingrediente: ing,
                        })
                      }
                    >
                      ✖
                    </button>

                    <div className="stock-card-header">
                      <span className="stock-name">{ing.nombre}</span>
                      <span
                        className={`estado-badge ${estado}`}
                      >
                        {estado === "ok" && "🟢 Óptimo"}
                        {estado === "bajo" && "🟠 Bajo"}
                        {estado === "critico" && "🔴 Crítico"}
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
                        {ing.stockActual}
                        {ing.unidad}
                      </strong>
                      <span className="max">
                        máx: {ing.stockMax}
                        {ing.unidad}
                      </span>
                    </div>

                    <div className="stock-card-actions">
                      <button
                        className="btn-ajustar"
                        onClick={() =>
                          setModal({
                            type: "ajustar",
                            ingrediente: ing,
                          })
                        }
                      >
                        Ajustar stock
                      </button>

                      <button
                        className="btn-editar"
                        onClick={() =>
                          setModal({
                            type: "editar",
                            ingrediente: ing,
                          })
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

          {/* ================= PAGINATION ================= */}
          {totalPages > 1 && (
            <div className="stock-pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ◀ Anterior
              </button>

              <span>
                Página {page} de {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente ▶
              </button>
            </div>
          )}

          {/* ================= MODALS ================= */}
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
                showFlash("Ítem creado correctamente");
                fetchStock();
              }}
            />
          )}

          {modal?.type === "eliminar" && (
            <ModalConfirmacion
              titulo="Eliminar ítem de stock"
              mensaje={`¿Seguro que deseas eliminar "${modal.ingrediente.nombre}"? Esta acción no se puede deshacer.`}
              onConfirm={() =>
                eliminarIngrediente(modal.ingrediente._id)
              }
              onClose={() => setModal(null)}
            />
          )}
          {modal?.type === "editar" && (
            <EditarIngredienteModal
              ingrediente={modal.ingrediente}
              onClose={() => setModal(null)}
              onSave={() => {
                showFlash("Ítem actualizado correctamente");
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
