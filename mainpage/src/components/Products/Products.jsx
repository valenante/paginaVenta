// src/components/Products/Products.jsx
import React, { useState, useEffect } from "react";
import Categories from "../Categories/Categories";
import CrearProducto from "../Categories/CrearProducto";
import { useCategorias } from "../../context/CategoriasContext";
import "./Products.css";
import Portal from "../ui/Portal";

const Products = ({ type, categories }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const { categoryObjectsByTipo, fetchCategoryObjects } = useCategorias();

  // Cargar objetos categoría para mostrar icono + descripción
  useEffect(() => {
    if (type && type !== "extras") {
      fetchCategoryObjects(type);
    }
  }, [type, fetchCategoryObjects]);

  const catObjects = categoryObjectsByTipo[type] || [];

  // Mapa nombre → objeto para enriquecer las categorías legacy (strings)
  const catMap = {};
  catObjects.forEach((c) => {
    catMap[c.nombre] = c;
  });

  const handleCrearProducto = () => setMostrarFormulario(true);

  const labelTipo =
    type === "bebida" ? "Bebidas" : type === "plato" ? "Platos" : "Productos";

  return (
    <div className="products--products alef-products-root">
      {/* ===== CABECERA ===== */}
      <header className="products-header--products">
        <div>
          <h2 className="products-title--products">
            {selectedCategory ? (
              <>
                {labelTipo} · <span>{selectedCategory}</span>
              </>
            ) : (
              labelTipo
            )}
          </h2>
          <p className="products-subtitle--products">
            {selectedCategory
              ? "Edita los productos de esta categoría."
              : "Elige una categoría o crea un nuevo producto."}
          </p>
        </div>

        {!selectedCategory && (
          <button
            type="button"
            onClick={handleCrearProducto}
            className="boton-crear--products boton-crear-main--products"
          >
            + Nuevo producto
          </button>
        )}
      </header>

      {/* ===== CONTENIDO ===== */}
      {!selectedCategory ? (
        <section className="categories-wrapper--products">
          {categories.length === 0 ? (
            <div className="no-categories-card--products">
              <p className="cargando-categorias--products">
                Todavía no hay categorías. Créalas desde el panel de categorías
                en la vista principal.
              </p>
            </div>
          ) : (
            <div className="categories-card--products">
              <h3 className="categories-title--products">
                Categorías disponibles
              </h3>
              <div className="buttons--products buttons-grid--products">
                {categories.map((categoryName, index) => {
                  const catObj = catMap[categoryName];
                  return (
                    <button
                      key={catObj?._id || index}
                      onClick={() => setSelectedCategory(categoryName)}
                      className="button--products category-pill--products"
                    >
                      {catObj?.icono && (
                        <span className="category-icono--products">{catObj.icono}</span>
                      )}
                      <span className="category-pill-content--products">
                        <span className="category-pill-nombre--products">
                          {categoryName}
                        </span>
                        {catObj?.descripcion && (
                          <span className="category-pill-desc--products">
                            {catObj.descripcion}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="categories-footer--products">
                <button
                  onClick={handleCrearProducto}
                  className="boton-crear--products boton-crear-secundario--products"
                >
                  + Crear producto en cualquier categoría
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="category-panel--products">
          <div className="category-panel-header--products">
            <button
              type="button"
              className="volver-categorias--products"
              onClick={() => setSelectedCategory(null)}
            >
              ← Volver a categorías
            </button>
            <h3>
              {catMap[selectedCategory]?.icono && (
                <span style={{ marginRight: "0.4rem" }}>
                  {catMap[selectedCategory].icono}
                </span>
              )}
              {selectedCategory}
            </h3>
          </div>

          {catMap[selectedCategory]?.descripcion && (
            <p className="category-panel-desc--products">
              {catMap[selectedCategory].descripcion}
            </p>
          )}

          <Categories category={selectedCategory} tipo={type} />
        </section>
      )}

      {/* ===== MODAL CREAR PRODUCTO ===== */}
      {mostrarFormulario && (
        <Portal>
          <CrearProducto
            onClose={() => setMostrarFormulario(false)}
          />
        </Portal>
      )}
    </div>
  );
};

export default Products;
