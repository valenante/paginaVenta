// src/components/ShopProducts/ShopProducts.jsx
// Gestor de productos de TIENDA con la misma estructura y clases que la Carta de restaurante
// (components/Categories/CategoriasPanel.jsx): cabecera con acciones, lista de categorías en
// filas y, dentro de cada una, las filas de producto (ShopCategories).
// Lo que NO se replica: en tienda una categoría es solo el texto `categoria` de cada producto,
// así que no hay "nueva categoría", ni icono/descripción de categoría, ni arrastrar para
// reordenar (no hay endpoint de orden para categorías de tienda).
import React, { useEffect, useState } from "react";
import Portal from "../ui/Portal";
import ShopCategories from "../ShopCategories/ShopCategories";
import CrearProductoShop from "../ShopProductsModals/CrearProductoShop";
import { useShopCategorias } from "../../context/ShopCategoriasContext";
import "../Categories/CategoriasPanel.css"; // clases de la carta de restaurante (catpanel-*)
import "../Categories/CategoriaFormModal.css"; // catmodal-error, igual que en la carta
import "./ShopProducts.css";

export default function ShopProducts() {
  const { categories, loadingCategories, errorCategories, fetchCategories } = useShopCategorias();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Sube tras cada alta, edición o baja. ShopCategories se monta de nuevo con esta key, así que
  // vuelve a pedir los productos de la categoría abierta.
  const [version, setVersion] = useState(0);

  // Si la categoría abierta desaparece (se quedó sin productos), se vuelve a la lista.
  useEffect(() => {
    if (selectedCategory && !categories?.includes(selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [categories, selectedCategory]);

  // Una alta, edición o baja puede crear o quitar categorías: se piden las dos cosas.
  const refrescarCatalogo = () => {
    fetchCategories();
    setVersion((v) => v + 1);
  };

  const sinCategorias = (categories?.length ?? 0) === 0;

  return (
    <div className="catpanel">
      {/* ===== CABECERA ===== */}
      <header className="catpanel-header">
        <div>
          <h2 className="catpanel-title">Productos</h2>
          <p className="catpanel-subtitle">
            {selectedCategory
              ? "Edita los productos de esta categoría."
              : "Organiza tu catálogo por categorías. Haz clic en una categoría para ver sus productos."}
          </p>
        </div>

        <div className="catpanel-header-actions">
          <button
            type="button"
            className="catpanel-btn-new"
            onClick={() => setMostrarFormulario(true)}
          >
            + Nuevo producto
          </button>
        </div>
      </header>

      {/* ===== LISTA DE CATEGORÍAS ===== */}
      {!selectedCategory && (
        <>
          {loadingCategories && sinCategorias ? (
            <div className="catpanel-empty">
              <p>Cargando categorías…</p>
            </div>
          ) : errorCategories ? (
            <div className="catmodal-error">{errorCategories}</div>
          ) : sinCategorias ? (
            <div className="catpanel-empty">
              <p>No hay productos todavía.</p>
              <button
                type="button"
                className="catpanel-btn-new catpanel-btn-new--small"
                onClick={() => setMostrarFormulario(true)}
              >
                + Crear primer producto
              </button>
            </div>
          ) : (
            <div className="catpanel-list">
              {categories.map((cat, index) => (
                <button
                  key={cat}
                  type="button"
                  className="catpanel-item shopproducts-categoryItem"
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span className="catpanel-item-index">{index + 1}</span>
                  <span className="catpanel-item-info">
                    <span className="catpanel-item-nombre">{cat}</span>
                  </span>
                  <span className="catpanel-expand-icon">▸</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== PRODUCTOS DE UNA CATEGORÍA ===== */}
      {selectedCategory && (
        <section>
          <div className="shopproducts-categoryHead">
            <button
              type="button"
              className="products-back-btn--productos"
              onClick={() => setSelectedCategory(null)}
            >
              Volver a categorías
            </button>
            <h3 className="shopproducts-categoryName">{selectedCategory}</h3>
          </div>

          <ShopCategories
            key={version}
            category={selectedCategory}
            type="producto"
            onCambio={refrescarCatalogo}
          />
        </section>
      )}

      {/* ===== MODAL ALTA ===== */}
      {mostrarFormulario && (
        <Portal>
          <CrearProductoShop
            defaultCategory={selectedCategory}
            onClose={() => setMostrarFormulario(false)}
            onCreated={refrescarCatalogo}
          />
        </Portal>
      )}
    </div>
  );
}
