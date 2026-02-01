import React, { useState } from "react";
import { useShopCategorias } from "../../context/ShopCategoriasContext";
import "../Categories/CrearProducto.css";

export default function CrearProductoShop({ defaultCategory, onClose, onCreated }) {
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

        // 👇 tu schema usa itemType
        itemType: "producto",

        // 👇 precios requerido
        precios: {
          venta: Number(formData.precio) || 0,
          oferta: null,
          coste: null,
        },

        // 👇 inventario embebido
        inventario: {
          gestionaStock: true,
          stock: Number(formData.stockActual) || 0,
          stockMinimo: Number(formData.stockMinimo) || 0,
          // stockCritico no lo estás usando en schema: si lo tienes, lo añadimos
          stockCritico: Number(formData.stockCritico) || 0,
          stockMaximo: formData.stockMax === "" ? null : Number(formData.stockMax),
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
        <h2 className="titulo--crear">Crear producto (Shop)</h2>

        <form onSubmit={handleSubmit} className="form--crear">
          {/* =========================
              BLOQUE: Información básica
              ========================= */}
          <section className="form-section--crear">
            <h4 className="subtitulo--crear">🧾 Información básica</h4>
            <p className="help-text--crear">
              Estos datos son los que usarás para identificar el producto dentro del catálogo.
              La categoría sirve para agrupar y filtrar productos.
            </p>

            <div className="form-group--crear">
              <label className="label--crear">
                Nombre
                <input
                  className="input--crear"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Detergente 1L"
                />
                <p className="help-text--crear">
                  Nombre visible en el catálogo y en el panel de gestión.
                </p>
              </label>

              <label className="label--crear">
                Categoría
                <input
                  className="input--crear"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                  placeholder="Ej: limpieza"
                />
                <p className="help-text--crear">
                  Puedes crear una categoría nueva escribiéndola aquí.
                </p>
              </label>
            </div>
          </section>

          {/* =========================
              BLOQUE: Identificadores
              ========================= */}
          <section className="form-section--crear">
            <h4 className="subtitulo--crear">🏷️ Identificadores (opcional)</h4>
            <p className="help-text--crear">
              Sirven para control interno, inventario y escaneo rápido en caja.
            </p>

            <div className="form-group--crear">
              <label className="label--crear">
                SKU
                <input
                  className="input--crear"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="Ej: LIM-DET-001"
                />
                <p className="help-text--crear">
                  Código interno del producto (si usas SKUs).
                </p>
              </label>

              <label className="label--crear">
                Barcode / EAN
                <input
                  className="input--crear"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Ej: 8412345678901"
                />
                <p className="help-text--crear">
                  Código de barras para escaneo (EAN / UPC).
                </p>
              </label>
            </div>
          </section>

          {/* =========================
              BLOQUE: Precio de venta
              ========================= */}
          <section className="form-section--crear">
            <h4 className="subtitulo--crear">💰 Precio</h4>
            <p className="help-text--crear">
              Este es el precio de venta que verá el cliente o que se usará en caja.
            </p>

            <div className="form-group--crear">
              <label className="label--crear">
                Precio de venta (€)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input--crear"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 3.50"
                />
                <p className="help-text--crear">
                  Requerido. Puedes ajustar ofertas y costes más adelante si lo necesitas.
                </p>
              </label>
            </div>
          </section>

          {/* =========================
              BLOQUE: Stock / Inventario
              ========================= */}
          <section className="form-section--crear">
            <h4 className="subtitulo--crear">📦 Stock e inventario</h4>
            <p className="help-text--crear">
              Define el stock actual y los umbrales. Útil para avisos y control de reposición.
            </p>

            <div className="form-columns--crear">
              <div className="form-group--crear">
                <label className="label--crear">
                  Stock actual
                  <input
                    type="number"
                    min="0"
                    className="input--crear"
                    name="stockActual"
                    value={formData.stockActual}
                    onChange={handleChange}
                    placeholder="Ej: 30"
                  />
                  <p className="help-text--crear">
                    Cantidad disponible ahora mismo.
                  </p>
                </label>

                <label className="label--crear">
                  Stock mínimo
                  <input
                    type="number"
                    min="0"
                    className="input--crear"
                    name="stockMinimo"
                    value={formData.stockMinimo}
                    onChange={handleChange}
                    placeholder="Ej: 10"
                  />
                  <p className="help-text--crear">
                    Cuando baje de este valor, deberías reponer.
                  </p>
                </label>
              </div>

              <div className="form-group--crear">
                <label className="label--crear">
                  Stock crítico
                  <input
                    type="number"
                    min="0"
                    className="input--crear"
                    name="stockCritico"
                    value={formData.stockCritico}
                    onChange={handleChange}
                    placeholder="Ej: 3"
                  />
                  <p className="help-text--crear">
                    Umbral de alerta fuerte (para avisos urgentes).
                  </p>
                </label>

                <label className="label--crear">
                  Stock máximo
                  <input
                    type="number"
                    min="0"
                    className="input--crear"
                    name="stockMax"
                    value={formData.stockMax}
                    onChange={handleChange}
                    placeholder="Ej: 100"
                  />
                  <p className="help-text--crear">
                    Opcional. Útil si quieres un objetivo de reposición.
                  </p>
                </label>
              </div>
            </div>
          </section>

          {/* =========================
              BOTONES
              ========================= */}
          <div className="botones--crear">
            <button type="submit" className="boton--crear" disabled={saving}>
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
