import React, { useState } from "react";
import "./UsuarioEditModal.css";

export default function UsuarioEditModal({
  usuario,
  permisosDisponibles,
  rolesConfig,
  onSave,
  onClose,
}) {
  const [form, setForm] = useState({
    name: usuario.name || "",
    email: usuario.email || "",
    role: usuario.role || "",
    estacion: usuario.estacion || "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nombre requerido";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email inválido";
    if (!["admin", "cocinero", "camarero"].includes(form.role))
      e.role = "Rol inválido";

    if (form.role === "cocinero" && !form.estacion)
      e.estacion = "Selecciona estación";

    return e;
  };

  const handleSave = () => {
    const e = validate();
    setErrors(e);

    if (Object.keys(e).length === 0) {
      onSave(usuario._id, form);
      onClose();
    }
  };

  return (
    <div className="modal-usuarios">
      <div className="modal-content">

        <h2>Editar usuario</h2>

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
            <option value="cocinero">Cocinero</option>
            <option value="camarero">Camarero</option>
          </select>
          {errors.role && <p className="error">{errors.role}</p>}
        </div>

        {form.role === "cocinero" && (
          <div className="field">
            <label>Estación</label>
            <select
              value={form.estacion}
              onChange={(e) =>
                setForm({ ...form, estacion: e.target.value })
              }
            >
              <option value="">--</option>
              <option value="frito">Frito</option>
              <option value="plancha">Plancha</option>
              <option value="frio">Frío</option>
            </select>
            {errors.estacion && (
              <p className="error">{errors.estacion}</p>
            )}
          </div>
        )}

        <div className="modal-buttons">
          <button
            className="statsUserModal-close-btn"
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
