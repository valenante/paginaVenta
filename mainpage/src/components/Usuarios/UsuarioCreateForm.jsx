// src/components/Usuarios/UsuarioCreateForm.jsx
import React, { useState } from "react";
import LightSelect from "./LightSelect";
import { useRoles } from "../../hooks/useRoles";
import "./UsuarioCreateForm.css";

const ESTACIONES = [
  { value: "frito", label: "Frito" },
  { value: "plancha", label: "Plancha" },
  { value: "frio", label: "Frío" },
];

export default function UsuarioCreateForm({ onCrear, onClose }) {
  const { roles: rolesDisponibles } = useRoles("tpv");
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    estacion: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};

    if (!form.name.trim()) e.name = "Nombre requerido";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email inválido";
    const rolesValidos = rolesDisponibles.map((r) => r.value);
    if (!rolesValidos.includes(form.role)) e.role = "Rol inválido";
    if (form.password.length < 8) e.password = "Min 8 caracteres";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "No coinciden";

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    setErrors(e2);

    if (Object.keys(e2).length > 0) return;

    setSaving(true);
    const result = await onCrear({
      name: form.name,
      email: form.email,
      role: form.role,
      estacion: form.estacion || "",
      password: form.password,
    });
    setSaving(false);

    if (result?.ok !== false) {
      onClose();
    }
  };

  return (
    <div
      className="userCreateModal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={saving ? undefined : onClose}
    >
      <div
        className="userCreateModal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <header className="userCreateModal-header">
          <div>
            <h2 className="userCreateModal-title">Nuevo usuario</h2>
            <p className="userCreateModal-subtitle">
              Rellena los datos para dar de alta un nuevo miembro del equipo.
            </p>
          </div>
          <button
            className="userCreateModal-close"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={saving}
            type="button"
          >
            ✕
          </button>
        </header>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="userCreateModal-body">
          {/* Nombre + Email en row */}
          <div className="userCreateModal-row">
            <div className="userCreateModal-field">
              <label>Nombre</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Camarero 1"
                autoFocus
              />
              {errors.name && <p className="userCreateModal-error">{errors.name}</p>}
            </div>

            <div className="userCreateModal-field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
              />
              {errors.email && <p className="userCreateModal-error">{errors.email}</p>}
            </div>
          </div>

          {/* Rol + Estación en row */}
          <div className="userCreateModal-row">
            <div className="userCreateModal-field">
              <LightSelect
                label="Rol"
                placeholder="Selecciona rol"
                value={form.role}
                onChange={(v) => setForm({ ...form, role: v })}
                options={rolesDisponibles}
              />
              {errors.role && <p className="userCreateModal-error">{errors.role}</p>}
            </div>

            <div className="userCreateModal-field">
              <LightSelect
                label="Estación"
                placeholder="Sin estación"
                value={form.estacion}
                onChange={(v) => setForm({ ...form, estacion: v })}
                options={ESTACIONES}
              />
            </div>
          </div>

          {/* Contraseñas en row */}
          <div className="userCreateModal-row">
            <div className="userCreateModal-field">
              <label>Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 caracteres"
              />
              {errors.password && <p className="userCreateModal-error">{errors.password}</p>}
            </div>

            <div className="userCreateModal-field">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
              />
              {errors.confirmPassword && (
                <p className="userCreateModal-error">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <footer className="userCreateModal-footer">
            <button
              className="userCreateModal-btn userCreateModal-btn--secondary"
              onClick={onClose}
              disabled={saving}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="userCreateModal-btn userCreateModal-btn--primary"
              disabled={saving}
              type="submit"
            >
              {saving ? "Creando..." : "Crear usuario"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
