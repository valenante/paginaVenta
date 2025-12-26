import React, { useEffect, useState } from "react";
import Portal from "../ui/Portal";
import ModalConfirmacion from "../Modal/ModalConfirmacion";

import { useShopCategorias } from "../../context/ShopCategoriasContext";
import EditProductShop from "../ShopProductsModals/EditProductShop";
import CrearProductoShop from "../ShopProductsModals/CrearProductoShop";

import "./ShopCategories.css";

const money = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "-";
  return `${v.toFixed(2)} €`;
};

export default function ShopCategories({ category, type }) {
  const { products, fetchProducts, deleteProduct } = useShopCategorias();

  const [editing, setEditing] = useState(null);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    if (category && type) {
      fetchProducts({ category, type });
    }
  }, [category, type, fetchProducts]);

  const total = Array.isArray(products) ? products.length : 0;

  const recargar = () => fetchProducts({ category, type });

  const confirmarEliminacion = async (id) => {
    await deleteProduct(id);
    setToDelete(null);
    recargar();
  };

  return (
    <div className="shopcats-root">
      <header className="shopcats-header">
        <div>
          <h3 className="shopcats-title">{category}</h3>
          <p className="shopcats-subtitle">
            {editing
              ? `Editando: ${editing.nombre}`
              : total === 0
              ? "Aún no hay ítems en esta categoría."
              : `${total} ítem${total !== 1 ? "s" : ""} en esta categoría.`}
          </p>
        </div>

        {!editing && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => setMostrarCrear(true)}
          >
            ➕ Nuevo
          </button>
        )}
      </header>

      <section className="shopcats-body">
        {total === 0 ? (
          <div className="shopcats-empty">
            <p className="muted">
              Empieza creando un {type === "servicio" ? "servicio" : "producto"}.
            </p>
            <button className="btn-secondary" onClick={() => setMostrarCrear(true)}>
              Crear primero
            </button>
          </div>
        ) : (
          <div className="shopcats-grid">
            {products.map((p) => {
              const itemType = p.itemType || p.type || "producto"; // por si viene legacy
              const precioVenta = p?.precios?.venta ?? p?.precio ?? null;
              const precioOferta = p?.precios?.oferta ?? null;

              const stock = p?.inventario?.stock ?? p?.stockActual ?? null;
              const stockMin = p?.inventario?.stockMinimo ?? p?.stockMinimo ?? null;

              const gestionaStock = p?.inventario?.gestionaStock ?? true;
              const estado = p?.estado || "habilitado";

              return (
                <article key={p._id} className="shopcats-card">
                  <div className="shopcats-cardMain">
                    <div className="shopcats-name">
                      {p.nombre}
                      <span className="shopcats-pill" style={{ marginLeft: 8 }}>
                        {itemType}
                      </span>
                      <span
                        className="shopcats-pill"
                        style={{ marginLeft: 8, opacity: estado === "habilitado" ? 1 : 0.7 }}
                      >
                        {estado}
                      </span>
                    </div>

                    {/* Precio */}
                    <div className="shopcats-meta" style={{ marginTop: 6 }}>
                      <span className="shopcats-pill">
                        Precio: {money(precioVenta)}
                      </span>
                      {precioOferta != null && (
                        <span className="shopcats-pill">
                          Oferta: {money(precioOferta)}
                        </span>
                      )}

                      {/* Inventario solo si aplica */}
                      {itemType === "producto" && gestionaStock && (
                        <span className="shopcats-pill">
                          Stock: {stock ?? 0}
                          {stockMin != null ? ` (min ${stockMin})` : ""}
                        </span>
                      )}

                      {/* Servicios */}
                      {itemType === "servicio" && p?.duracionMinutos != null && (
                        <span className="shopcats-pill">
                          Duración: {p.duracionMinutos} min
                        </span>
                      )}
                    </div>

                    {/* SKU / EAN */}
                    {(p.sku || p.barcode) && (
                      <div className="shopcats-meta">
                        {p.sku && <span className="shopcats-pill">SKU: {p.sku}</span>}
                        {p.barcode && <span className="shopcats-pill">EAN: {p.barcode}</span>}
                      </div>
                    )}

                    {p.descripcion && <div className="shopcats-desc">{p.descripcion}</div>}
                  </div>

                  <div className="shopcats-actions">
                    <button className="btn-ghost" onClick={() => setEditing(p)}>
                      Editar
                    </button>
                    <button className="btn-danger" onClick={() => setToDelete(p)}>
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modales */}
      {editing && (
        <Portal>
          <EditProductShop
            product={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              recargar();
            }}
          />
        </Portal>
      )}

      {mostrarCrear && (
        <Portal>
          <CrearProductoShop
            type={type}
            defaultCategory={category}
            onClose={() => setMostrarCrear(false)}
            onCreated={recargar}
          />
        </Portal>
      )}

      {toDelete && (
        <ModalConfirmacion
          titulo="Eliminar ítem"
          mensaje={`¿Seguro que deseas eliminar "${toDelete.nombre}"?`}
          onConfirm={() => confirmarEliminacion(toDelete._id)}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
