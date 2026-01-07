import React, { useState } from "react";
import AlefSelect from "../AlefSelect/AlefSelect";
import "./UsuarioCreateForm.css"; // reutilizamos el mismo CSS

export default function UsuarioCreateFormShop({ onCrear }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
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

    if (form.password.length < 8) {
      e.password = "La contraseña debe tener al menos 8 caracteres";
    }

    if (form.password !== form.confirmPassword) {
      e.confirmPassword = "Las contraseñas no coinciden";
    }

    return e;
  };

  /* =====================
     SUBMIT
  ===================== */
  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onCrear({
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        password: form.password,
      });

      // Reset
      setForm({
        name: "",
        email: "",
        role: "",
        password: "",
        confirmPassword: "",
      });
    }
  };

  return (
    <section className="usuarios-card">
      <h3>Crear usuario</h3>

      <form onSubmit={handleSubmit} className="usuarios-form">
        {/* Nombre */}
        <div className="field">
          <label>Nombre</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <p className="error">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="field">
          <label>Email</label>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && <p className="error">{errors.email}</p>}
        </div>

        {/* Rol */}
        <div className="field">
          <AlefSelect
            label="Rol"
            placeholder="Selecciona rol"
            value={form.role}
            onChange={(v) => setForm({ ...form, role: v })}
            options={[
              { value: "admin", label: "Admin" },
              { value: "vendedor", label: "Vendedor" },
            ]}
          />
          {errors.role && <p className="error">{errors.role}</p>}
        </div>

        {/* Contraseña */}
        <div className="field">
          <label>Contraseña</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {errors.password && <p className="error">{errors.password}</p>}
        </div>

        {/* Confirmar contraseña */}
        <div className="field">
          <label>Confirmar contraseña</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
          />
          {errors.confirmPassword && (
            <p className="error">{errors.confirmPassword}</p>
          )}
        </div>

        <button className="btn-primary">Crear usuario</button>
      </form>
    </section>
  );
}
