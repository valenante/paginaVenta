import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";
import { useTenant } from "../../context/TenantContext";
import Portal from "../ui/Portal";

export default function PagarFacturaProveedorModal({ factura, onClose, onSaved }) {
  const { proveedorId } = useParams();
  const { tenantId } = useTenant();

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
      onSaved?.();
    } catch {
      alert("Error pagando factura.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <div className="ppModal-backdrop" onMouseDown={onClose}>
        <div className="ppModal" onMouseDown={(e) => e.stopPropagation()}>
          <header className="ppModal-head">
            <h2>Pagar factura</h2>
            <button className="ppModal-close" onClick={onClose}>✕</button>
          </header>

          <form className="ppModal-body" onSubmit={submit}>
            <div className="ppModal-grid">
              <div className="ppModal-field">
                <label>Método de pago</label>
                <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>

              <div className="ppModal-field">
                <label>Referencia</label>
                <input value={referenciaPago} onChange={e => setReferenciaPago(e.target.value)} />
              </div>
            </div>

            <footer className="ppModal-foot">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-secondary" disabled={saving}>
                {saving ? "Pagando…" : "Confirmar pago"}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Portal>
  );
}
