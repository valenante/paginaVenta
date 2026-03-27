// src/components/Categories/CategoriasPanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import CategoriaFormModal from "./CategoriaFormModal";
import CrearProducto from "./CrearProducto";
import EditProduct from "./EditProducts";
import { useCategorias } from "../../context/CategoriasContext";
import Portal from "../ui/Portal";
import api from "../../utils/api";
import { getFirstPrice } from "./categoriesHelpers";
import "./CategoriasPanel.css";

const TABS = [
  { key: "plato", label: "Platos", emoji: "🍽️" },
  { key: "bebida", label: "Bebidas", emoji: "🥂" },
];

const CategoriasPanel = ({ onBack }) => {
  const [tab, setTab] = useState("plato");
  const [catModal, setCatModal] = useState({ open: false, categoria: null });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [crearProductoTipo, setCrearProductoTipo] = useState(null); // "plato" | "bebida" | null
  const [expandedCats, setExpandedCats] = useState(new Set());
  const [productsByCat, setProductsByCat] = useState({}); // { catName: [...products] }
  const [loadingProducts, setLoadingProducts] = useState(new Set());
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const {
    categoryObjectsByTipo,
    fetchCategoryObjects,
    createCategoryObject,
    updateCategoryObject,
    deleteCategoryObject,
    fetchCategories,
    fetchProducts,
    updateProduct,
  } = useCategorias();

  // Cargar ambos tipos al montar
  useEffect(() => {
    fetchCategoryObjects("plato");
    fetchCategoryObjects("bebida");
  }, [fetchCategoryObjects]);

  const catObjects = categoryObjectsByTipo[tab] || [];

  /* =====================================================
     Expandir / colapsar categoría
  ===================================================== */
  const toggleCategory = useCallback(
    async (cat) => {
      const next = new Set(expandedCats);
      if (next.has(cat._id)) {
        next.delete(cat._id);
      } else {
        next.add(cat._id);
        // Cargar productos si no están cargados
        const key = `${tab}::${cat.nombre}`;
        if (!productsByCat[key]) {
          setLoadingProducts((s) => new Set(s).add(cat._id));
          try {
            const prods = await fetchProducts(
              { tipo: tab, categoria: cat.nombre },
              { force: true }
            );
            setProductsByCat((prev) => ({ ...prev, [key]: prods }));
          } finally {
            setLoadingProducts((s) => {
              const n = new Set(s);
              n.delete(cat._id);
              return n;
            });
          }
        }
      }
      setExpandedCats(next);
    },
    [expandedCats, tab, productsByCat, fetchProducts]
  );

  /* =====================================================
     Refrescar productos de una categoría
  ===================================================== */
  const refreshCatProducts = useCallback(
    async (catName, tipo) => {
      const key = `${tipo || tab}::${catName}`;
      const prods = await fetchProducts(
        { tipo: tipo || tab, categoria: catName },
        { force: true }
      );
      setProductsByCat((prev) => ({ ...prev, [key]: prods }));
    },
    [tab, fetchProducts]
  );

  /* =====================================================
     Drag & Drop — handle both category reorder and product move
  ===================================================== */
  const onDragEnd = useCallback(
    async ({ source, destination, type }) => {
      if (!destination) return;

      // --- Category reorder ---
      if (type === "CATEGORY") {
        if (source.index === destination.index) return;

        const clone = [...catObjects];
        const [moved] = clone.splice(source.index, 1);
        clone.splice(destination.index, 0, moved);

        const ordenPayload = clone.map((cat, i) => ({
          _id: cat._id,
          orden: i,
        }));

        try {
          await api.put("/categorias/reordenar", { orden: ordenPayload }, { withCredentials: true });
          fetchCategoryObjects(tab, { force: true });
        } catch {
          fetchCategoryObjects(tab, { force: true });
        }
        return;
      }

      // --- Product move between categories ---
      if (type === "PRODUCT") {
        const srcCatId = source.droppableId.replace("products-", "");
        const dstCatId = destination.droppableId.replace("products-", "");

        if (srcCatId === dstCatId) return;

        const srcCat = catObjects.find((c) => c._id === srcCatId);
        const dstCat = catObjects.find((c) => c._id === dstCatId);
        if (!srcCat || !dstCat) return;

        const srcKey = `${tab}::${srcCat.nombre}`;
        const dstKey = `${tab}::${dstCat.nombre}`;
        const srcProds = [...(productsByCat[srcKey] || [])];

        const [movedProd] = srcProds.splice(source.index, 1);
        if (!movedProd) return;

        // Snapshot for rollback
        const prevState = { ...productsByCat };

        // Optimistic update
        const dstProds = [...(productsByCat[dstKey] || [])];
        const updatedProd = { ...movedProd, categoria: dstCat.nombre };
        dstProds.splice(destination.index, 0, updatedProd);

        setProductsByCat((prev) => ({
          ...prev,
          [srcKey]: srcProds,
          [dstKey]: dstProds,
        }));

        try {
          await updateProduct(movedProd._id, { categoria: dstCat.nombre });
        } catch {
          // Revert to snapshot
          setProductsByCat(prevState);
        }
      }
    },
    [catObjects, tab, productsByCat, fetchCategoryObjects, updateProduct, refreshCatProducts]
  );

  /* =====================================================
     Category CRUD handlers (existing)
  ===================================================== */
  const handleSave = useCallback(
    async (payload, id) => {
      // Si es edición y el nombre cambió, invalidar cache bajo la key vieja
      if (id) {
        const oldCat = catObjects.find((c) => c._id === id);
        if (oldCat && oldCat.nombre !== payload.nombre) {
          const oldKey = `${payload.tipo || tab}::${oldCat.nombre}`;
          setProductsByCat((prev) => {
            const next = { ...prev };
            delete next[oldKey];
            return next;
          });
        }
        await updateCategoryObject(id, payload);
      } else {
        await createCategoryObject(payload);
      }
      fetchCategoryObjects(payload.tipo || tab, { force: true });
      fetchCategories(payload.tipo || tab, { force: true });
    },
    [tab, catObjects, updateCategoryObject, createCategoryObject, fetchCategoryObjects, fetchCategories]
  );

  const handleDelete = useCallback(
    async (cat) => {
      try {
        setDeleteError(null);
        await deleteCategoryObject(cat._id, cat.tipo);
        fetchCategories(cat.tipo, { force: true });
        setConfirmDelete(null);
      } catch (err) {
        const msg =
          err?.response?.data?.message || "No se pudo eliminar la categoría.";
        setDeleteError(msg);
      }
    },
    [deleteCategoryObject, fetchCategories]
  );

  /* =====================================================
     Product edit handler
  ===================================================== */
  const handleProductSave = useCallback(
    async (updatedProduct) => {
      await updateProduct(updatedProduct._id, updatedProduct);
      setEditingProduct(null);
      // Refresh the category the product belongs to
      if (updatedProduct.categoria) {
        refreshCatProducts(updatedProduct.categoria, updatedProduct.tipo);
      }
      return true;
    },
    [updateProduct, refreshCatProducts]
  );

  /* =====================================================
     When tab changes, collapse all
  ===================================================== */
  useEffect(() => {
    setExpandedCats(new Set());
  }, [tab]);

  return (
    <div className="catpanel">
      {/* Header */}
      <header className="catpanel-header">
        <div>
          <h2 className="catpanel-title">Gestión de carta</h2>
          <p className="catpanel-subtitle">
            Organiza categorías y productos. Haz clic en una categoría para ver sus productos.
            Arrastra productos entre categorías para moverlos.
          </p>
        </div>

        <div className="catpanel-header-actions">
          <button
            type="button"
            className="catpanel-btn-new"
            onClick={() => setCatModal({ open: true, categoria: null })}
          >
            + Nueva categoría
          </button>
          <button
            type="button"
            className="catpanel-btn-new catpanel-btn-new--plato"
            onClick={() => setCrearProductoTipo("plato")}
          >
            + Nuevo plato
          </button>
          <button
            type="button"
            className="catpanel-btn-new catpanel-btn-new--bebida"
            onClick={() => setCrearProductoTipo("bebida")}
          >
            + Nueva bebida
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="catpanel-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`catpanel-tab ${tab === t.key ? "is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.emoji} {t.label}
            <span className="catpanel-tab-count">
              {(categoryObjectsByTipo[t.key] || []).length}
            </span>
          </button>
        ))}
      </div>

      {/* Lista con drag & drop */}
      {catObjects.length === 0 ? (
        <div className="catpanel-empty">
          <p>No hay categorías de {tab === "plato" ? "platos" : "bebidas"} todavía.</p>
          <button
            type="button"
            className="catpanel-btn-new catpanel-btn-new--small"
            onClick={() => setCatModal({ open: true, categoria: null })}
          >
            + Crear primera categoría
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="catpanel-list" type="CATEGORY">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`catpanel-list ${snapshot.isDraggingOver ? "catpanel-list--dragover" : ""}`}
              >
                {catObjects.map((cat, index) => {
                  const isExpanded = expandedCats.has(cat._id);
                  const catKey = `${tab}::${cat.nombre}`;
                  const catProds = productsByCat[catKey] || [];
                  const isLoadingProds = loadingProducts.has(cat._id);

                  return (
                    <Draggable key={cat._id} draggableId={cat._id} index={index}>
                      {(p, snap) => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          className={`catpanel-item-wrapper ${isExpanded ? "catpanel-item-wrapper--expanded" : ""}`}
                          style={p.draggableProps.style}
                        >
                          {/* Category row */}
                          <div
                            className={`catpanel-item ${snap.isDragging ? "catpanel-item--dragging" : ""} ${isExpanded ? "catpanel-item--expanded" : ""}`}
                          >
                            {/* Grip handle */}
                            <div className="catpanel-item-grip" {...p.dragHandleProps}>
                              <span className="catpanel-grip-icon">⠿</span>
                              <span className="catpanel-item-index">{index + 1}</span>
                            </div>

                            {/* Clickable area to expand */}
                            <div
                              className="catpanel-item-left"
                              onClick={() => toggleCategory(cat)}
                              style={{ cursor: "pointer" }}
                            >
                              {cat.icono && (
                                <span className="catpanel-item-icono">{cat.icono}</span>
                              )}
                              <div className="catpanel-item-info">
                                <span className="catpanel-item-nombre">
                                  {cat.nombre}
                                  <span className="catpanel-item-prod-count">
                                    {catProds.length > 0 ? ` (${catProds.length})` : ""}
                                  </span>
                                </span>
                                {cat.descripcion && (
                                  <span className="catpanel-item-desc">{cat.descripcion}</span>
                                )}
                              </div>
                              <span className={`catpanel-expand-icon ${isExpanded ? "catpanel-expand-icon--open" : ""}`}>
                                ▸
                              </span>
                            </div>

                            <div className="catpanel-item-actions">
                              <button
                                type="button"
                                className="catpanel-action-btn"
                                title="Editar categoría"
                                onClick={() => setCatModal({ open: true, categoria: cat })}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="catpanel-action-btn catpanel-action-btn--del"
                                title="Eliminar categoría"
                                onClick={() => setConfirmDelete(cat)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>

                          {/* Expanded products list */}
                          {isExpanded && (
                            <Droppable droppableId={`products-${cat._id}`} type="PRODUCT">
                              {(prodProvided, prodSnap) => (
                                <div
                                  ref={prodProvided.innerRef}
                                  {...prodProvided.droppableProps}
                                  className={`catpanel-products ${prodSnap.isDraggingOver ? "catpanel-products--dragover" : ""}`}
                                >
                                  {isLoadingProds ? (
                                    <p className="catpanel-products-loading">Cargando productos…</p>
                                  ) : catProds.length === 0 ? (
                                    <p className="catpanel-products-empty">Sin productos en esta categoría.</p>
                                  ) : (
                                    catProds.map((prod, prodIndex) => (
                                      <Draggable
                                        key={prod._id}
                                        draggableId={`prod-${prod._id}`}
                                        index={prodIndex}
                                      >
                                        {(pp, ps) => {
                                          const node = (
                                            <div
                                              ref={pp.innerRef}
                                              {...pp.draggableProps}
                                              {...pp.dragHandleProps}
                                              className={`catpanel-product ${ps.isDragging ? "catpanel-product--dragging" : ""}`}
                                              style={pp.draggableProps.style}
                                            >
                                              <span className="catpanel-product-grip">⠿</span>
                                              <div className="catpanel-product-info">
                                                <span className="catpanel-product-nombre">{prod.nombre}</span>
                                                {prod.descripcion && (
                                                  <span className="catpanel-product-desc">{prod.descripcion}</span>
                                                )}
                                              </div>
                                              <div className="catpanel-product-meta">
                                                {(Array.isArray(prod.precios) ? prod.precios.length > 0 : prod.precios?.precioBase != null) && (
                                                  <span className="catpanel-product-price">
                                                    {Number(getFirstPrice(prod.precios)).toFixed(2)} €
                                                  </span>
                                                )}
                                                <span className={`catpanel-product-estado ${prod.estado === "habilitado" ? "catpanel-product-estado--on" : "catpanel-product-estado--off"}`}>
                                                  {prod.estado === "habilitado" ? "Visible" : "Oculto"}
                                                </span>
                                              </div>
                                              <button
                                                type="button"
                                                className="catpanel-action-btn"
                                                onClick={() => setEditingProduct(prod)}
                                              >
                                                Editar
                                              </button>
                                            </div>
                                          );
                                          // Portal while dragging: avoids offset caused by parent Draggable transforms
                                          return ps.isDragging ? createPortal(node, document.body) : node;
                                        }}
                                      </Draggable>
                                    ))
                                  )}
                                  {prodProvided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Modal crear / editar categoría */}
      {catModal.open && (
        <CategoriaFormModal
          categoria={catModal.categoria}
          tipo={tab}
          onClose={() => setCatModal({ open: false, categoria: null })}
          onSave={handleSave}
        />
      )}

      {/* Modal crear producto */}
      {crearProductoTipo && (
        <Portal>
          <CrearProducto
            initialTipo={crearProductoTipo}
            onClose={() => setCrearProductoTipo(null)}
            onCreated={(data) => {
              const createdProd = data?.data || data;
              if (createdProd?.categoria) {
                refreshCatProducts(createdProd.categoria, createdProd.tipo);
              }
              fetchCategories(crearProductoTipo, { force: true });
              fetchCategoryObjects(crearProductoTipo, { force: true });
            }}
          />
        </Portal>
      )}

      {/* Modal editar producto */}
      {editingProduct && (
        <Portal>
          <EditProduct
            product={editingProduct}
            onSave={handleProductSave}
            onCancel={() => setEditingProduct(null)}
          />
        </Portal>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <Portal>
          <div className="catmodal-overlay" onClick={() => { setConfirmDelete(null); setDeleteError(null); }}>
            <div className="catconfirm-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="catconfirm-title">Eliminar categoría</h3>
              <p className="catconfirm-msg">
                ¿Seguro que quieres eliminar <strong>{confirmDelete.nombre}</strong>?
                Solo se puede eliminar si no tiene productos asignados.
              </p>
              {deleteError && <div className="catmodal-error">{deleteError}</div>}
              <div className="catmodal-actions">
                <button
                  type="button"
                  className="catmodal-btn catmodal-btn--cancel"
                  onClick={() => { setConfirmDelete(null); setDeleteError(null); }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="catmodal-btn catmodal-btn--delete"
                  onClick={() => handleDelete(confirmDelete)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default CategoriasPanel;
