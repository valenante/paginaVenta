import React, { useMemo, useState } from "react";
import { useShopCategorias } from "../../context/ShopCategoriasContext";
import "../Categories/CrearProducto.css"; // 👈 Reutiliza el CSS PRO del modal

export default function EditProductShop({ product, onClose, onSaved }) {
  const { updateProduct } = useShopCategorias();

  const esServicio = useMemo(() => {
    const t = (product?.itemType || product?.type || "").toLowerCase();
    return t === "servicio";
  }, [product]);

  // =========================
  // STATE (mismos campos que crear)
  // =========================
  const [formData, setFormData] = useState({
    nombre: product?.nombre || "",
    categoria: product?.categoria || "",
    sku: product?.sku || "",
    barcode: product?.barcode || product?.codigoBarras || "",
    precio: String(product?.precios?.venta ?? product?.precio ?? ""),

    stockActual: String(product?.inventario?.stock ?? product?.stockActual ?? ""),
    stockMinimo: String(product?.inventario?.stockMinimo ?? product?.stockMinimo ?? ""),
    stockCritico: String(product?.inventario?.stockCritico ?? product?.stockCritico ?? ""),
    stockMax: String(product?.inventario?.stockMaximo ?? product?.stockMax ?? ""),
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // ✅ Payload en formato BD
      const payload = {
        _id: product._id,

        nombre: formData.nombre.trim(),
        categoria: formData.categoria.trim(),

        sku: formData.sku?.trim() ? formData.sku.trim() : undefined,

        // ⚠️ Decide un nombre definitivo en tu modelo:
        // si en BD es "barcode", usa barcode: ...
        // si en BD es "codigoBarras", usa codigoBarras: ...
        // aquí mando ambos por compatibilidad (puedes dejar solo uno)
        barcode: formData.barcode?.trim() ? formData.barcode.trim() : undefined,
        codigoBarras: formData.barcode?.trim() ? formData.barcode.trim() : undefined,

        precios: {
          ...(product?.precios || {}),
          venta: formData.precio === "" ? 0 : Number(formData.precio),
        },
      };

      // Inventario solo si NO es servicio
      if (!esServicio) {
        payload.inventario = {
          ...(product?.inventario || {}),
          gestionaStock: true,
          stock: formData.stockActual === "" ? 0 : Number(formData.stockActual),
          stockMinimo: formData.stockMinimo === "" ? 0 : Number(formData.stockMinimo),
          stockCritico: formData.stockCritico === "" ? 0 : Number(formData.stockCritico),
          stockMaximo: formData.stockMax === "" ? null : Number(formData.stockMax),
          unidadMedida: product?.inventario?.unidadMedida || "ud",
          permiteDecimal: product?.inventario?.permiteDecimal ?? false,
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
    <div className="crear-producto-overlay--crear">
      <div className="crear-producto-modal--crear">
        <h2 className="titulo--crear">Editar producto (Shop)</h2>

        <form onSubmit={onSubmit} className="form--crear">
          {/* =========================
              BLOQUE: Información básica
              ========================= */}
          <section className="form-section--crear">
            <h4 className="subtitulo--crear">🧾 Información básica</h4>
            <p className="help-text--crear">
              Ajusta el nombre y la categoría del producto. La categoría se usa para organizar
              y filtrar el catálogo.
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
                  Puedes mover este producto a otra categoría escribiéndola aquí.
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
              Útiles para control interno (SKU) y escaneo rápido (EAN / código de barras).
            </p>

            <div className="form-columns--crear">
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
                    Código interno del producto (si lo utilizas).
                  </p>
                </label>
              </div>

              <div className="form-group--crear">
                <label className="label--crear">
                  EAN / Código de barras
                  <input
                    className="input--crear"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="Ej: 8412345678901"
                  />
                  <p className="help-text--crear">
                    Para escaneo en caja (EAN/UPC).
                  </p>
                </label>
              </div>
            </div>
          </section>

          {/* =========================
              BLOQUE: Precio
              ========================= */}
          <section className="form-section--crear">
            <h4 className="subtitulo--crear">💰 Precio</h4>
            <p className="help-text--crear">
              Precio de venta actual. Si está vacío, se guardará como 0.
            </p>

            <div className="form-group--crear">
              <label className="label--crear">
                Precio de venta (€)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input--crear"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  placeholder="Ej: 3.50"
                />
                <p className="help-text--crear">
                  El precio que se aplicará al vender el producto.
                </p>
              </label>
            </div>
          </section>

          {/* =========================
              BLOQUE: Stock (solo si NO es servicio)
              ========================= */}
          {!esServicio && (
            <section className="form-section--crear">
              <h4 className="subtitulo--crear">📦 Stock e inventario</h4>
              <p className="help-text--crear">
                Controla existencias y umbrales. Esto permite avisos y una reposición más ordenada.
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
                    <p className="help-text--crear">Cantidad disponible ahora mismo.</p>
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
                      Cuando baje de este valor, conviene reponer.
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
                      Opcional. Útil para objetivo de reposición.
                    </p>
                  </label>
                </div>
              </div>
            </section>
          )}

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

          {/* =========================
              NOTA PARA SERVICIOS
              ========================= */}
          {esServicio && (
            <p className="help-text--crear" style={{ textAlign: "center" }}>
              Este ítem es un <strong>servicio</strong>, por eso no se gestiona stock.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
