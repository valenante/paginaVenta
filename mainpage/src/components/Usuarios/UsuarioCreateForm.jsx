import React, { useState } from "react";
import "./UsuarioCreateForm.css";

const ESTACIONES = [
  { value: "frito", label: "Frito" },
  { value: "plancha", label: "Plancha" },
  { value: "frio", label: "Frío" },
];

export default function UsuarioCreateForm({ onCrear }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    estacion: "",
    password: "",
    confirmPassword: "",
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
    if (form.password.length < 8)
      e.password = "Min 8 caracteres";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "No coinciden";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    setErrors(e2);
    if (Object.keys(e2).length === 0) {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        estacion: form.role === "cocinero" ? form.estacion : "",
        password: form.password,
      };
      onCrear(payload);
      setForm({
        name: "",
        email: "",
        role: "",
        estacion: "",
        password: "",
        confirmPassword: "",
      });
    }
  };

  return (
    <section className="usuarios-card">
      <h3>Crear usuario</h3>

      <form onSubmit={handleSubmit} className="usuarios-form">
        
        <div className="field">
          <label>Nombre</label>
          <input value={form.name} onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }/>
          {errors.name && <p className="error">{errors.name}</p>}
        </div>

        <div className="field">
          <label>Email</label>
          <input value={form.email} onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }/>
          {errors.email && <p className="error">{errors.email}</p>}
        </div>

        <div className="field">
          <label>Rol</label>
          <select value={form.role} onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }>
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
            <select value={form.estacion} onChange={(e) =>
              setForm({ ...form, estacion: e.target.value })
            }>
              <option value="">--</option>
              {ESTACIONES.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            {errors.estacion && <p className="error">{errors.estacion}</p>}
          </div>
        )}

        <div className="field">
          <label>Contraseña</label>
          <input type="password" value={form.password} onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }/>
          {errors.password && <p className="error">{errors.password}</p>}
        </div>

        <div className="field">
          <label>Confirmar contraseña</label>
          <input type="password" value={form.confirmPassword} onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }/>
          {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
        </div>

        <button className="btn-primary">Crear usuario</button>
      </form>
    </section>
  );
}
