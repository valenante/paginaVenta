import React from "react";
import "./Paso1DatosRestaurante.css";

export default function Paso1DatosRestaurante({
  tenant,
  setTenant,
  admin,
  setAdmin,
  isShop = false, // 👈 NUEVO
}) {
  const handleTenantChange = (e) => {
    const { name, value } = e.target;
    setTenant((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdmin((prev) => ({ ...prev, [name]: value }));
  };

  const labelNegocio = isShop ? "tienda" : "restaurante";

  return (
    <section className="paso1-datos">
      <h2>Datos de la {labelNegocio}</h2>
      <p>
        Introduce la información básica de tu {labelNegocio} y del usuario
        administrador.
      </p>

      <div className="form-group">
        <label>Nombre de la {labelNegocio}</label>
        <input
          name="nombre"
          value={tenant.nombre}
          onChange={handleTenantChange}
          placeholder={isShop ? "Ej. Alef Shop" : "Ej. La Campana"}
          required
        />
      </div>

      <div className="form-group">
        <label>Email del administrador</label>
        <input
          type="email"
          name="email"
          value={admin.email}
          onChange={handleAdminChange}
          placeholder={isShop ? "admin@tienda.com" : "admin@restaurante.com"}
          required
        />
      </div>

      <h3>Usuario administrador</h3>

      <div className="form-group">
        <label>Nombre del administrador</label>
        <input
          name="name"
          value={admin.name}
          onChange={handleAdminChange}
          placeholder={isShop ? "Ej. Juan Pérez" : "Ej. María López"}
          required
        />
      </div>

      <div className="info-box">
        <p>Tras completar el pago, te enviaremos un email para crear la contraseña
          del administrador de forma segura.
        </p>
      </div>

      <div className="info-box">
        <p>La cuenta de administrador te permitirá gestionar{" "}
          {isShop
            ? "productos, pedidos y configuraciones de la tienda"
            : "productos, personal y configuraciones del restaurante"}
          . Podrás añadir más usuarios después.
        </p>
      </div>
    </section>
  );
}
