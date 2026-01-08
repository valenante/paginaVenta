// src/components/Proveedores/ProveedorModal.jsx
import React, { useMemo, useState } from "react";
import api from "../../utils/api";
import { useTenant } from "../../context/TenantContext";
import Portal from "../ui/Portal";
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
    const [error, setError] = useState("");

    const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
    const setNested = (key, patch) =>
        setForm((s) => ({ ...s, [key]: { ...(s[key] || {}), ...patch } }));

    const validate = () => {
        if (!form.nombreComercial?.trim() && !form.razonSocial?.trim()) {
            return "Introduce nombre comercial o razón social.";
        }
        const email = form.contacto?.email;
        if (email && !String(email).includes("@")) return "Email no válido.";
        return "";
    };

    const submit = async (e) => {
        e.preventDefault();
        const msg = validate();
        if (msg) return setError(msg);

        try {
            setSaving(true);
            setError("");

            const payload = {
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

            if (isEdit) {
                await api.put(`/admin/proveedores/${proveedor._id}`, payload, headersTenant);
            } else {
                await api.post("/admin/proveedores", payload, headersTenant);
            }

            onSaved?.();
        } catch {
            setError("No se pudo guardar el proveedor.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Portal>
            <div className="provModal-backdrop" onMouseDown={onClose}>
                <div
                    className="provModal card"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {/* =========================
            Header
        ========================= */}
                    <header className="provModal-head">
                        <div className="provModal-headText">
                            <h2 className="provModal-title">
                                {isEdit ? "Editar proveedor" : "Nuevo proveedor"}
                            </h2>
                            <p className="provModal-subtitle">
                                Completa los datos básicos. Luego podrás crear productos,
                                pedidos y facturas.
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

                    {/* =========================
            Body
        ========================= */}
                    <form
                        className="provModal-body"
                        onSubmit={submit}
                    >
                        {error && (
                            <div className="provModal-alert badge-error">
                                ❌ {error}
                            </div>
                        )}

                        {/* =========================
              Datos proveedor
          ========================= */}
                        <section className="provModal-section">
                            <div className="provModal-grid">
                                <div className="provModal-field">
                                    <label>Nombre comercial</label>
                                    <input
                                        value={form.nombreComercial}
                                        onChange={(e) =>
                                            set("nombreComercial", e.target.value)
                                        }
                                    />
                                </div>

                                <div className="provModal-field">
                                    <label>Razón social</label>
                                    <input
                                        value={form.razonSocial}
                                        onChange={(e) =>
                                            set("razonSocial", e.target.value)
                                        }
                                    />
                                </div>

                                <div className="provModal-field">
                                    <label>CIF / NIF</label>
                                    <input
                                        value={form.nif}
                                        onChange={(e) => set("nif", e.target.value)}
                                    />
                                </div>

                                <div className="provModal-field">
                                    <label>Email</label>
                                    <input
                                        value={form.contacto?.email || ""}
                                        onChange={(e) =>
                                            setNested("contacto", {
                                                email: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="provModal-field">
                                    <label>Teléfono</label>
                                    <input
                                        value={form.contacto?.telefono || ""}
                                        onChange={(e) =>
                                            setNested("contacto", {
                                                telefono: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="provModal-field">
                                    <label>Lead time (días)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.leadTimeDias ?? 0}
                                        onChange={(e) =>
                                            set("leadTimeDias", e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        {/* =========================
              Dirección
          ========================= */}
                        <section className="provModal-section">
                            <div className="provModal-grid">
                                <div className="provModal-field provModal-field--full">
                                    <label>Dirección (calle)</label>
                                    <input
                                        value={form.direccion?.calle || ""}
                                        onChange={(e) =>
                                            setNested("direccion", {
                                                calle: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="provModal-field">
                                    <label>Ciudad</label>
                                    <input
                                        value={form.direccion?.ciudad || ""}
                                        onChange={(e) =>
                                            setNested("direccion", {
                                                ciudad: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="provModal-field">
                                    <label>Provincia</label>
                                    <input
                                        value={form.direccion?.provincia || ""}
                                        onChange={(e) =>
                                            setNested("direccion", {
                                                provincia: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="provModal-field">
                                    <label>Código postal</label>
                                    <input
                                        value={form.direccion?.codigoPostal || ""}
                                        onChange={(e) =>
                                            setNested("direccion", {
                                                codigoPostal: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="provModal-field">
                                    <label>País</label>
                                    <input
                                        value={form.direccion?.pais || "España"}
                                        onChange={(e) =>
                                            setNested("direccion", {
                                                pais: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        {/* =========================
              Condiciones de pago
          ========================= */}
                        <section className="provModal-section">
                            <div className="provModal-grid">
                                <div className="provModal-field">
                                    <label>Condición de pago</label>
                                    <select
                                        value={
                                            form.condicionesPago?.metodo ||
                                            "transferencia"
                                        }
                                        onChange={(e) =>
                                            setNested("condicionesPago", {
                                                metodo: e.target.value,
                                            })
                                        }
                                    >
                                        <option value="contado">Contado</option>
                                        <option value="transferencia">
                                            Transferencia
                                        </option>
                                        <option value="credito">Crédito</option>
                                        <option value="domiciliacion">
                                            Domiciliación
                                        </option>
                                    </select>
                                </div>

                                <div className="provModal-field">
                                    <label>Días (si aplica)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={
                                            form.condicionesPago?.plazoDias ?? 0
                                        }
                                        onChange={(e) =>
                                            setNested("condicionesPago", {
                                                plazoDias: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="provModal-field provModal-field--full">
                                    <label>IBAN (si aplica)</label>
                                    <input
                                        value={form.condicionesPago?.iban || ""}
                                        onChange={(e) =>
                                            setNested("condicionesPago", {
                                                iban: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        {/* =========================
              Notas y estado
          ========================= */}
                        <section className="provModal-section">
                            <div className="provModal-field provModal-field--full">
                                <label>Notas internas</label>
                                <textarea
                                    rows={3}
                                    value={form.notas}
                                    onChange={(e) =>
                                        set("notas", e.target.value)
                                    }
                                    placeholder="Horario de reparto, comerciales, condiciones especiales..."
                                />
                            </div>

                            <div className="provModal-toggle">
                                <input
                                    id="activo"
                                    type="checkbox"
                                    checked={!!form.activo}
                                    onChange={(e) =>
                                        set("activo", e.target.checked)
                                    }
                                />
                                <label htmlFor="activo">
                                    Proveedor activo
                                </label>
                            </div>
                        </section>

                        {/* =========================
              Footer
          ========================= */}
                        <footer className="provModal-foot">
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
