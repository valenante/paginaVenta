// src/components/Categories/CategoriaFormModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import Portal from "../ui/Portal";
import EditProduct from "./EditProducts";
import { useCategorias } from "../../context/CategoriasContext";
import api from "../../utils/api";
import "./CategoriaFormModal.css";

const ICONOS_SUGERIDOS = [
  // Platos
  "🍽️", "🍕", "🍔", "🥗", "🍣", "🍰", "🍝", "🥘",
  "🫕", "🍖", "🥩", "🐟", "🍤", "🧀", "🥖", "🌮",
  "🥟", "🧆", "🫓", "🥙", "🍢", "🫔", "🥮", "🍳",
  // Bebidas
  "🥂", "🍷", "🍺", "🍻", "🥤", "☕", "🫖", "🍵",
  "🧃", "🥛", "🍶", "🧊", "🍹", "🍸", "🫗", "💧",
  // Postres / dulce
  "🧁", "🍦", "🍩", "🍫", "🎂",
];

const CategoriaFormModal = ({ categoria, tipo, onClose, onSave }) => {
  const isEdit = !!categoria;

  const [nombre, setNombre] = useState(categoria?.nombre || "");
  const [descripcion, setDescripcion] = useState(categoria?.descripcion || "");
  const [icono, setIcono] = useState(categoria?.icono || "");
  const [orden, setOrden] = useState(categoria?.orden ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Traducciones
  const [trEN, setTrEN] = useState({
    nombre: categoria?.traducciones?.en?.nombre || "",
    descripcion: categoria?.traducciones?.en?.descripcion || "",
  });
  const [trFR, setTrFR] = useState({
    nombre: categoria?.traducciones?.fr?.nombre || "",
    descripcion: categoria?.traducciones?.fr?.descripcion || "",
  });

  // Opciones avanzadas toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Productos asociados
  const [productos, setProductos] = useState([]);
  const [loadingProds, setLoadingProds] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const { updateProduct, fetchProducts, fetchCategories } = useCategorias();

  // Cargar productos de esta categoría (solo en edición)
  useEffect(() => {
    if (!isEdit || !categoria?.nombre) return;
    let alive = true;
    (async () => {
      setLoadingProds(true);
      try {
        const res = await api.get(
          `/productos/category/${encodeURIComponent(categoria.nombre)}?tipo=${encodeURIComponent(categoria.tipo)}`
        );
        if (alive) {
          setProductos(res?.data?.data ?? res?.data?.products ?? []);
        }
      } catch {
        // silencioso
      } finally {
        if (alive) setLoadingProds(false);
      }
    })();
    return () => { alive = false; };
  }, [isEdit, categoria]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (editingProduct) {
          setEditingProduct(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, editingProduct]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);

      if (!nombre.trim()) {
        setError("El nombre es obligatorio.");
        return;
      }

      setSaving(true);
      try {
        const payload = {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          icono: icono.trim(),
          orden,
          traducciones: {
            en: { nombre: trEN.nombre.trim(), descripcion: trEN.descripcion.trim() },
            fr: { nombre: trFR.nombre.trim(), descripcion: trFR.descripcion.trim() },
          },
        };

        if (!isEdit) {
          payload.tipo = tipo;
        }

        await onSave(payload, categoria?._id);
        onClose();
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?._server?.message ||
          "Error al guardar la categoría.";
        setError(msg);
      } finally {
        setSaving(false);
      }
    },
    [nombre, descripcion, icono, orden, trEN, trFR, tipo, isEdit, categoria, onSave, onClose]
  );

  // Guardar producto editado y refrescar lista
  const handleSaveProduct = useCallback(
    async (updatedProduct) => {
      await updateProduct(updatedProduct._id, updatedProduct);
      setEditingProduct(null);
      // Refrescar la mini-lista
      try {
        const res = await api.get(
          `/productos/category/${encodeURIComponent(categoria.nombre)}?tipo=${encodeURIComponent(categoria.tipo)}`
        );
        setProductos(res?.data?.data ?? res?.data?.products ?? []);
      } catch { /* silencioso */ }
      // Refrescar contexto
      fetchProducts({ tipo: categoria.tipo, categoria: categoria.nombre }, { force: true });
    },
    [updateProduct, categoria, fetchProducts]
  );

  // Si estamos editando un producto, mostrar ese modal encima
  if (editingProduct) {
    return (
      <Portal>
        <EditProduct
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => setEditingProduct(null)}
        />
      </Portal>
    );
  }

  return (
    <Portal>
      <div className="catmodal-overlay" onClick={onClose}>
        <div className="catmodal-card" onClick={(e) => e.stopPropagation()}>
          <div className="catmodal-header">
            <h2 className="catmodal-title">
              {isEdit ? "Editar categoría" : "Nueva categoría"}
            </h2>
            <button
              type="button"
              className="catmodal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {error && <div className="catmodal-error">{error}</div>}

          <form onSubmit={handleSubmit} className="catmodal-form">
            {/* Nombre */}
            <label className="catmodal-label">
              Nombre
              <input
                className="catmodal-input"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Entrantes, Vinos tintos…"
                maxLength={100}
                autoFocus
              />
            </label>

            {/* Descripción */}
            <label className="catmodal-label">
              Descripción
              <span className="catmodal-hint">Se mostrará en la carta del cliente</span>
              <textarea
                className="catmodal-textarea"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve descripción de la categoría…"
                maxLength={300}
                rows={2}
              />
            </label>

            {/* Icono */}
            <label className="catmodal-label">
              Icono
              <input
                className="catmodal-input catmodal-input--icono"
                type="text"
                value={icono}
                onChange={(e) => setIcono(e.target.value)}
                placeholder="🍽️"
                maxLength={50}
              />
            </label>

            {/* Selector rápido de iconos */}
            <div className="catmodal-iconos-grid">
              {ICONOS_SUGERIDOS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`catmodal-icono-btn ${icono === emoji ? "is-selected" : ""}`}
                  onClick={() => setIcono(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* ========================================
               Opciones avanzadas (collapsible)
            ======================================== */}
            <button
              type="button"
              className="catmodal-advanced-toggle"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? "▾ Opciones avanzadas" : "▸ Opciones avanzadas"}
              <span className="catmodal-hint" style={{ marginLeft: "0.5rem" }}>
                Traducciones, orden
              </span>
            </button>

            {showAdvanced && (
              <div className="catmodal-advanced">
                {/* Orden */}
                <label className="catmodal-label">
                  Orden
                  <span className="catmodal-hint">Menor número = aparece primero (o arrastra en el panel)</span>
                  <input
                    className="catmodal-input catmodal-input--orden"
                    type="number"
                    value={orden}
                    onChange={(e) => setOrden(Number(e.target.value) || 0)}
                    min={0}
                  />
                </label>

                {/* EN */}
                <div className="catmodal-trad-group">
                  <span className="catmodal-trad-flag">🇬🇧 Inglés</span>
                  <input
                    className="catmodal-input"
                    type="text"
                    value={trEN.nombre}
                    onChange={(e) => setTrEN((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="Category name in English"
                    maxLength={100}
                  />
                  <input
                    className="catmodal-input"
                    type="text"
                    value={trEN.descripcion}
                    onChange={(e) => setTrEN((p) => ({ ...p, descripcion: e.target.value }))}
                    placeholder="Description in English"
                    maxLength={300}
                  />
                </div>

                {/* FR */}
                <div className="catmodal-trad-group">
                  <span className="catmodal-trad-flag">🇫🇷 Francés</span>
                  <input
                    className="catmodal-input"
                    type="text"
                    value={trFR.nombre}
                    onChange={(e) => setTrFR((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="Nom de la catégorie en français"
                    maxLength={100}
                  />
                  <input
                    className="catmodal-input"
                    type="text"
                    value={trFR.descripcion}
                    onChange={(e) => setTrFR((p) => ({ ...p, descripcion: e.target.value }))}
                    placeholder="Description en français"
                    maxLength={300}
                  />
                </div>
              </div>
            )}

            {/* ========================================
               Productos asociados (solo en edición)
            ======================================== */}
            {isEdit && (
              <div className="catmodal-products">
                <span className="catmodal-products-title">
                  Productos en esta categoría
                  {!loadingProds && (
                    <span className="catmodal-products-count">{productos.length}</span>
                  )}
                </span>

                <div className="catmodal-products-scroll">
                  {loadingProds ? (
                    <span className="catmodal-products-empty">Cargando…</span>
                  ) : productos.length === 0 ? (
                    <span className="catmodal-products-empty">Sin productos</span>
                  ) : (
                    productos.map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        className="catmodal-product-row"
                        onClick={() => setEditingProduct(p)}
                        title="Editar producto"
                      >
                        <span className="catmodal-product-name">{p.nombre}</span>
                        <span className="catmodal-product-price">
                          {Number(p.precios?.precioBase || 0).toFixed(2)} €
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="catmodal-actions">
              <button
                type="button"
                className="catmodal-btn catmodal-btn--cancel"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="catmodal-btn catmodal-btn--save"
                disabled={saving}
              >
                {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear categoría"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default CategoriaFormModal;
