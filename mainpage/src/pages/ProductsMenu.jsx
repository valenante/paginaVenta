// src/pages/ProductsPage.jsx
import React, { useState } from "react";
import ExtrasPanel from "../components/Extras/ExtrasPanel";
import CategoriasPanel from "../components/Categories/CategoriasPanel";
import "../styles/ProductsMenu.css";

const ProductsPage = () => {
  // 'extras' | 'carta' | null
  const [selectedType, setSelectedType] = useState(null);

  /* =====================================================
     Helpers UI
  ===================================================== */
  const resetSelection = () => setSelectedType(null);

  const getTitle = () => {
    if (!selectedType) return "Gestor de productos";
    if (selectedType === "extras") return "Gestión de extras";
    if (selectedType === "carta") return "Gestión de carta";
    return "Gestor de productos";
  };

  const getSubtitle = () => {
    if (!selectedType)
      return "Elige qué parte de la carta quieres configurar.";
    if (selectedType === "extras")
      return "Crea y organiza los extras y suplementos de tus productos.";
    if (selectedType === "carta")
      return "Gestiona categorías, platos y bebidas de tu carta. Arrastra para reordenar.";
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
            ← Volver
          </button>
        )}
      </header>

      {/* ===== SELECTOR DE TIPO ===== */}
      {!selectedType && (
        <section className="products-selector-card--productos">
          <div className="products-type-buttons--productos">
            <button
              type="button"
              onClick={() => setSelectedType("carta")}
              className="products-type-btn--productos categorias"
            >
              📋 Carta
              <span className="products-type-desc--productos">
                Categorías, platos y bebidas de tu carta.
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
            <CategoriasPanel onBack={resetSelection} />
          )}
        </section>
      )}
    </div>
  );
};

export default ProductsPage;
