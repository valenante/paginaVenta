// src/components/Products/Products.jsx
import React, { useState } from "react";
import Categories from "../Categories/Categories";
import CrearProducto from "../Categories/CrearProducto";
import "./Products.css";
import Portal from "../ui/Portal";

const Products = ({ type, categories }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleCrearProducto = () => setMostrarFormulario(true);

  const labelTipo =
    type === "bebida" ? "Bebidas" : type === "plato" ? "Platos" : "Productos";

  return (
    <div className="products--products alef-products-root">
      {/* ===== CABECERA PEQUEÑA DENTRO DEL PANEL ===== */}
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
            ➕ Nuevo producto
          </button>
        )}
      </header>

      {/* ===== CONTENIDO ===== */}
      {!selectedCategory ? (
        <section className="categories-wrapper--products">
          {categories.length === 0 ? (
            <div className="no-categories-card--products">
              <p className="cargando-categorias--products">
                Todavía no hay categorías. Crea tu primer producto para empezar
                a construir la carta.
              </p>
              <button
                onClick={handleCrearProducto}
                className="boton-crear--products"
              >
                Crear producto
              </button>
            </div>
          ) : (
            <div className="categories-card--products">
              <h3 className="categories-title--products">
                Categorías disponibles
              </h3>
              <div className="buttons--products buttons-grid--products">
                {categories.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedCategory(category)}
                    className="button--products category-pill--products"
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="categories-footer--products">
                <button
                  onClick={handleCrearProducto}
                  className="boton-crear--products boton-crear-secundario--products"
                >
                  ➕ Crear producto en cualquier categoría
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
            <h3>{selectedCategory}</h3>
          </div>

          {/* 👇 contenido original: listado + edición de productos */}
          <Categories category={selectedCategory} />
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
