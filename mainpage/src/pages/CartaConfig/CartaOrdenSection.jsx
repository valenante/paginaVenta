import React, { useEffect, useMemo, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import api from "../../utils/api";
import "./CartaOrdenSection.css";

const TABS = [
  { key: "platos", label: "🍽 Platos" },
  { key: "bebidas", label: "🍷 Bebidas" },
];

function buildOrdenVisual(categoriasDisponibles, ordenGuardado) {
  const set = new Set(categoriasDisponibles);
  const base = (Array.isArray(ordenGuardado) ? ordenGuardado : []).filter((c) =>
    set.has(c)
  );
  const rest = categoriasDisponibles.filter((c) => !base.includes(c));
  return [...base, ...rest];
}

export default function CartaOrdenSection({ form, setForm, handleChange, showAlert }) {
  const [tab, setTab] = useState("platos");
  const [cats, setCats] = useState({ platos: [], bebidas: [] });
  const [loadingCats, setLoadingCats] = useState(false);

  // cargar categorías ordenables
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingCats(true);
        const { data } = await api.get("/configuracion/categorias-ordenables");
        if (!alive) return;
        setCats({
          platos: Array.isArray(data?.platos) ? data.platos : [],
          bebidas: Array.isArray(data?.bebidas) ? data.bebidas : [],
        });
      } catch (e) {
        showAlert?.("error", "No se pudieron cargar las categorías para ordenar.");
      } finally {
        if (alive) setLoadingCats(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [showAlert]);

  const modoOrden = form?.carta?.modoOrden || "por_categoria";
  const ordenGuardado = form?.carta?.ordenCategorias?.[tab] || [];

  const ordenVisual = useMemo(() => {
    return buildOrdenVisual(cats[tab], ordenGuardado);
  }, [cats, tab, ordenGuardado]);

  const setOrdenTab = useCallback(
    (nuevoOrden) => {
      setForm((prev) => ({
        ...prev,
        carta: {
          ...(prev.carta || {}),
          ordenCategorias: {
            ...(prev.carta?.ordenCategorias || {}),
            [tab]: nuevoOrden,
          },
        },
      }));
    },
    [setForm, tab]
  );

  const onDragEnd = useCallback(
    ({ source, destination }) => {
      if (!destination) return;
      if (source.index === destination.index) return;

      const clone = [...ordenVisual];
      const [moved] = clone.splice(source.index, 1);
      clone.splice(destination.index, 0, moved);

      setOrdenTab(clone);
    },
    [ordenVisual, setOrdenTab]
  );

  const resetOrden = useCallback(() => {
    const sorted = [...cats[tab]].sort((a, b) => a.localeCompare(b, "es"));
    setOrdenTab(sorted);
    showAlert?.("info", `Orden de ${tab} reseteado (A-Z).`);
  }, [cats, tab, setOrdenTab, showAlert]);

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
                disabled={loadingCats}
                title="Ordenar A-Z"
              >
                ↺ Reset A-Z
              </button>
            </div>

            {loadingCats ? (
              <div className="carta-orden__state">Cargando categorías…</div>
            ) : ordenVisual.length === 0 ? (
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
                        <Draggable key={cat} draggableId={cat} index={index}>
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
                                <span className="carta-orden__name">{cat}</span>
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
