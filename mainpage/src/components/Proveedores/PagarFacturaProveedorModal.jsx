import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";
import { useTenant } from "../../context/TenantContext";
import { useToast } from "../../context/ToastContext";
import Portal from "../ui/Portal";
import "./PagarFacturaProveedorModal.css";

const METODOS_PAGO = [
  { value: "transferencia", label: "Transferencia bancaria" },
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "domiciliacion", label: "Domiciliación" },
];

export default function PagarFacturaProveedorModal({ factura, onClose, onSaved }) {
  const { proveedorId } = useParams();
  const { tenantId } = useTenant();
  const { showToast } = useToast();

  const headersTenant = useMemo(
    () => (tenantId ? { headers: { "x-tenant-id": tenantId } } : {}),
    [tenantId]
  );

  const [metodoPago, setMetodoPago] = useState("transferencia");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch(
        `/admin/proveedores/${proveedorId}/facturas/${factura._id}/pagar`,
        { metodoPago, referenciaPago },
        headersTenant
      );
      showToast("Factura marcada como pagada.", "success");
      onSaved?.();
    } catch {
      showToast("Error al registrar el pago.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <div className="pagarFactModal-backdrop" onMouseDown={onClose}>
        <div className="pagarFactModal card" onMouseDown={(e) => e.stopPropagation()}>
          {/* Header */}
          <header className="pagarFactModal-head">
            <h2 className="pagarFactModal-title">Registrar pago</h2>
            <button
              type="button"
              className="pagarFactModal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </header>

          {/* Body */}
          <form className="pagarFactModal-body" onSubmit={submit}>
            {/* Resumen factura */}
            <div className="pagarFactModal-summary">
              <span className="pagarFactModal-summary-label">
                Factura {factura?.numeroFactura || "—"}
              </span>
              <span className="pagarFactModal-summary-value">
                {Number(factura?.total || 0).toFixed(2)} €
              </span>
            </div>

            {/* Campos */}
            <div className="pagarFactModal-fields">
              <div className="pagarFactModal-field">
                <label>Método de pago *</label>
                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                  {METODOS_PAGO.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pagarFactModal-field">
                <label>Referencia / nº operación</label>
                <input
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                  placeholder="Ej: TR-20260325, recibo nº 412…"
                />
              </div>
            </div>

            {/* Footer */}
            <footer className="pagarFactModal-foot">
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
                {saving ? "Registrando…" : "Confirmar pago"}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Portal>
  );
}
