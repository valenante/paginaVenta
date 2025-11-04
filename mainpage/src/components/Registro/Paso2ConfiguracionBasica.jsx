import React from "react";
import "./Paso2ConfiguracionBasica.css";

export default function Paso2ConfiguracionBasica({ config, setConfig }) {
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setConfig((prev) => ({ ...prev, [name]: checked }));
  };

  const handleColorChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      colores: { ...prev.colores, [name]: value },
    }));
  };

  const handleInfoChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      informacionRestaurante: {
        ...prev.informacionRestaurante,
        [field]: value,
      },
    }));
  };

  return (
    <section className="paso2-config">
      <h2>⚙️ Configuración inicial</h2>
      <p>Define opciones básicas del sistema y personaliza los colores de tu marca.</p>

      {/* === Opciones generales === */}
      <div className="config-grupo">
        <label>
          <input
            type="checkbox"
            name="permitePedidosComida"
            checked={config.permitePedidosComida}
            onChange={handleCheckboxChange}
          />
          Permitir pedidos de comida
        </label>

        <label>
          <input
            type="checkbox"
            name="permitePedidosBebida"
            checked={config.permitePedidosBebida}
            onChange={handleCheckboxChange}
          />
          Permitir pedidos de bebida
        </label>

        <label>
          <input
            type="checkbox"
            name="stockHabilitado"
            checked={config.stockHabilitado}
            onChange={handleCheckboxChange}
          />
          Habilitar control de stock
        </label>
      </div>

      {/* === Colores === */}
      <div className="config-colores">
        <h3>🎨 Paleta de colores</h3>
        <div className="color-pickers">
          <div className="color-item">
            <label>Principal</label>
            <input
              type="color"
              name="principal"
              value={config.colores.principal}
              onChange={handleColorChange}
            />
            <span>{config.colores.principal}</span>
          </div>
          <div className="color-item">
            <label>Secundario</label>
            <input
              type="color"
              name="secundario"
              value={config.colores.secundario}
              onChange={handleColorChange}
            />
            <span>{config.colores.secundario}</span>
          </div>
        </div>
      </div>

      {/* === Información restaurante === */}
      <div className="config-info">
        <h3>📞 Información del restaurante</h3>
        <label>Teléfono</label>
        <input
          type="text"
          value={config.informacionRestaurante.telefono}
          onChange={(e) => handleInfoChange("telefono", e.target.value)}
          placeholder="Ej. +34 612 345 678"
        />

        <label>Dirección</label>
        <input
          type="text"
          value={config.informacionRestaurante.direccion}
          onChange={(e) => handleInfoChange("direccion", e.target.value)}
          placeholder="Ej. Calle Mayor 12, Madrid"
        />
      </div>
    </section>
  );
}
