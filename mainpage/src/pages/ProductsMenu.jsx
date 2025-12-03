// src/pages/ProductsPage.jsx
import React, { useState, useContext, useEffect } from "react";
import Products from "../components/Products/Products";
import ExtrasPanel from "../components/Extras/ExtrasPanel";
import { CategoriasContext } from "../context/CategoriasContext";
import "../styles/ProductsMenu.css";

const ProductsPage = () => {
  const [selectedType, setSelectedType] = useState(null); // 'bebida', 'plato' o 'extras'
  const { categories, fetchCategories } = useContext(CategoriasContext);

  useEffect(() => {
    if (selectedType && selectedType !== "extras") {
      fetchCategories(selectedType);
    }
  }, [selectedType, fetchCategories]);

  const handleTypeSelection = (type) => {
    setSelectedType(type);
  };

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
        )
        }
      </header>

      {/* ===== SELECTOR DE TIPO (pantalla inicial) ===== */}
      {!selectedType && (
        <section className="products-selector-card--productos">
          <div className="products-type-buttons--productos">
            <button
              type="button"
              onClick={() => handleTypeSelection("bebida")}
              className="products-type-btn--productos bebidas"
            >
              🥂 Bebidas
              <span className="products-type-desc--productos">
                Copas, refrescos, vinos, cafés…
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeSelection("plato")}
              className="products-type-btn--productos platos"
            >
              🍽️ Platos
              <span className="products-type-desc--productos">
                Entrantes, principales, postres y más.
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeSelection("extras")}
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

      {/* ===== CONTENIDO SEGÚN TIPO ===== */}
      {selectedType && (
        <section className="products-content-card--productos">
          {selectedType === "extras" ? (
            <ExtrasPanel onBack={resetSelection} />
          ) : (
            <Products type={selectedType} categories={categories} />
          )}
        </section>
      )}
    </div>
  );
};

export default ProductsPage;
