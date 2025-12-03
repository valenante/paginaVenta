import React from "react";
import "./PasoAdmin.css";

export default function PasoAdmin({ admin, setAdmin }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdmin((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="paso-admin-card">
      <h4 className="paso-admin-titulo">Administrador principal</h4>

      <div className="paso-admin-field">
        <label className="paso-admin-label">Nombre</label>
        <input
          className="paso-admin-input"
          name="name"
          value={admin.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="paso-admin-field">
        <label className="paso-admin-label">Contraseña</label>
        <input
          className="paso-admin-input"
          type="password"
          name="password"
          value={admin.password}
          onChange={handleChange}
          required
        />
      </div>
    </div>
  );
}
