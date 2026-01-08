import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";
import { useTenant } from "../../context/TenantContext";
import Portal from "../ui/Portal";
import "./PedidoProveedorModal.css";

export default function PedidoProveedorModal({ onClose, onSaved }) {
  const { proveedorId } = useParams();
  const { tenantId } = useTenant();

  const headersTenant = useMemo(
    () => (tenantId ? { headers: { "x-tenant-id": tenantId } } : {}),
    [tenantId]
  );

  const [productos, setProductos] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [fechaEsperada, setFechaEsperada] = useState("");
  const [notas, setNotas] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Cargar productos del proveedor
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(
          `/admin/proveedores/${proveedorId}/productos`,
          headersTenant
        );
        setProductos(data?.items || []);
      } catch {
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, [proveedorId, headersTenant]);

  // 🔹 Añadir línea
  const addLinea = () => {
    setLineas((l) => [
      ...l,
      { productoProveedorId: "", cantidad: 1 },
    ]);
  };

  // 🔹 Eliminar línea
  const removeLinea = (idx) => {
    setLineas((l) => l.filter((_, i) => i !== idx));
  };

  // 🔹 Actualizar línea
  const updateLinea = (idx, patch) => {
    setLineas((l) =>
      l.map((linea, i) => (i === idx ? { ...linea, ...patch } : linea))
    );
  };

  // 🔹 Cálculos
  const resumen = useMemo(() => {
    let subtotal = 0;
    let totalIva = 0;

    lineas.forEach((l) => {
      const prod = productos.find((p) => p._id === l.productoProveedorId);
      if (!prod) return;

      const base = l.cantidad * prod.precioBase;
      subtotal += base;
      totalIva += (base * prod.iva) / 100;
    });

    return {
      subtotal,
      totalIva,
      total: subtotal + totalIva,
    };
  }, [lineas, productos]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (lineas.length === 0)
      return setError("Añade al menos una línea al pedido.");

    try {
      setSaving(true);
      setError("");

      await api.post(
        `/admin/proveedores/${proveedorId}/pedidos`,
        {
          lineas,
          fechaEsperada: fechaEsperada || null,
          notas,
        },
        headersTenant
      );

      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.error || "Error creando el pedido.");
    } finally {
      setSaving(false);
    }
  };

 return (
  <Portal>
    <div className="ppModal-backdrop" onMouseDown={onClose}>
      <div
        className="ppModal ppPed card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* =========================
            Header
        ========================= */}
        <header className="ppModal-head">
          <h2 className="ppModal-title">
            Nuevo pedido al proveedor
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

        {/* =========================
            Body (scrollable)
        ========================= */}
        <form className="ppModal-body ppPed-body" onSubmit={onSubmit}>
          {error && (
            <div className="ppModal-alert badge-error">
              ❌ {error}
            </div>
          )}

          {/* ===== Productos ===== */}
          <section className="ppPed-section">
            <h3 className="ppPed-subtitle">Productos</h3>

            {loading && (
              <div className="ppPed-loading">
                Cargando productos…
              </div>
            )}

            {!loading && lineas.length === 0 && (
              <div className="ppPed-empty">
                Añade productos al pedido.
              </div>
            )}

            {!loading && (
              <div className="ppPed-lineas">
                {lineas.map((l, idx) => {
                  const prod = productos.find(
                    (p) => p._id === l.productoProveedorId
                  );

                  return (
                    <div key={idx} className="ppPed-line">
                      {/* Producto */}
                      <div className="ppPed-lineField ppPed-lineField--producto">
                        <select
                          value={l.productoProveedorId}
                          onChange={(e) =>
                            updateLinea(idx, {
                              productoProveedorId: e.target.value,
                            })
                          }
                        >
                          <option value="">
                            Selecciona producto
                          </option>
                          {productos.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cantidad */}
                      <div className="ppPed-lineField ppPed-lineField--cantidad">
                        <input
                          type="number"
                          min={1}
                          value={l.cantidad}
                          onChange={(e) =>
                            updateLinea(idx, {
                              cantidad: Number(e.target.value),
                            })
                          }
                        />
                      </div>

                      {/* Info */}
                      <div className="ppPed-lineInfo">
                        {prod
                          ? `${prod.precioBase.toFixed(
                              2
                            )} € · IVA ${prod.iva}%`
                          : "—"}
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        className="btn btn-danger ppPed-lineRemove"
                        onClick={() => removeLinea(idx)}
                        aria-label="Eliminar línea"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              className="btn btn-ghost ppPed-add"
              onClick={addLinea}
            >
              ➕ Añadir línea
            </button>
          </section>

          {/* ===== Datos extra ===== */}
          <section className="ppPed-section">
            <div className="ppPed-grid">
              <div className="ppPed-field">
                <label>Fecha esperada</label>
                <input
                  type="date"
                  value={fechaEsperada}
                  onChange={(e) =>
                    setFechaEsperada(e.target.value)
                  }
                />
              </div>

              <div className="ppPed-field ppPed-field--full">
                <label>Notas</label>
                <textarea
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* ===== Resumen ===== */}
          <section className="ppPed-resumen">
            <div>
              Subtotal:{" "}
              <b>{resumen.subtotal.toFixed(2)} €</b>
            </div>
            <div>
              IVA:{" "}
              <b>{resumen.totalIva.toFixed(2)} €</b>
            </div>
            <div className="ppPed-total">
              Total:{" "}
              <b>{resumen.total.toFixed(2)} €</b>
            </div>
          </section>

          {/* =========================
              Footer
          ========================= */}
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
              {saving ? "Creando…" : "Crear pedido"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </Portal>
)
}
