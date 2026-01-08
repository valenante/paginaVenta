import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";
import { useTenant } from "../../context/TenantContext";
import Portal from "../ui/Portal";
import "./FacturaProveedorModal.css"

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
    totalIva: "",
    total: "",
    notas: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [archivo, setArchivo] = useState(null);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();

    if (!form.fechaFactura || !form.fechaVencimiento) {
      setError("Debes indicar fecha de factura y vencimiento");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const documentoUrl = await subirFactura();

      await api.post(
        `/admin/proveedores/${proveedorId}/facturas`,
        {
          ...form,
          subtotal: Number(form.subtotal),
          totalIva: Number(form.totalIva),
          total: Number(form.total),
          documentoUrl,
        },
        headersTenant
      );

      onSaved?.();
    } catch {
      setError("Error creando factura.");
    } finally {
      setSaving(false);
    }
  };

  const subirFactura = async () => {
    if (!archivo) return null;

    const formData = new FormData();
    formData.append("file", archivo);

    const { data } = await api.post(
      "/admin/uploads/facturas-proveedores",
      formData,
      {
        headers: {
          ...headersTenant.headers,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return data?.url || null;
  };

 return (
  <Portal>
    <div className="ppModal-backdrop" onMouseDown={onClose}>
      <div
        className="ppModal ppFactura card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* =========================
            Header
        ========================= */}
        <header className="ppModal-head">
          <h2 className="ppModal-title">Nueva factura</h2>

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
            Body
        ========================= */}
        <form className="ppModal-body ppFactura-body" onSubmit={submit}>
          {error && (
            <div className="ppModal-alert badge-error">
              ❌ {error}
            </div>
          )}

          {/* =========================
              Datos factura
          ========================= */}
          <section className="ppFactura-section">
            <div className="ppModal-grid">
              <div className="ppModal-field">
                <label>Nº Factura</label>
                <input
                  value={form.numeroFactura}
                  onChange={(e) =>
                    set("numeroFactura", e.target.value)
                  }
                />
              </div>

              <div className="ppModal-field">
                <label>Fecha factura</label>
                <input
                  type="date"
                  value={form.fechaFactura}
                  onChange={(e) =>
                    set("fechaFactura", e.target.value)
                  }
                />
              </div>

              <div className="ppModal-field">
                <label>Fecha vencimiento</label>
                <input
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={(e) =>
                    set("fechaVencimiento", e.target.value)
                  }
                />
              </div>

              <div className="ppModal-field">
                <label>Subtotal</label>
                <input
                  type="number"
                  value={form.subtotal}
                  onChange={(e) =>
                    set("subtotal", e.target.value)
                  }
                />
              </div>

              <div className="ppModal-field">
                <label>IVA</label>
                <input
                  type="number"
                  value={form.totalIva}
                  onChange={(e) =>
                    set("totalIva", e.target.value)
                  }
                />
              </div>

              <div className="ppModal-field">
                <label>Total</label>
                <input
                  type="number"
                  value={form.total}
                  onChange={(e) =>
                    set("total", e.target.value)
                  }
                />
              </div>

              <div className="ppModal-field ppModal-field--full">
                <label>Notas</label>
                <textarea
                  rows={3}
                  value={form.notas}
                  onChange={(e) =>
                    set("notas", e.target.value)
                  }
                />
              </div>
            </div>
          </section>

          {/* =========================
              Archivo adjunto
          ========================= */}
          <section className="ppFactura-section">
            <div className="ppModal-field ppModal-field--full">
              <label>Adjuntar factura (foto o PDF)</label>

              <input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={(e) => setArchivo(e.target.files[0])}
              />

              {archivo && (
                <small className="ppModal-hint">
                  Archivo seleccionado:{" "}
                  <b>{archivo.name}</b>
                </small>
              )}
            </div>
          </section>

          {/* =========================
              Footer
          ========================= */}
          <footer className="ppModal-foot">
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
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </Portal>
);
}
