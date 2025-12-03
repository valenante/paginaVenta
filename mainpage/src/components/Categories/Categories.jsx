// src/components/Categories/Categories.jsx
import React, { useState, useEffect } from "react";
import { useCategorias } from "../../context/CategoriasContext";
import * as logger from "../../utils/logger";

import EditProduct from "./EditProducts";
import CrearProducto from "./CrearProducto";

import AlertaMensaje from "../AlertaMensaje/AlertaMensaje";
import ModalConfirmacion from "../Modal/ModalConfirmacion";
import Portal from "../ui/Portal";

import "./Categories.css";

const Categories = ({ category }) => {
  const [editingProduct, setEditingProduct] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState(null);
  const [productoAEliminar, setProductoAEliminar] = useState(null);

  const { products, fetchProducts, updateProduct, deleteProduct } =
    useCategorias();

  // Cargar productos de la categoría seleccionada
  useEffect(() => {
    if (category) {
      fetchProducts(category);
    }
  }, [category, fetchProducts]);

  // --- EDITAR PRODUCTO ---
  const handleEdit = (product) => setEditingProduct(product);

  const handleCancel = () => setEditingProduct(null);

  const handleSave = async (updatedProduct) => {
    try {
      await updateProduct(updatedProduct);
      setEditingProduct(null);
      await fetchProducts(category);

      setMensajeAlerta({
        tipo: "exito",
        mensaje: "Producto actualizado correctamente",
      });
    } catch (error) {
      logger.error("Error al guardar producto:", error);
      setMensajeAlerta({
        tipo: "error",
        mensaje: "No se pudo guardar el producto",
      });
    }
  };

  // --- ELIMINAR PRODUCTO ---
  const confirmarEliminacion = async (id) => {
    try {
      await deleteProduct(id);
      await fetchProducts(category);

      setMensajeAlerta({
        tipo: "exito",
        mensaje: "Producto eliminado con éxito",
      });
    } catch (error) {
      logger.error("Error al eliminar producto:", error);
      setMensajeAlerta({
        tipo: "error",
        mensaje: "No se pudo eliminar el producto",
      });
    } finally {
      setProductoAEliminar(null);
    }
  };

  const totalProductos = products?.length || 0;

  return (
    <div className="categories--categories alef-categories-root">
      {/* ===== HEADER ===== */}
      <header className="categories-header--categories">
        <div>
          <h3 className="categories-title--categories">
            {category || "Categoría"}
          </h3>

          <p className="categories-subtitle--categories">
            {editingProduct
              ? `Editando: ${editingProduct.nombre}`
              : totalProductos === 0
                ? "No hay productos en esta categoría."
                : `${totalProductos} producto${totalProductos !== 1 ? "s" : ""} en esta categoría.`}
          </p>
        </div>

        {!editingProduct && (
          <button
            onClick={() => setMostrarFormulario(true)}
            className="btn-crear-header--categories"
            type="button"
          >
            ➕ Nuevo producto
          </button>
        )}
      </header>

      {/* ===== CONTENIDO ===== */}
      <section className="categories-body--categories">
        {editingProduct ? (
          <Portal>
            <EditProduct
              product={editingProduct}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={(id) => setProductoAEliminar(id)}
            />
          </Portal>
        ) : (
          <>
            {totalProductos === 0 ? (
              <div className="empty-state--categories">
                <p>
                  Esta categoría aún no tiene productos. Empieza creando uno para
                  que aparezca en la carta.
                </p>

                <button
                  onClick={() => setMostrarFormulario(true)}
                  className="btn-empty-create--categories"
                  type="button"
                >
                  Crear primer producto
                </button>
              </div>
            ) : (
              <div className="productos-grid--categories">
                {products.map((product) => (
                  <article
                    key={product._id}
                    className="producto-card--categories"
                  >
                    <div className="producto-main--categories">
                      <p className="producto-nombre--categories">
                        {product.nombre}
                      </p>

                      {product.descripcion && (
                        <p className="producto-descripcion--categories">
                          {product.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="producto-meta--categories">
                      {product.tipo && (
                        <span className="producto-chip--categories">
                          {product.tipo === "plato" ? "Plato" : "Bebida"}
                        </span>
                      )}

                      {product.categoria && (
                        <span className="producto-chip-sec--categories">
                          {product.categoria}
                        </span>
                      )}
                    </div>

                    <div className="producto-botones--categories">
                      <button
                        onClick={() => handleEdit(product)}
                        className="boton-editar--categories"
                        type="button"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => setProductoAEliminar(product._id)}
                        className="boton-eliminar--categories"
                        type="button"
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* ===== BOTÓN INFERIOR (móvil) ===== */}
      {!editingProduct && (
        <div className="categories-footer--categories">
          <button
            onClick={() => setMostrarFormulario(true)}
            className="boton-crear--categories"
            type="button"
          >
            ➕ Crear producto
          </button>
        </div>
      )}

      {/* ===== MODAL CREAR PRODUCTO ===== */}
      {mostrarFormulario && (
        <Portal>
          <CrearProducto
            onClose={() => setMostrarFormulario(false)}
            onCreated={() => fetchProducts(category)}
          />
        </Portal>
      )}

      {/* ===== MODAL CONFIRMAR ELIMINAR ===== */}
      {productoAEliminar && (
        <ModalConfirmacion
          titulo="Eliminar producto"
          mensaje="¿Estás seguro de que quieres eliminar este producto?"
          onConfirm={() => confirmarEliminacion(productoAEliminar)}
          onClose={() => setProductoAEliminar(null)}
        />
      )}

      {/* ===== ALERTA ===== */}
      {mensajeAlerta && (
        <AlertaMensaje
          tipo={mensajeAlerta.tipo}
          mensaje={mensajeAlerta.mensaje}
          onClose={() => setMensajeAlerta(null)}
        />
      )}
    </div>
  );
};

export default Categories;
