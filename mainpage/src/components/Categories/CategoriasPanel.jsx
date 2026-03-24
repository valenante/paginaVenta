// src/components/Categories/CategoriasPanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import CategoriaFormModal from "./CategoriaFormModal";
import { useCategorias } from "../../context/CategoriasContext";
import Portal from "../ui/Portal";
import api from "../../utils/api";
import "./CategoriasPanel.css";

const TABS = [
  { key: "plato", label: "Platos", emoji: "🍽️" },
  { key: "bebida", label: "Bebidas", emoji: "🥂" },
];

const CategoriasPanel = ({ onBack }) => {
  const [tab, setTab] = useState("plato");
  const [catModal, setCatModal] = useState({ open: false, categoria: null });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const {
    categoryObjectsByTipo,
    fetchCategoryObjects,
    createCategoryObject,
    updateCategoryObject,
    deleteCategoryObject,
    fetchCategories,
  } = useCategorias();

  // Cargar ambos tipos al montar
  useEffect(() => {
    fetchCategoryObjects("plato");
    fetchCategoryObjects("bebida");
  }, [fetchCategoryObjects]);

  const catObjects = categoryObjectsByTipo[tab] || [];

  /* =====================================================
     Drag & Drop — reordenar
  ===================================================== */
  const onDragEnd = useCallback(
    async ({ source, destination }) => {
      if (!destination) return;
      if (source.index === destination.index) return;

      // Reordenar localmente
      const clone = [...catObjects];
      const [moved] = clone.splice(source.index, 1);
      clone.splice(destination.index, 0, moved);

      // Asignar nuevos valores de orden
      const ordenPayload = clone.map((cat, i) => ({
        _id: cat._id,
        orden: i,
      }));

      // Optimista: actualizar contexto inmediatamente
      const reordered = clone.map((cat, i) => ({ ...cat, orden: i }));
      // Hack: forzar el estado local via fetchCategoryObjects tras persistir

      try {
        await api.put("/categorias/reordenar", { orden: ordenPayload }, { withCredentials: true });
        fetchCategoryObjects(tab, { force: true });
      } catch {
        // Revertir en caso de error
        fetchCategoryObjects(tab, { force: true });
      }
    },
    [catObjects, tab, fetchCategoryObjects]
  );

  const handleSave = useCallback(
    async (payload, id) => {
      if (id) {
        await updateCategoryObject(id, payload);
      } else {
        await createCategoryObject(payload);
      }
      fetchCategoryObjects(payload.tipo || tab, { force: true });
      fetchCategories(payload.tipo || tab, { force: true });
    },
    [tab, updateCategoryObject, createCategoryObject, fetchCategoryObjects, fetchCategories]
  );

  const handleDelete = useCallback(
    async (cat) => {
      try {
        await deleteCategoryObject(cat._id, cat.tipo);
        fetchCategories(cat.tipo, { force: true });
        setConfirmDelete(null);
      } catch (err) {
        const msg =
          err?.response?.data?.message || "No se pudo eliminar la categoría.";
        alert(msg);
      }
    },
    [deleteCategoryObject, fetchCategories]
  );

  return (
    <div className="catpanel">
      {/* Header */}
      <header className="catpanel-header">
        <div>
          <h2 className="catpanel-title">Gestión de categorías</h2>
          <p className="catpanel-subtitle">
            Crea, edita y organiza las categorías de tu carta. Arrastra para reordenar.
          </p>
        </div>

        <button
          type="button"
          className="catpanel-btn-new"
          onClick={() => setCatModal({ open: true, categoria: null })}
        >
          + Nueva categoría
        </button>
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
          <Droppable droppableId="catpanel-list">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`catpanel-list ${snapshot.isDraggingOver ? "catpanel-list--dragover" : ""}`}
              >
                {catObjects.map((cat, index) => (
                  <Draggable key={cat._id} draggableId={cat._id} index={index}>
                    {(p, snap) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        className={`catpanel-item ${snap.isDragging ? "catpanel-item--dragging" : ""}`}
                        style={p.draggableProps.style}
                      >
                        {/* Grip handle */}
                        <div className="catpanel-item-grip" {...p.dragHandleProps}>
                          <span className="catpanel-grip-icon">⠿</span>
                          <span className="catpanel-item-index">{index + 1}</span>
                        </div>

                        <div className="catpanel-item-left">
                          {cat.icono && (
                            <span className="catpanel-item-icono">{cat.icono}</span>
                          )}
                          <div className="catpanel-item-info">
                            <span className="catpanel-item-nombre">{cat.nombre}</span>
                            {cat.descripcion && (
                              <span className="catpanel-item-desc">{cat.descripcion}</span>
                            )}
                          </div>
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
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Modal crear / editar */}
      {catModal.open && (
        <CategoriaFormModal
          categoria={catModal.categoria}
          tipo={tab}
          onClose={() => setCatModal({ open: false, categoria: null })}
          onSave={handleSave}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <Portal>
          <div className="catmodal-overlay" onClick={() => setConfirmDelete(null)}>
            <div className="catconfirm-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="catconfirm-title">Eliminar categoría</h3>
              <p className="catconfirm-msg">
                ¿Seguro que quieres eliminar <strong>{confirmDelete.nombre}</strong>?
                Solo se puede eliminar si no tiene productos asignados.
              </p>
              <div className="catmodal-actions">
                <button
                  type="button"
                  className="catmodal-btn catmodal-btn--cancel"
                  onClick={() => setConfirmDelete(null)}
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
