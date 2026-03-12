import React, { useState } from "react";
import { useRoles } from "../../hooks/useRoles";
import "./UsuarioEditModal.css";

export default function UsuarioEditModalShop({
  usuario,
  onSave,
  onClose,
}) {
  const { roles: rolesDisponibles } = useRoles("shop");

  const [form, setForm] = useState({
    name: usuario.name || "",
    role: usuario.role || "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nombre requerido";

    const rolesValidos = rolesDisponibles.map((r) => r.value);
    if (!rolesValidos.includes(form.role)) {
      e.role = "Rol inválido";
    }
    return e;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    setServerError("");

    if (Object.keys(validationErrors).length > 0) return;
    if (!usuario?._id) return;

    try {
      setSaving(true);
      await onSave(usuario._id, {
        name: form.name.trim(),
        role: form.role,
      });
      onClose();
    } catch (err) {
      setServerError(
        err?.response?.data?.message || err?.message || "Error al guardar."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-usuarios" onClick={saving ? undefined : onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Editar usuario</h2>

        <div className="field">
          <label>Nombre</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <p className="error">{errors.name}</p>}
        </div>

        <div className="field">
          <label>Email</label>
          <input
            value={usuario.email || ""}
            readOnly
            disabled
            className="input-readonly"
          />
          <p className="field-hint">
            El email identifica la cuenta y no se puede modificar.
          </p>
        </div>

        <div className="field">
          <label>Rol</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="">--</option>
            {rolesDisponibles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {errors.role && <p className="error">{errors.role}</p>}
        </div>

        {serverError && (
          <p className="error" style={{ textAlign: "center" }}>{serverError}</p>
        )}

        <div className="modal-buttons">
          <button
            className="modal-btn modal-btn-confirmar"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            className="modal-btn modal-btn-cerrar"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
