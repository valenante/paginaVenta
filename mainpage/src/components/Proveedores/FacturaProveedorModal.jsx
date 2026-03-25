import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";
import { useTenant } from "../../context/TenantContext";
import Portal from "../ui/Portal";
import "./FacturaProveedorModal.css";

const IVA_OPTIONS = [
  { value: 0, label: "0% (Exento)" },
  { value: 4, label: "4% (Superreducido)" },
  { value: 10, label: "10% (Reducido)" },
  { value: 21, label: "21% (General)" },
];

export default function FacturaProveedorModal({ onClose, onSaved }) {
  const { proveedorId } = useParams();
  const { tenantId } = useTenant();

  const headersTenant = useMemo(
    () => (tenantId ? { headers: { "x-tenant-id": tenantId } } : {}),
    [tenantId]
  );

  const [form, setForm] = useState({
    numeroFactura: "",
    fechaFactura: "",
    fechaVencimiento: "",
    subtotal: "",
    iva: 21,
    total: "",
    notas: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [archivo, setArchivo] = useState(null);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  // Auto-calcular total cuando cambian subtotal o IVA
  const subtotalNum = Number(form.subtotal) || 0;
  const ivaNum = Number(form.iva) || 0;
  const totalIvaCalc = +(subtotalNum * ivaNum / 100).toFixed(2);
  const totalCalc = +(subtotalNum + totalIvaCalc).toFixed(2);

  const submit = async (e) => {
    e.preventDefault();

    if (!form.numeroFactura.trim()) {
      setError("El número de factura es obligatorio.");
      return;
    }
    if (!form.fechaFactura || !form.fechaVencimiento) {
      setError("Debes indicar fecha de factura y vencimiento.");
      return;
    }
    if (subtotalNum <= 0) {
      setError("El subtotal debe ser mayor que 0.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const { data } = await api.post(
        `/admin/proveedores/${proveedorId}/facturas`,
        {
          numeroFactura: form.numeroFactura.trim(),
          fechaFactura: form.fechaFactura,
          fechaVencimiento: form.fechaVencimiento,
          subtotal: subtotalNum,
          totalIva: totalIvaCalc,
          total: totalCalc,
          notas: form.notas,
        },
        headersTenant
      );

      const facturaId = data?.factura?._id;
      if (!facturaId) throw new Error("No se recibió facturaId");

      if (archivo) {
        const fd = new FormData();
        fd.append("documento", archivo);
        await api.post(
          `/admin/proveedores/${proveedorId}/facturas/${facturaId}/documento`,
          fd,
          {
            headers: {
              ...(headersTenant.headers || {}),
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Error creando factura.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <div className="facturaProvModal-backdrop" onMouseDown={onClose}>
        <div
          className="facturaProvModal card"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="facturaProvModal-head">
            <h2 className="facturaProvModal-title">Nueva factura</h2>
            <button
              type="button"
              className="facturaProvModal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </header>

          {/* Body */}
          <form className="facturaProvModal-body" onSubmit={submit}>
            {error && (
              <div className="facturaProvModal-alert">❌ {error}</div>
            )}

            {/* Datos factura */}
            <section className="facturaProvModal-section">
              <p className="facturaProvModal-section-title">Datos de la factura</p>

              <div className="facturaProvModal-grid">
                <div className="facturaProvModal-field">
                  <label>Nº Factura *</label>
                  <input
                    value={form.numeroFactura}
                    onChange={(e) => set("numeroFactura", e.target.value)}
                    placeholder="F-2026/001"
                    autoFocus
                  />
                </div>

                <div className="facturaProvModal-field">
                  <label>Fecha factura *</label>
                  <input
                    type="date"
                    value={form.fechaFactura}
                    onChange={(e) => set("fechaFactura", e.target.value)}
                  />
                </div>

                <div className="facturaProvModal-field">
                  <label>Fecha vencimiento *</label>
                  <input
                    type="date"
                    value={form.fechaVencimiento}
                    onChange={(e) => set("fechaVencimiento", e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Importes */}
            <section className="facturaProvModal-section">
              <p className="facturaProvModal-section-title">Importes</p>

              <div className="facturaProvModal-grid">
                <div className="facturaProvModal-field">
                  <label>Subtotal (sin IVA) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.subtotal}
                    onChange={(e) => set("subtotal", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="facturaProvModal-field">
                  <label>Tipo de IVA</label>
                  <select
                    value={form.iva}
                    onChange={(e) => set("iva", Number(e.target.value))}
                  >
                    {IVA_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="facturaProvModal-field">
                  <label>Total</label>
                  <input
                    type="text"
                    value={subtotalNum > 0 ? `${totalCalc.toFixed(2)} €` : "—"}
                    readOnly
                    style={{ background: "var(--color-fondo-claro, #f3f4f6)", fontWeight: 700 }}
                  />
                </div>
              </div>
            </section>

            {/* Notas */}
            <section className="facturaProvModal-section">
              <div className="facturaProvModal-field facturaProvModal-field--full">
                <label>Notas</label>
                <textarea
                  rows={3}
                  value={form.notas}
                  onChange={(e) => set("notas", e.target.value)}
                  placeholder="Observaciones, condiciones, referencias..."
                />
              </div>
            </section>

            {/* Archivo */}
            <section className="facturaProvModal-section">
              <div className="facturaProvModal-file">
                <label>Adjuntar factura (foto o PDF)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  capture="environment"
                  onChange={(e) => setArchivo(e.target.files[0])}
                />
                {archivo && (
                  <span className="facturaProvModal-file-hint">
                    Archivo seleccionado: <b>{archivo.name}</b>
                  </span>
                )}
              </div>
            </section>

            {/* Footer */}
            <footer className="facturaProvModal-foot">
              <button
                type="button"
                className="btn btn-secundario"
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
                {saving ? "Guardando…" : "Crear factura"}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Portal>
  );
}
