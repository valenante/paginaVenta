import React, { useState } from "react";
import { useShopCategorias } from "../../context/ShopCategoriasContext";
import "./ShopProductModals.css";

export default function EditProductShop({ product, onClose, onSaved }) {
  const { updateProduct } = useShopCategorias();

  const [nombre, setNombre] = useState(product?.nombre || "");
  const [categoria, setCategoria] = useState(product?.categoria || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [barcode, setBarcode] = useState(product?.barcode || "");
  const [precio, setPrecio] = useState(String(product?.precio ?? ""));
  const [stockActual, setStockActual] = useState(String(product?.stockActual ?? ""));
  const [saving, setSaving] = useState(false);

  const esServicio = product?.type === "servicio";

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProduct(product._id, {
        nombre,
        categoria,
        sku: sku || undefined,
        barcode: barcode || undefined,
        precio: precio ? Number(precio) : 0,
        ...(!esServicio ? { stockActual: stockActual ? Number(stockActual) : 0 } : {}),
      });

      onClose?.();
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay">
      <div className="modal shopprod-modal">
        <h3 className="shopprod-modal__title">Editar ítem</h3>

        <form onSubmit={onSubmit} className="shopprod-form">
          <label className="shopprod-field">
            <span>Nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>

          <label className="shopprod-field">
            <span>Categoría</span>
            <input value={categoria} onChange={(e) => setCategoria(e.target.value)} required />
          </label>

          <div className="shopprod-row">
            <label className="shopprod-field">
              <span>SKU</span>
              <input value={sku} onChange={(e) => setSku(e.target.value)} />
            </label>

            <label className="shopprod-field">
              <span>Barcode</span>
              <input value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </label>
          </div>

          <div className="shopprod-row">
            <label className="shopprod-field">
              <span>Precio</span>
              <input type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} />
            </label>

            {!esServicio && (
              <label className="shopprod-field">
                <span>Stock actual</span>
                <input type="number" value={stockActual} onChange={(e) => setStockActual(e.target.value)} />
              </label>
            )}
          </div>

          <div className="shopprod-actions">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
              Cerrar
            </button>
            <button type="submit" className="btn-secondary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
