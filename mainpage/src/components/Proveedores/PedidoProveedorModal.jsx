// src/components/Proveedores/ProveedorModal.jsx
import React, { useMemo, useState, useCallback } from "react";
import api from "../../utils/api";
import { useTenant } from "../../context/TenantContext";
import Portal from "../ui/Portal";
import ErrorToast from "../common/ErrorToast.jsx";
import { normalizeApiError } from "../../utils/normalizeApiError.js";
import "./ProveedorModal.css";

const DEFAULT = {
  nombreComercial: "",
  razonSocial: "",
  nif: "",
  tipo: "otros",

  contacto: {
    nombre: "",
    telefono: "",
    email: "",
  },

  direccion: {
    calle: "",
    ciudad: "",
    provincia: "",
    codigoPostal: "",
    pais: "España",
  },

  condicionesPago: {
    metodo: "transferencia",
    plazoDias: 30,
    iban: "",
  },

  leadTimeDias: 0,
  notas: "",
  activo: true,
};

export default function ProveedorModal({ mode, proveedor, onClose, onSaved }) {
  const isEdit = mode === "edit";
  const { tenantId } = useTenant();

  const headersTenant = useMemo(() => {
    return tenantId ? { headers: { "x-tenant-id": tenantId } } : {};
  }, [tenantId]);

  const [form, setForm] = useState(() => ({
    ...DEFAULT,
    ...(proveedor || {}),
    contacto: {
      ...DEFAULT.contacto,
      ...(proveedor?.contacto || {}),
    },
    direccion: {
      ...DEFAULT.direccion,
      ...(proveedor?.direccion || {}),
    },
    condicionesPago: {
      ...DEFAULT.condicionesPago,
      ...(proveedor?.condicionesPago || {}),
    },
  }));

  const [saving, setSaving] = useState(false);

  // ✅ error UX PRO
  const [error, setError] = useState(null);

  // ✅ errors por campo (desde backend fields)
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    setFieldErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const setNested = (key, patch) => {
    setForm((s) => ({ ...s, [key]: { ...(s[key] || {}), ...patch } }));
    // si el backend devuelve fields tipo "contacto.email"
    Object.keys(patch || {}).forEach((subKey) => {
      const path = `${key}.${subKey}`;
      setFieldErrors((prev) => ({ ...prev, [path]: undefined }));
    });
  };

  const getFieldErr = (path) => fieldErrors?.[path];

  // Validación local mínima (rápida UX), pero backend manda.
  const localValidate = useCallback(() => {
    const fe = {};

    if (!form.nombreComercial?.trim() && !form.razonSocial?.trim()) {
      fe.nombreComercial = "Indica nombre comercial o razón social.";
      fe.razonSocial = "Indica nombre comercial o razón social.";
    }

    const email = form.contacto?.email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fe["contacto.email"] = "Email inválido.";
    }

    const telefono = form.contacto?.telefono?.trim();
    if (telefono && !/^[0-9+\s()-]{6,20}$/.test(telefono)) {
      fe["contacto.telefono"] = "Teléfono inválido.";
    }

    return fe;
  }, [form]);

  const buildPayload = useCallback(() => {
    return {
      nombreComercial: form.nombreComercial?.trim() || "",
      razonSocial: form.razonSocial?.trim() || "",
      nif: form.nif?.trim() || "",
      tipo: form.tipo || "otros",

      contacto: {
        nombre: form.contacto?.nombre?.trim() || "",
        telefono: form.contacto?.telefono?.trim() || "",
        email: form.contacto?.email?.trim() || "",
      },

      direccion: {
        calle: form.direccion?.calle?.trim() || "",
        ciudad: form.direccion?.ciudad?.trim() || "",
        provincia: form.direccion?.provincia?.trim() || "",
        codigoPostal: form.direccion?.codigoPostal?.trim() || "",
        pais: form.direccion?.pais?.trim() || "España",
      },

      condicionesPago: {
        metodo: form.condicionesPago?.metodo || "transferencia",
        plazoDias: Number(form.condicionesPago?.plazoDias || 0),
        iban: form.condicionesPago?.iban?.trim() || "",
      },

      leadTimeDias: Number(form.leadTimeDias || 0),
      notas: form.notas || "",
      activo: !!form.activo,
    };
  }, [form]);

  const submit = useCallback(
    async (e) => {
      e?.preventDefault?.();

      // reset visual
      setError(null);

      // ✅ validación local rápida
      const fe = localValidate();
      if (Object.keys(fe).length) {
        setFieldErrors(fe);
        return;
      }
      setFieldErrors({});

      setSaving(true);

      const payload = buildPayload();

      try {
        if (isEdit) {
          await api.put(`/admin/proveedores/${proveedor._id}`, payload, headersTenant);
        } else {
          await api.post("/admin/proveedores", payload, headersTenant);
        }

        onSaved?.();
      } catch (err) {
        const normalized = normalizeApiError(err);

        // si backend manda fields → los pintamos
        const backendFields = normalized?.fields && typeof normalized.fields === "object"
          ? normalized.fields
          : null;

        if (backendFields) setFieldErrors(backendFields);

        setError({
          ...normalized,
          retryFn: () => submit(),
        });
      } finally {
        setSaving(false);
      }
    },
    [isEdit, proveedor?._id, headersTenant, buildPayload, localValidate, onSaved]
  );

  return (
    <Portal>
      <div className="provModal-backdrop" onMouseDown={onClose}>
        <div className="provModal card" onMouseDown={(e) => e.stopPropagation()}>
          {/* ===== Header ===== */}
          <header className="provModal-head">
            <div className="provModal-headText">
              <h2 className="provModal-title">
                {isEdit ? "Editar proveedor" : "Nuevo proveedor"}
              </h2>
              <p className="provModal-subtitle">
                Completa los datos básicos. Luego podrás crear productos, pedidos y facturas.
              </p>
            </div>

            <button
              type="button"
              className="provModal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </header>

          {/* ===== Body ===== */}
          <form className="provModal-body" onSubmit={submit}>
            {/* ✅ Error UX PRO */}
            {error && (
              <ErrorToast
                error={error}
                onRetry={error.canRetry ? error.retryFn : undefined}
                onClose={() => setError(null)}
              />
            )}

            {/* ===== Datos proveedor ===== */}
            <section className="provModal-section">
              <div className="provModal-grid">
                <div className="provModal-field">
                  <label>Nombre comercial</label>
                  <input
                    value={form.nombreComercial}
                    onChange={(e) => set("nombreComercial", e.target.value)}
                    aria-invalid={!!getFieldErr("nombreComercial")}
                  />
                  {getFieldErr("nombreComercial") ? (
                    <small className="field-error">{getFieldErr("nombreComercial")}</small>
                  ) : null}
                </div>

                <div className="provModal-field">
                  <label>Razón social</label>
                  <input
                    value={form.razonSocial}
                    onChange={(e) => set("razonSocial", e.target.value)}
                    aria-invalid={!!getFieldErr("razonSocial")}
                  />
                  {getFieldErr("razonSocial") ? (
                    <small className="field-error">{getFieldErr("razonSocial")}</small>
                  ) : null}
                </div>

                <div className="provModal-field">
                  <label>CIF / NIF</label>
                  <input
                    value={form.nif}
                    onChange={(e) => set("nif", e.target.value)}
                    aria-invalid={!!getFieldErr("nif")}
                  />
                  {getFieldErr("nif") ? (
                    <small className="field-error">{getFieldErr("nif")}</small>
                  ) : null}
                </div>

                <div className="provModal-field">
                  <label>Email</label>
                  <input
                    value={form.contacto?.email || ""}
                    onChange={(e) => setNested("contacto", { email: e.target.value })}
                    aria-invalid={!!getFieldErr("contacto.email")}
                  />
                  {getFieldErr("contacto.email") ? (
                    <small className="field-error">{getFieldErr("contacto.email")}</small>
                  ) : null}
                </div>

                <div className="provModal-field">
                  <label>Teléfono</label>
                  <input
                    value={form.contacto?.telefono || ""}
                    onChange={(e) => setNested("contacto", { telefono: e.target.value })}
                    aria-invalid={!!getFieldErr("contacto.telefono")}
                  />
                  {getFieldErr("contacto.telefono") ? (
                    <small className="field-error">{getFieldErr("contacto.telefono")}</small>
                  ) : null}
                </div>

                <div className="provModal-field">
                  <label>Lead time (días)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.leadTimeDias ?? 0}
                    onChange={(e) => set("leadTimeDias", e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* ===== Dirección ===== */}
            <section className="provModal-section">
              <div className="provModal-grid">
                <div className="provModal-field provModal-field--full">
                  <label>Dirección (calle)</label>
                  <input
                    value={form.direccion?.calle || ""}
                    onChange={(e) => setNested("direccion", { calle: e.target.value })}
                  />
                </div>

                <div className="provModal-field">
                  <label>Ciudad</label>
                  <input
                    value={form.direccion?.ciudad || ""}
                    onChange={(e) => setNested("direccion", { ciudad: e.target.value })}
                  />
                </div>

                <div className="provModal-field">
                  <label>Provincia</label>
                  <input
                    value={form.direccion?.provincia || ""}
                    onChange={(e) => setNested("direccion", { provincia: e.target.value })}
                  />
                </div>

                <div className="provModal-field">
                  <label>Código postal</label>
                  <input
                    value={form.direccion?.codigoPostal || ""}
                    onChange={(e) => setNested("direccion", { codigoPostal: e.target.value })}
                  />
                </div>

                <div className="provModal-field">
                  <label>País</label>
                  <input
                    value={form.direccion?.pais || "España"}
                    onChange={(e) => setNested("direccion", { pais: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* ===== Condiciones de pago ===== */}
            <section className="provModal-section">
              <div className="provModal-grid">
                <div className="provModal-field">
                  <label>Condición de pago</label>
                  <select
                    value={form.condicionesPago?.metodo || "transferencia"}
                    onChange={(e) => setNested("condicionesPago", { metodo: e.target.value })}
                  >
                    <option value="contado">Contado</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="credito">Crédito</option>
                    <option value="domiciliacion">Domiciliación</option>
                  </select>
                </div>

                <div className="provModal-field">
                  <label>Días (si aplica)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.condicionesPago?.plazoDias ?? 0}
                    onChange={(e) => setNested("condicionesPago", { plazoDias: e.target.value })}
                  />
                </div>

                <div className="provModal-field provModal-field--full">
                  <label>IBAN (si aplica)</label>
                  <input
                    value={form.condicionesPago?.iban || ""}
                    onChange={(e) => setNested("condicionesPago", { iban: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* ===== Notas y estado ===== */}
            <section className="provModal-section">
              <div className="provModal-field provModal-field--full">
                <label>Notas internas</label>
                <textarea
                  rows={3}
                  value={form.notas}
                  onChange={(e) => set("notas", e.target.value)}
                  placeholder="Horario de reparto, comerciales, condiciones especiales..."
                />
              </div>

              <div className="provModal-toggle">
                <input
                  id="activo"
                  type="checkbox"
                  checked={!!form.activo}
                  onChange={(e) => set("activo", e.target.checked)}
                />
                <label htmlFor="activo">Proveedor activo</label>
              </div>
            </section>

            {/* ===== Footer ===== */}
            <footer className="provModal-foot">
              <button
                type="button"
                className="btn btn-secundario"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>

              <button type="submit" className="btn btn-primario" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Portal>
  );
}