import React from "react";
import "./PasoDatosBasicos.css";

export default function PasoDatosBasicos({
  tenant,
  setTenant,
  planes,
  loadingPlanes,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTenant((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="paso-basico-card">
      <h4 className="paso-basico-titulo">Datos básicos</h4>

      <div className="paso-basico-field">
        <label className="paso-basico-label">Nombre del restaurante</label>
        <input
          className="paso-basico-input"
          name="nombre"
          value={tenant.nombre}
          onChange={handleChange}
          required
        />
      </div>

      <div className="paso-basico-field">
        <label className="paso-basico-label">Email del dueño</label>
        <input
          className="paso-basico-input"
          type="email"
          name="email"
          value={tenant.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="paso-basico-field">
        <label className="paso-basico-label">Plan</label>

        <select
          className="paso-basico-select"
          name="plan"
          value={tenant.plan}
          onChange={handleChange}
          required
        >
          <option value="">Seleccione un plan...</option>

          {loadingPlanes && <option>Cargando...</option>}

          {!loadingPlanes &&
            planes.map((p) => (
              <option key={p._id} value={p.slug}>
                {p.nombre} — {p.precioMensual}€/mes
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}
