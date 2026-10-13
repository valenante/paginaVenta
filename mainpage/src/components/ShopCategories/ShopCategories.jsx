// src/components/ShopCategories/ShopCategories.jsx
// Productos de UNA categoría de tienda, con el aspecto de las filas de producto de la carta de
// restaurante (components/Categories/CategoriasPanel.jsx → catpanel-product).
import React, { useEffect, useState } from "react";
import Portal from "../ui/Portal";
import ModalConfirmacion from "../Modal/ModalConfirmacion";
import { useShopCategorias } from "../../context/ShopCategoriasContext";
import { useLocale } from "../../hooks/useLocale";
import EditProductShop from "../ShopProductsModals/EditProductShop";
import "../Categories/CategoriasPanel.css"; // filas catpanel-product de la carta
import "../Categories/CategoriaFormModal.css"; // catmodal-error de la carta

export default function ShopCategories({ category, type, onCambio }) {
  const { products, loadingProducts, errorProducts, fetchProducts, deleteProduct } =
    useShopCategorias();
  const { formatMoney } = useLocale();

  // Mismo contrato que antes: lo no numérico sigue saliendo como "-".
  const money = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return "-";
    return formatMoney(v);
  };

  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (category && type) {
      fetchProducts({ category, type });
    }
  }, [category, type, fetchProducts]);

  const total = Array.isArray(products) ? products.length : 0;

  const confirmarEliminacion = async (prod) => {
    try {
      setDeleteError(null);
      await deleteProduct(prod._id);
      setToDelete(null);
      onCambio?.();
    } catch (err) {
      setDeleteError(err?.response?.data?.message || "No se pudo eliminar el producto.");
    }
  };

  const trasGuardar = () => {
    setEditing(null);
    onCambio?.();
  };

  return (
    <div className="catpanel-products">
      {loadingProducts ? (
        <p className="catpanel-products-loading">Cargando productos…</p>
      ) : errorProducts ? (
        <div className="catmodal-error">{errorProducts}</div>
      ) : total === 0 ? (
        <p className="catpanel-products-empty">Sin productos en esta categoría.</p>
      ) : (
        products.map((p) => {
          const itemType = p.itemType || p.type || "producto"; // por si viene legacy
          const esServicio = itemType === "servicio";

          const precioVenta = p?.precios?.venta ?? p?.precio ?? null;
          const precioOferta = p?.precios?.oferta ?? null;

          const stock = p?.inventario?.stock ?? p?.stockActual ?? null;
          const stockMin = p?.inventario?.stockMinimo ?? p?.stockMinimo ?? null;
          const gestionaStock = p?.inventario?.gestionaStock ?? true;

          // Mismo criterio que la carta de restaurante (CategoriasPanel: prod.activo !== false).
          // La tienda no tiene campo `estado`: el valor real es `activo` (ProductoShop.schema).
          const activo = p?.activo !== false;

          const detalle = [
            p.sku && `SKU ${p.sku}`,
            p.barcode && `EAN ${p.barcode}`,
            !esServicio &&
              gestionaStock &&
              `Stock ${stock ?? 0}${stockMin != null ? ` (mín ${stockMin})` : ""}`,
            esServicio && p?.duracionMinutos != null && `Duración ${p.duracionMinutos} min`,
            esServicio && "Servicio",
            p.descripcion,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <div key={p._id} className="catpanel-product">
              <div className="catpanel-product-info">
                <span className="catpanel-product-nombre">{p.nombre}</span>
                {detalle && <span className="catpanel-product-desc">{detalle}</span>}
              </div>

              <div className="catpanel-product-meta">
                <span className="catpanel-product-price">{money(precioVenta)}</span>
                {precioOferta != null && (
                  <span className="catpanel-product-price">Oferta {money(precioOferta)}</span>
                )}
                <span
                  className={`catpanel-product-estado ${
                    activo ? "catpanel-product-estado--on" : "catpanel-product-estado--off"
                  }`}
                >
                  {activo ? "Visible" : "Oculto"}
                </span>
              </div>

              <div className="catpanel-product-actions">
                <button
                  type="button"
                  className="catpanel-action-btn"
                  onClick={() => setEditing(p)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="catpanel-action-btn catpanel-action-btn--del"
                  onClick={() => setToDelete(p)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Modales */}
      {editing && (
        <Portal>
          <EditProductShop
            product={editing}
            onClose={() => setEditing(null)}
            onSaved={trasGuardar}
          />
        </Portal>
      )}

      {toDelete && (
        <ModalConfirmacion
          titulo="Eliminar producto"
          mensaje={`¿Seguro que quieres eliminar “${toDelete.nombre}”? Esta acción no se puede deshacer.`}
          textoConfirmar="Eliminar"
          onConfirm={() => confirmarEliminacion(toDelete)}
          onClose={() => {
            setToDelete(null);
            setDeleteError(null);
          }}
        >
          {deleteError && <div className="catmodal-error">{deleteError}</div>}
        </ModalConfirmacion>
      )}
    </div>
  );
}
