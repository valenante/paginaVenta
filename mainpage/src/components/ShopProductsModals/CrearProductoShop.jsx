import React, { useState } from "react";
import { useShopCategorias } from "../../context/ShopCategoriasContext";
import "../Categories/CrearProducto.css";

export default function CrearProductoShop({
  defaultCategory,
  onClose,
  onCreated,
}) {
  const { createProduct } = useShopCategorias();

  const [formData, setFormData] = useState({
    nombre: "",
    categoria: defaultCategory || "",
    sku: "",
    barcode: "",
    precio: "",
    stockActual: "",
    stockMinimo: "",
    stockCritico: "",
    stockMax: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await createProduct({
        nombre: formData.nombre,
        categoria: formData.categoria,
        sku: formData.sku || "",
        barcode: formData.barcode || "",

        // 👇 IMPORTANTE: tu schema usa itemType, no "type"
        itemType: "producto", // o "servicio" si aplica

        // 👇 IMPORTANTE: precios requerido y precios.venta requerido
        precios: {
          venta: Number(formData.precio) || 0,
          oferta: null,
          coste: null,
        },

        // 👇 Stock va dentro de inventario en tu schema (no stockActual suelto)
        inventario: {
          gestionaStock: true,
          stock: Number(formData.stockActual) || 0,
          stockMinimo: Number(formData.stockMinimo) || 0,
          stockMaximo: Number(formData.stockMax) || null,
          unidadMedida: "ud",
          permiteDecimal: false,
        },
      });
      onCreated?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="crear-producto-overlay--crear" onClick={onClose}>
      <div
        className="crear-producto-modal--crear"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="titulo--crear">Crear producto</h2>

        <form onSubmit={handleSubmit} className="form--crear">
          <div className="form-columns--crear">
            {/* ===== COLUMNA 1 ===== */}
            <section className="form-section--crear">
              <div className="form-group--crear">
                <label className="label--crear">
                  Nombre
                  <input
                    className="input--crear"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="label--crear">
                  Categoría
                  <input
                    className="input--crear"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
            </section>

            {/* ===== COLUMNA 2 ===== */}
            <section className="form-section--crear">
              <div className="form-group--crear">
                <label className="label--crear">
                  SKU
                  <input
                    className="input--crear"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                  />
                </label>

                <label className="label--crear">
                  Barcode
                  <input
                    className="input--crear"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                  />
                </label>

                <label className="label--crear">
                  Precio
                  <input
                    type="number"
                    step="0.01"
                    className="input--crear"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
            </section>
          </div>

          {/* ===== STOCK ===== */}
          <section className="form-section--crear">
            <div className="form-group--crear">
              <label className="label--crear">
                Stock actual
                <input
                  type="number"
                  className="input--crear"
                  name="stockActual"
                  value={formData.stockActual}
                  onChange={handleChange}
                />
              </label>

              <label className="label--crear">
                Stock mínimo
                <input
                  type="number"
                  className="input--crear"
                  name="stockMinimo"
                  value={formData.stockMinimo}
                  onChange={handleChange}
                />
              </label>

              <label className="label--crear">
                Stock crítico
                <input
                  type="number"
                  className="input--crear"
                  name="stockCritico"
                  value={formData.stockCritico}
                  onChange={handleChange}
                />
              </label>

              <label className="label--crear">
                Stock máximo
                <input
                  type="number"
                  className="input--crear"
                  name="stockMax"
                  value={formData.stockMax}
                  onChange={handleChange}
                />
              </label>
            </div>
          </section>

          {/* ===== BOTONES ===== */}
          <div className="botones--crear">
            <button
              type="submit"
              className="boton--crear"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              className="boton--cancelar"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
