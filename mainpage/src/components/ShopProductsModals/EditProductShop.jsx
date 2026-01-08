import React, { useMemo, useState } from "react";
import { useShopCategorias } from "../../context/ShopCategoriasContext";
import "./ShopProductModals.css";

export default function EditProductShop({ product, onClose, onSaved }) {
  const { updateProduct } = useShopCategorias();

  const esServicio = useMemo(() => {
    const t = (product?.itemType || product?.type || "").toLowerCase();
    return t === "servicio";
  }, [product]);

  // ✅ Lee de tu modelo real (con fallbacks)
  const [nombre, setNombre] = useState(product?.nombre || "");
  const [categoria, setCategoria] = useState(product?.categoria || "");
  const [sku, setSku] = useState(product?.sku || "");

  const [barcode, setBarcode] = useState(
    product?.barcode || product?.codigoBarras || ""
  );

  const [precio, setPrecio] = useState(
    String(product?.precios?.venta ?? product?.precio ?? "")
  );

  const [stockActual, setStockActual] = useState(
    String(product?.inventario?.stock ?? product?.stockActual ?? "")
  );

  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // ✅ Construye payload en el formato de tu BD
      const payload = {
        _id: product._id,
        nombre,
        categoria,
        sku: sku || undefined,

        // usa el nombre correcto del modelo
        codigoBarras: barcode || undefined,

        precios: {
          ...(product?.precios || {}),
          venta: precio === "" ? 0 : Number(precio),
        },
      };

      if (!esServicio) {
        payload.inventario = {
          ...(product?.inventario || {}),
          stock: stockActual === "" ? 0 : Number(stockActual),
        };
      }

      await updateProduct(payload);

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
              <span>EAN / Código de barras</span>
              <input value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </label>
          </div>

          <div className="shopprod-row">
            <label className="shopprod-field">
              <span>Precio</span>
              <input
                type="number"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </label>

            {!esServicio && (
              <label className="shopprod-field">
                <span>Stock actual</span>
                <input
                  type="number"
                  value={stockActual}
                  onChange={(e) => setStockActual(e.target.value)}
                />
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
