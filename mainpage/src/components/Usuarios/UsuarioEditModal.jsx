import React, { useState } from "react";
import LightSelect from "./LightSelect";
import { useRoles } from "../../hooks/useRoles";
import { useEstaciones } from "../../hooks/useEstaciones";
import "./UsuarioEditModal.css";

export default function UsuarioEditModal({
  usuario,
  onSave,
  onClose,
}) {
  const { roles } = useRoles("tpv");
  const { estaciones } = useEstaciones();

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

      const payload = {
        ...form,
        estacion: form.estacion || "",
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
            <LightSelect
              label="Rol"
              placeholder="Selecciona rol"
              value={form.role}
              onChange={(v) => setForm((p) => ({ ...p, role: v }))}
              options={roles}
            />
            {errors.role && <p className="userEditModal-error">{errors.role}</p>}
          </div>

          {/* Estación */}
          <div className="userEditModal-field">
            <LightSelect
              label="Estación"
              placeholder="Sin estación"
              value={form.estacion}
              onChange={(v) => setForm((p) => ({ ...p, estacion: v }))}
              options={estaciones}
            />
          </div>

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
