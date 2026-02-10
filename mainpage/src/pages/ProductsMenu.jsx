// src/pages/ProductsPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import Products from "../components/Products/Products";
import ExtrasPanel from "../components/Extras/ExtrasPanel";
import { useCategorias } from "../context/CategoriasContext";
import "../styles/ProductsMenu.css";

const ProductsPage = () => {
  // 'bebida' | 'plato' | 'extras' | null
  const [selectedType, setSelectedType] = useState(null);

  const {
    categoriesByTipo,
    fetchCategories,
    loading,
    error,
  } = useCategorias();

  /* =====================================================
     Cargar categorías cuando se selecciona tipo
  ===================================================== */
  useEffect(() => {
    if (selectedType && selectedType !== "extras") {
      fetchCategories(selectedType);
    }
  }, [selectedType, fetchCategories]);

  /* =====================================================
     Categorías seguras para el tipo actual
  ===================================================== */
  const categories = useMemo(() => {
    if (!selectedType || selectedType === "extras") return [];
    return Array.isArray(categoriesByTipo[selectedType])
      ? categoriesByTipo[selectedType]
      : [];
  }, [categoriesByTipo, selectedType]);

  /* =====================================================
     Helpers UI
  ===================================================== */
  const resetSelection = () => setSelectedType(null);

  const getTitle = () => {
    if (!selectedType) return "Gestor de productos";
    if (selectedType === "bebida") return "Gestión de bebidas";
    if (selectedType === "plato") return "Gestión de platos";
    if (selectedType === "extras") return "Gestión de extras";
    return "Gestor de productos";
  };

  const getSubtitle = () => {
    if (!selectedType)
      return "Elige qué parte de la carta quieres configurar.";
    if (selectedType === "bebida")
      return "Edita precios, categorías y stock de todas tus bebidas.";
    if (selectedType === "plato")
      return "Gestiona platos, traducciones, alérgenos y precios.";
    if (selectedType === "extras")
      return "Crea y organiza los extras y suplementos de tus productos.";
    return "";
  };

  /* =====================================================
     Render
  ===================================================== */
  return (
    <div className="products-page--productos alef-products-page">
      {/* ===== HEADER ===== */}
      <header className="products-header--productos">
        <div>
          <h1 className="products-title--productos">{getTitle()}</h1>
          <p className="products-subtitle--productos">{getSubtitle()}</p>
        </div>

        {selectedType && (
          <button
            type="button"
            className="products-back-btn--productos"
            onClick={resetSelection}
          >
            ← Cambiar tipo
          </button>
        )}
      </header>

      {/* ===== SELECTOR DE TIPO ===== */}
      {!selectedType && (
        <section className="products-selector-card--productos">
          <div className="products-type-buttons--productos">
            <button
              type="button"
              onClick={() => setSelectedType("bebida")}
              className="products-type-btn--productos bebidas"
            >
              🥂 Bebidas
              <span className="products-type-desc--productos">
                Copas, refrescos, vinos, cafés…
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType("plato")}
              className="products-type-btn--productos platos"
            >
              🍽️ Platos
              <span className="products-type-desc--productos">
                Entrantes, principales, postres y más.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType("extras")}
              className="products-type-btn--productos extras"
            >
              ➕ Extras
              <span className="products-type-desc--productos">
                Suplementos, salsas y añadidos.
              </span>
            </button>
          </div>
        </section>
      )}

      {/* ===== CONTENIDO ===== */}
      {selectedType && (
        <section className="products-content-card--productos">
          {selectedType === "extras" ? (
            <ExtrasPanel onBack={resetSelection} />
          ) : (
            <>
              {loading?.categories && (
                <p className="products-loading--productos">
                  Cargando categorías…
                </p>
              )}

              {error?.categories && (
                <p className="products-error--productos">
                  Error cargando categorías.
                </p>
              )}

              {!loading?.categories && !error?.categories && (
                <Products
                  type={selectedType}
                  categories={categories}
                />
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default ProductsPage;
