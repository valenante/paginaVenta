import React, { useState } from "react";
import "./UsuarioEditModal.css"; // reutilizamos el mismo CSS

export default function UsuarioEditModalShop({
  usuario,
  rolesConfig,
  onSave,
  onClose,
}) {
  const [form, setForm] = useState({
    name: usuario.name || "",
    email: usuario.email || "",
    role: usuario.role || "",
  });

  const [errors, setErrors] = useState({});

  /* =====================
     VALIDACIÓN
  ===================== */
  const validate = () => {
    const e = {};

    if (!form.name.trim()) e.name = "Nombre requerido";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email inválido";

    if (!["admin", "vendedor", "empleado"].includes(form.role)) {
      e.role = "Rol inválido";
    }

    return e;
  };

  /* =====================
     GUARDAR
  ===================== */
  const handleSave = () => {
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSave(usuario._id, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      });
      onClose();
    }
  };

  return (
    <div className="modal-usuarios">
      <div className="modal-content">
        <h2>Editar usuario</h2>

        {/* Nombre */}
        <div className="field">
          <label>Nombre</label>
          <input
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
          {errors.name && <p className="error">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="field">
          <label>Email</label>
          <input
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
          {errors.email && <p className="error">{errors.email}</p>}
        </div>

        {/* Rol */}
        <div className="field">
          <label>Rol</label>
          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
          >
            <option value="">--</option>
            <option value="admin">Admin</option>
            <option value="vendedor">Vendedor</option>
          </select>
          {errors.role && <p className="error">{errors.role}</p>}
        </div>

        {/* Botones */}
        <div className="modal-buttons">
          <button
            className="modal-btn modal-btn-confirmar"
            onClick={handleSave}
          >
            Guardar cambios
          </button>

          <button
            className="modal-btn modal-btn-cerrar"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
