import React, { useMemo, useState } from "react";
import "./UsuarioEditModal.css";

const FALLBACK_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "cocinero", label: "Cocinero" },
  { value: "camarero", label: "Camarero" },
];

// si mañana agregas estaciones en config
const FALLBACK_ESTACIONES = [
  { value: "frito", label: "Frito" },
  { value: "plancha", label: "Plancha" },
  { value: "frio", label: "Frío" },
];

export default function UsuarioEditModal({
  usuario,
  permisosDisponibles, // (lo dejamos preparado)
  rolesConfig,         // (si viene con roles/estaciones, lo usamos)
  onSave,
  onClose,
}) {
  const roles = useMemo(() => {
    const rcRoles = rolesConfig?.roles;
    if (Array.isArray(rcRoles) && rcRoles.length) return rcRoles;
    return FALLBACK_ROLES;
  }, [rolesConfig]);

  const estaciones = useMemo(() => {
    const rcEst = rolesConfig?.estaciones;
    if (Array.isArray(rcEst) && rcEst.length) return rcEst;
    return FALLBACK_ESTACIONES;
  }, [rolesConfig]);

  const [form, setForm] = useState({
    name: usuario?.name || "",
    role: usuario?.role || "",
    estacion: usuario?.estacion || "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e = {};
    if (!String(form.name || "").trim()) e.name = "Nombre requerido";

    const allowedRoles = roles.map((r) => r.value);
    if (!allowedRoles.includes(form.role)) e.role = "Rol inválido";

    if (form.role === "cocinero" && !form.estacion) {
      e.estacion = "Selecciona estación";
    }

    return e;
  };

  const handleSave = async () => {
    const e = validate();
    setErrors(e);
    setServerError("");

    if (Object.keys(e).length > 0) return;
    if (!usuario?._id) return;

    try {
      setSaving(true);

      // si cambia de rol y ya no es cocinero, limpiamos estación
      const payload = {
        ...form,
        estacion: form.role === "cocinero" ? form.estacion : "",
      };

      await onSave(usuario._id, payload);
      onClose();
    } catch (err) {
      setServerError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo guardar el usuario."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!usuario) return null;

  return (
    <div
      className="userEditModal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={saving ? undefined : onClose}
    >
      <div
        className="userEditModal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <header className="userEditModal-header">
          <div>
            <h2 className="userEditModal-title">Editar usuario</h2>
            <p className="userEditModal-subtitle">
              {usuario?.email || "-"} ·{" "}
              <span className="userEditModal-role">{usuario?.role || "-"}</span>
            </p>
          </div>

          <button
            className="userEditModal-close"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={saving}
            type="button"
          >
            ✕
          </button>
        </header>

        {/* BODY */}
        <div className="userEditModal-body">
          {/* Nombre */}
          <div className="userEditModal-field">
            <label>Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nombre y apellido"
              autoFocus
            />
            {errors.name && <p className="userEditModal-error">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="userEditModal-field">
            <label>Email</label>
            <input
              value={usuario.email || ""}
              readOnly
              disabled
              className="userEditModal-inputReadonly"
            />
            <p className="userEditModal-hint">
              El email identifica la cuenta y no se puede modificar.
            </p>
          </div>

          {/* Rol */}
          <div className="userEditModal-field">
            <label>Rol</label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  role: e.target.value,
                  // si cambia a rol no cocinero, limpiamos estación
                  estacion: e.target.value === "cocinero" ? p.estacion : "",
                }))
              }
            >
              <option value="">--</option>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {errors.role && <p className="userEditModal-error">{errors.role}</p>}
          </div>

          {/* Estación */}
          {form.role === "cocinero" && (
            <div className="userEditModal-field">
              <label>Estación</label>
              <select
                value={form.estacion}
                onChange={(e) =>
                  setForm((p) => ({ ...p, estacion: e.target.value }))
                }
              >
                <option value="">--</option>
                {estaciones.map((est) => (
                  <option key={est.value} value={est.value}>
                    {est.label}
                  </option>
                ))}
              </select>
              {errors.estacion && (
                <p className="userEditModal-error">{errors.estacion}</p>
              )}
            </div>
          )}

          {/* Error servidor */}
          {serverError && (
            <p className="userEditModal-error userEditModal-error--server">
              {serverError}
            </p>
          )}
        </div>

        {/* FOOTER */}
        <footer className="userEditModal-footer">
          <div className="userEditModal-actions">
            <button
              className="userEditModal-btn userEditModal-btn--secondary"
              onClick={onClose}
              disabled={saving}
              type="button"
            >
              Cancelar
            </button>

            <button
              className="userEditModal-btn userEditModal-btn--primary"
              onClick={handleSave}
              disabled={saving}
              type="button"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
