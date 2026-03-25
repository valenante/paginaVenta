import React, { useEffect, useMemo, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useCategorias } from "../../context/CategoriasContext";
import api from "../../utils/api";
import "./CartaOrdenSection.css";

const TABS = [
  { key: "platos", label: "🍽 Platos", tipo: "plato" },
  { key: "bebidas", label: "🍷 Bebidas", tipo: "bebida" },
];

export default function CartaOrdenSection({ form, setForm, handleChange, showAlert }) {
  const [tab, setTab] = useState("platos");

  const { categoryObjectsByTipo, fetchCategoryObjects } = useCategorias();

  // Cargar ambos tipos al montar
  useEffect(() => {
    fetchCategoryObjects("plato");
    fetchCategoryObjects("bebida");
  }, [fetchCategoryObjects]);

  // Tipo backend correspondiente al tab
  const tipoActual = TABS.find((t) => t.key === tab)?.tipo || "plato";

  // Categorías ordenadas desde el contexto compartido
  const catObjects = categoryObjectsByTipo[tipoActual] || [];
  const ordenVisual = useMemo(
    () => catObjects.map((c) => ({ _id: c._id, nombre: c.nombre })),
    [catObjects]
  );

  const modoOrden = form?.carta?.modoOrden || "por_categoria";

  // Sincronizar form.carta.ordenCategorias cuando cambia el contexto
  useEffect(() => {
    if (catObjects.length === 0) return;
    const nombres = catObjects.map((c) => c.nombre);
    setForm((prev) => ({
      ...prev,
      carta: {
        ...(prev.carta || {}),
        ordenCategorias: {
          ...(prev.carta?.ordenCategorias || {}),
          [tab]: nombres,
        },
      },
    }));
  }, [catObjects, tab, setForm]);

  const onDragEnd = useCallback(
    async ({ source, destination }) => {
      if (!destination) return;
      if (source.index === destination.index) return;

      const clone = [...ordenVisual];
      const [moved] = clone.splice(source.index, 1);
      clone.splice(destination.index, 0, moved);

      const ordenPayload = clone.map((cat, i) => ({
        _id: cat._id,
        orden: i,
      }));

      // Actualizar form para que se guarde con la config
      setForm((prev) => ({
        ...prev,
        carta: {
          ...(prev.carta || {}),
          ordenCategorias: {
            ...(prev.carta?.ordenCategorias || {}),
            [tab]: clone.map((c) => c.nombre),
          },
        },
      }));

      // Persistir en backend y refrescar contexto (sincroniza con CategoriasPanel)
      try {
        await api.put("/categorias/reordenar", { orden: ordenPayload }, { withCredentials: true });
        fetchCategoryObjects(tipoActual, { force: true });
      } catch {
        fetchCategoryObjects(tipoActual, { force: true });
        showAlert?.("error", "No se pudo guardar el orden.");
      }
    },
    [ordenVisual, tab, tipoActual, setForm, fetchCategoryObjects, showAlert]
  );

  const resetOrden = useCallback(async () => {
    const sorted = [...catObjects].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es")
    );

    const ordenPayload = sorted.map((cat, i) => ({
      _id: cat._id,
      orden: i,
    }));

    setForm((prev) => ({
      ...prev,
      carta: {
        ...(prev.carta || {}),
        ordenCategorias: {
          ...(prev.carta?.ordenCategorias || {}),
          [tab]: sorted.map((c) => c.nombre),
        },
      },
    }));

    try {
      await api.put("/categorias/reordenar", { orden: ordenPayload }, { withCredentials: true });
      fetchCategoryObjects(tipoActual, { force: true });
      showAlert?.("info", `Orden de ${tab} reseteado (A-Z).`);
    } catch {
      fetchCategoryObjects(tipoActual, { force: true });
      showAlert?.("error", "No se pudo resetear el orden.");
    }
  }, [catObjects, tab, tipoActual, setForm, fetchCategoryObjects, showAlert]);

  return (
    <section className="config-section">
      <div className="config-section-header">
        <h3 className="section-title">🍽 Opciones de la carta</h3>
        <p className="section-description">
          Define qué información se muestra y el orden de visualización.
        </p>
      </div>

      {/* checkboxes existentes */}
      <label className="checkbox-row">
        <input
          type="checkbox"
          name="carta.mostrarFotos"
          checked={!!form.carta?.mostrarFotos}
          onChange={handleChange}
        />
        <span>Mostrar fotos</span>
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          name="carta.mostrarAlergenos"
          checked={!!form.carta?.mostrarAlergenos}
          onChange={handleChange}
        />
        <span>Mostrar alérgenos</span>
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          name="carta.mostrarValoraciones"
          checked={!!form.carta?.mostrarValoraciones}
          onChange={handleChange}
        />
        <span>Mostrar valoraciones</span>
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          name="carta.mostrarIconosCategorias"
          checked={!!form.carta?.mostrarIconosCategorias}
          onChange={handleChange}
        />
        <span>Mostrar iconos en categorías</span>
      </label>

      {/* tamaño */}
      <div className="config-field">
        <label>Tamaño de las imágenes de producto</label>
        <select
          name="carta.tamanoImagen"
          value={form.carta?.tamanoImagen || "mediano"}
          onChange={handleChange}
        >
          <option value="pequeno">Pequeño</option>
          <option value="mediano">Mediano (por defecto)</option>
          <option value="grande">Grande</option>
        </select>
      </div>

      {/* modo orden */}
      <div className="config-field">
        <label>Orden de la carta</label>
        <select name="carta.modoOrden" value={modoOrden} onChange={handleChange}>
          <option value="por_categoria">Por categorías (por defecto)</option>
          <option value="alfabetico">Alfabético (A-Z)</option>
          <option value="precio_asc">Precio: de menor a mayor</option>
          <option value="precio_desc">Precio: de mayor a menor</option>
          <option value="personalizado">
            Personalizado (por orden de categorías)
          </option>
        </select>
      </div>

      {/* columnas */}
      <div className="config-field-row">
        <div className="config-field">
          <label>Columnas en escritorio</label>
          <select
            name="carta.columnasDesktop"
            value={form.carta?.columnasDesktop ?? "auto"}
            onChange={handleChange}
          >
            <option value="auto">Automático (recomendado)</option>
            <option value="2">2 columnas</option>
            <option value="4">4 columnas</option>
          </select>
        </div>

        <div className="config-field">
          <label>Columnas en móvil</label>
          <select
            name="carta.columnasMovil"
            value={form.carta?.columnasMovil ?? "1"}
            onChange={handleChange}
          >
            <option value="1">1 columna</option>
            <option value="2">2 columnas</option>
          </select>
        </div>
      </div>

      {/* 🆕 Orden por categorías (solo si personalizado) */}
      {modoOrden === "personalizado" && (
        <div className="config-field">
          <div className="carta-orden carta-orden__box">
            <div className="carta-orden__label">
              <span>Orden de categorías (arrastrar y soltar)</span>
              <p className="carta-orden__help">
                Este orden se aplica a la carta del cliente cuando el modo es “Personalizado”.
              </p>
            </div>

            <div className="carta-orden__tabs">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`carta-orden__tab ${tab === t.key ? "is-active" : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}

              <button
                type="button"
                className="carta-orden__reset"
                onClick={resetOrden}
                disabled={catObjects.length === 0}
                title="Ordenar A-Z"
              >
                ↺ Reset A-Z
              </button>
            </div>

            {ordenVisual.length === 0 ? (
              <div className="carta-orden__state">
                No hay categorías detectadas para {tab}.
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="ordenCategorias">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="carta-orden__dnd"
                    >
                      {ordenVisual.map((cat, index) => (
                        <Draggable key={cat._id} draggableId={cat._id} index={index}>
                          {(p) => (
                            <div
                              ref={p.innerRef}
                              {...p.draggableProps}
                              className="carta-orden__item"
                              style={p.draggableProps.style}
                            >
                              <div
                                className="carta-orden__item-left"
                                {...p.dragHandleProps}
                              >
                                <span className="carta-orden__index">
                                  {index + 1}
                                </span>
                                <span className="carta-orden__name">{cat.nombre}</span>
                              </div>

                              <span className="carta-orden__grip" aria-hidden>
                                ⠿
                              </span>
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
          </div>
        </div>
      )}
    </section>
  );
}
