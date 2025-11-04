import React from "react";
import "./Paso1DatosRestaurante.css";

export default function Paso1DatosRestaurante({ tenant, setTenant, admin, setAdmin }) {
  const handleTenantChange = (e) => {
    const { name, value } = e.target;
    setTenant((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdmin((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section className="paso1-datos">
      <h2>🏪 Datos del restaurante</h2>
      <p>Introduce la información básica de tu restaurante y del usuario administrador.</p>

      <div className="form-group">
        <label>Nombre del restaurante</label>
        <input
          name="nombre"
          value={tenant.nombre}
          onChange={handleTenantChange}
          placeholder="Ej. La Campana"
          required
        />
      </div>

      <div className="form-group">
        <label>Email de contacto</label>
        <input
          type="email"
          name="email"
          value={tenant.email}
          onChange={handleTenantChange}
          placeholder="Ej. contacto@restaurante.com"
          required
        />
      </div>

      <h3>👤 Usuario administrador</h3>

      <div className="form-group">
        <label>Nombre de usuario</label>
        <input
          name="name"
          value={admin.name}
          onChange={handleAdminChange}
          placeholder="Ej. admin-restaurante"
          required
        />
      </div>

      <div className="form-group">
        <label>Contraseña</label>
        <input
          type="password"
          name="password"
          value={admin.password}
          onChange={handleAdminChange}
          placeholder="********"
          required
        />
      </div>

      <div className="info-box">
        <p>
          🔒 La cuenta de administrador te permitirá gestionar productos, personal y
          configuraciones del restaurante. Podrás añadir más usuarios después.
        </p>
      </div>
    </section>
  );
}
