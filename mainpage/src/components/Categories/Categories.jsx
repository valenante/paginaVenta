// src/components/Categories/Categories.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useCategorias } from "../../context/CategoriasContext";
import * as logger from "../../utils/logger";
import { useAuth } from "../../context/AuthContext";

import EditProduct from "./EditProducts";
import CrearProducto from "./CrearProducto";

import AlertaMensaje from "../AlertaMensaje/AlertaMensaje";
import ModalConfirmacion from "../Modal/ModalConfirmacion";
import ModalReceta from "../Recetas/ModalReceta";
import Portal from "../ui/Portal";

import "./Categories.css";

const Categories = ({ category, tipo }) => {
  const [editingProduct, setEditingProduct] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState(null);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [productoReceta, setProductoReceta] = useState(null);
  const { user } = useAuth();
  const isPlanEsencial = user?.plan === "esencial" || user?.plan === "tpv-esencial";

  const { productsByKey, fetchProducts, updateProduct, deleteProduct, fetchCategories } = useCategorias();

  // Cargar productos de la categoría seleccionada
  const key = useMemo(() => {
    if (!tipo || !category) return null;
    return `${tipo}::${category}`;
  }, [tipo, category]);

  const products = key ? (productsByKey[key] || []) : [];

  useEffect(() => {
    if (tipo && category) {
      fetchProducts({ tipo, categoria: category });
    }
  }, [tipo, category, fetchProducts]);

  const totalProductos = products.length;

  // --- EDITAR PRODUCTO ---
  const handleEdit = (product) => setEditingProduct(product);

  const handleCancel = () => setEditingProduct(null);

  const handleSave = async (updatedProduct) => {
    try {
      await updateProduct(updatedProduct._id, updatedProduct);
      setEditingProduct(null);
      await fetchProducts({ tipo, categoria: category }, { force: true });

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
      await fetchProducts({ tipo, categoria: category }, { force: true });

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

                      {/* Botón Receta */}
                      {isPlanEsencial ? (
                        <button
                          className="boton-receta--categories disabled"
                          type="button"
                          disabled
                          title="Disponible solo en el plan Profesional"
                          style={{
                            opacity: 0.45,
                            cursor: "not-allowed",
                          }}
                        >
                          🔒 Receta
                        </button>
                      ) : (
                        <button
                          onClick={() => setProductoReceta(product)}
                          className="boton-receta--categories"
                          type="button"
                        >
                          🍳 Receta
                        </button>
                      )}

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
  onCreated={() => {
    fetchProducts({ tipo, categoria: category }, { force: true });
    fetchCategories(tipo, { force: true }); // 👈 para categorías nuevas
  }}
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

      {/* ===== MODAL RECETA ===== */}
      {productoReceta && (
        <Portal>
          <ModalReceta
            producto={productoReceta}
            onClose={() => setProductoReceta(null)}
          />
        </Portal>
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
