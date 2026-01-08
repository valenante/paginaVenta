import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";
import { useTenant } from "../../context/TenantContext";
import Portal from "../ui/Portal";
import "./ProductoProveedorModal.css";

const DEFAULT = {
  nombre: "",
  unidad: "",
  formato: "",
  precio: "",
  iva: 10,
  activo: true,
  factorConversion: 1,
};

export default function ProductoProveedorModal({
  mode = "create",
  producto,
  onClose,
  onSaved,
}) {
  const isEdit = mode === "edit";
  const { proveedorId } = useParams();
  const { tenant } = useTenant();

  const headersTenant = useMemo(() => ({}), []);

  const [form, setForm] = useState(() => ({
    ...DEFAULT,
    ...(producto || {}),
    precio: producto?.precioBase ?? "",
    ingredienteId: producto?.ingredienteId || "",
    productoShopId: producto?.productoShopId || "",
    factorConversion: producto?.factorConversion ?? 1,
  }));

  const [ingredientes, setIngredientes] = useState([]);
  const [productosShop, setProductosShop] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isRest = tenant?.tipoNegocio === "restaurante";
  const isShop = tenant?.tipoNegocio === "shop";

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  /* =========================
     Cargar stock según negocio
  ========================= */
  useEffect(() => {
    if (!tenant) return;

    const load = async () => {
      try {
        if (isRest) {
          const { data } = await api.get("/stock/ingredientes");
          setIngredientes(data.ingredientes || []);
        }

        if (isShop) {
          const { data } = await api.get("/shop/stock/productos");
          setProductosShop(data.productos || []);
        }
      } catch {
        // silencioso
      }
    };

    load();
  }, [tenant, isRest, isShop]);

  /* =========================
     Validación
  ========================= */
  const validate = () => {
    if (!form.nombre.trim()) return "El nombre es obligatorio.";
    if (Number(form.precio) <= 0) return "El precio debe ser mayor que 0.";
    if (Number(form.iva) < 0) return "IVA no válido.";
    if (Number(form.factorConversion) <= 0) {
      return "El factor de conversión debe ser mayor que 0.";
    }

    if (isRest && !form.ingredienteId) {
      return "Debes asociar un ingrediente.";
    }

    if (isShop && !form.productoShopId) {
      return "Debes asociar un producto de tienda.";
    }

    return "";
  };

  /* =========================
     Submit
  ========================= */
  const submit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);

    try {
      setSaving(true);
      setError("");

      const payload = {
        nombre: form.nombre,
        unidad: form.unidad,
        formato: form.formato,
        precioBase: Number(form.precio),
        iva: Number(form.iva),
        activo: !!form.activo,

        // 🔗 Asociación automática según negocio
        ingredienteId: isRest ? form.ingredienteId : null,
        productoShopId: isShop ? form.productoShopId : null,
        factorConversion: Number(form.factorConversion),
      };

      if (isEdit) {
        await api.put(
          `/admin/proveedores/${proveedorId}/productos/${producto._id}`,
          payload
        );
      } else {
        await api.post(
          `/admin/proveedores/${proveedorId}/productos`,
          payload
        );
      }

      onSaved?.();
    } catch {
      setError("No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     Render
  ========================= */
  return (
    <Portal>
      <div className="ppModal-backdrop" onMouseDown={onClose}>
        <div className="ppModal card" onMouseDown={(e) => e.stopPropagation()}>
          <header className="ppModal-head">
            <h2 className="ppModal-title">
              {isEdit ? "Editar producto" : "Nuevo producto"}
            </h2>
            <button
              type="button"
              className="ppModal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </header>

          <form className="ppModal-body" onSubmit={submit}>
            {error && <div className="ppModal-alert badge-error">❌ {error}</div>}

            <div className="ppModal-grid">
              <div className="ppModal-field ppModal-field--full">
                <label>Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  autoFocus
                />
              </div>

              {isRest && (
                <div className="ppModal-field ppModal-field--full">
                  <label>Ingrediente asociado *</label>
                  <select
                    value={form.ingredienteId}
                    onChange={(e) => set("ingredienteId", e.target.value)}
                  >
                    <option value="">Selecciona ingrediente…</option>
                    {ingredientes.map((i) => (
                      <option key={i._id} value={i._id}>
                        {i.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isShop && (
                <div className="ppModal-field ppModal-field--full">
                  <label>Producto de tienda asociado *</label>
                  <select
                    value={form.productoShopId}
                    onChange={(e) => set("productoShopId", e.target.value)}
                  >
                    <option value="">Selecciona producto…</option>
                    {productosShop.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="ppModal-field">
                <label>Unidad</label>
                <input
                  placeholder="kg, l, ud…"
                  value={form.unidad}
                  onChange={(e) => set("unidad", e.target.value)}
                />
              </div>

              <div className="ppModal-field">
                <label>Formato</label>
                <input
                  placeholder="saco, caja, botella…"
                  value={form.formato}
                  onChange={(e) => set("formato", e.target.value)}
                />
              </div>

              <div className="ppModal-field">
  <label>Factor de conversión *</label>
  <input
    type="number"
    min="0"
    step="any"
    value={form.factorConversion}
    onChange={(e) => set("factorConversion", e.target.value)}
  />
  <small className="ppModal-help">
    Ej: si una caja contiene 50 unidades, escribe <b>50</b>
  </small>
</div>

              <div className="ppModal-field">
                <label>Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio}
                  onChange={(e) => set("precio", e.target.value)}
                />
              </div>

              <div className="ppModal-field">
                <label>IVA (%)</label>
                <select
                  value={form.iva}
                  onChange={(e) => set("iva", e.target.value)}
                >
                  <option value={0}>0%</option>
                  <option value={4}>4%</option>
                  <option value={10}>10%</option>
                  <option value={21}>21%</option>
                </select>
              </div>

              <div className="ppModal-toggle">
                <input
                  id="activo"
                  type="checkbox"
                  checked={!!form.activo}
                  onChange={(e) => set("activo", e.target.checked)}
                />
                <label htmlFor="activo">Producto activo</label>
              </div>
            </div>

            <footer className="ppModal-foot">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primario"
                disabled={saving}
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Portal>
  );
}
