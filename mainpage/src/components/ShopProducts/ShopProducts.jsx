import React, { useState, useEffect } from "react";
import Portal from "../ui/Portal";
import ShopCategories from "../ShopCategories/ShopCategories";
import CrearProductoShop from "../ShopProductsModals/CrearProductoShop";
import "./ShopProducts.css";

export default function ShopProducts({ categories }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // 🔄 si desaparece la categoría seleccionada
  useEffect(() => {
    if (selectedCategory && !categories?.includes(selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [categories, selectedCategory]);

  return (
    <div className="products--products alef-products-root">
      {/* ===== CABECERA ===== */}
      <header className="products-header--products">
        <div>
          <h2 className="products-title--products">
            {selectedCategory ? (
              <>
                Productos · <span>{selectedCategory}</span>
              </>
            ) : (
              "Productos"
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
            className="boton-crear--products boton-crear-main--products"
            onClick={() => setMostrarFormulario(true)}
          >Nuevo producto
          </button>
        )}
      </header>

      {/* ===== CONTENIDO ===== */}
      {!selectedCategory ? (
        <section className="categories-wrapper--products">
          {(!categories || categories.length === 0) ? (
            <div className="no-categories-card--products">
              <p className="cargando-categorias--products">
                Todavía no hay categorías. Crea tu primer producto para empezar
                a construir el catálogo.
              </p>

              <button
                className="boton-crear--products boton-crear-secundario--products"
                onClick={() => setMostrarFormulario(true)}
              >Crear primer producto
              </button>
            </div>
          ) : (
            <div className="categories-card--products">
              <h3 className="categories-title--products">
                Categorías disponibles
              </h3>

              <div className="buttons--products buttons-grid--products">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className="button--products category-pill--products"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="categories-footer--products">
                <button
                  className="boton-crear--products boton-crear-secundario--products"
                  onClick={() => setMostrarFormulario(true)}
                >Crear producto en cualquier categoría
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
            >Volver a categorías
            </button>
            <h3>{selectedCategory}</h3>
          </div>

          <ShopCategories category={selectedCategory} type="producto" />
        </section>
      )}

      {/* ===== MODAL ===== */}
      {mostrarFormulario && (
        <Portal>
          <CrearProductoShop
            defaultCategory={selectedCategory}
            onClose={() => setMostrarFormulario(false)}
          />
        </Portal>
      )}
    </div>
  );
}
