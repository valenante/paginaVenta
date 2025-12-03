import React from "react";
import "./PasoColores.css";

export default function PasoColores({ config, setConfig }) {
  const handleColor = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      colores: { ...prev.colores, [name]: value },
    }));
  };

  return (
    <div className="paso-colores-card">
      <h4 className="paso-colores-titulo">Colores</h4>

      <div className="paso-colores-grid">
        {/* Color principal */}
        <div className="paso-color-item">
          <label className="paso-color-label">Color principal</label>

          <div className="paso-color-wrapper">
            <input
              type="color"
              name="principal"
              value={config.colores.principal}
              onChange={handleColor}
              className="paso-color-input"
            />

            <span className="paso-color-code">{config.colores.principal}</span>
          </div>
        </div>

        {/* Color secundario */}
        <div className="paso-color-item">
          <label className="paso-color-label">Color secundario</label>

          <div className="paso-color-wrapper">
            <input
              type="color"
              name="secundario"
              value={config.colores.secundario}
              onChange={handleColor}
              className="paso-color-input"
            />

            <span className="paso-color-code">{config.colores.secundario}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
