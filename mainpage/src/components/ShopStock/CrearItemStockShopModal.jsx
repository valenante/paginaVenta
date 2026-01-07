import React, { useState } from "react";
import api from "../../utils/api";
import "./ShopStockModals.css"; // MISMO CSS

export default function CrearProductoShopModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    sku: "",
    precio: "",
    stock: 0,
    stockMinimo: 0,
    stockMaximo: 100,
    unidadMedida: "ud",
  });

  const [loading, setLoading] = useState(false);

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const crear = async () => {
    try {
      setLoading(true);

      await api.post("/shop/stock/producto", {
        nombre: form.nombre,
        categoria: form.categoria,
        sku: form.sku,
        precios: { venta: Number(form.precio) },
        inventario: {
          gestionaStock: true,
          stock: Number(form.stock),
          stockMinimo: Number(form.stockMinimo),
          stockMaximo: Number(form.stockMaximo),
          unidadMedida: form.unidadMedida,
          permiteDecimal: false,
        },
      });

      onSave?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error creando producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alef-modal-overlay" onClick={onClose}>
      <div className="alef-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="crear-ingrediente-modal">
          <h3>➕ Nuevo producto</h3>
          <p>Registra un nuevo producto de tienda.</p>

          <label className="label--editar">
            Nombre
            <input
              className="input--editar"
              name="nombre"
              value={form.nombre}
              onChange={update}
            />
          </label>

          <label className="label--editar">
            Categoría
            <input
              className="input--editar"
              name="categoria"
              value={form.categoria}
              onChange={update}
            />
          </label>

          <label className="label--editar">
            SKU
            <input
              className="input--editar"
              name="sku"
              value={form.sku}
              onChange={update}
            />
          </label>

          <label className="label--editar">
            Precio venta (€)
            <input
              className="input--editar"
              type="number"
              name="precio"
              value={form.precio}
              onChange={update}
            />
          </label>

          <label className="label--editar">
            Stock inicial
            <input
              className="input--editar"
              type="number"
              name="stock"
              value={form.stock}
              onChange={update}
            />
          </label>

          <label className="label--editar">
            Stock mínimo
            <input
              className="input--editar"
              type="number"
              name="stockMinimo"
              value={form.stockMinimo}
              onChange={update}
            />
          </label>

          <label className="label--editar">
            Stock máximo
            <input
              className="input--editar"
              type="number"
              name="stockMaximo"
              value={form.stockMaximo}
              onChange={update}
            />
          </label>

          <div className="botones--editar">
            <button className="boton--cancelar" onClick={onClose}>
              Cancelar
            </button>

            <button
              className="boton--editar"
              onClick={crear}
              disabled={loading}
            >
              {loading ? "Guardando…" : "Crear producto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
