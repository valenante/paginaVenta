import React from "react";
import "./PasoConfigInicial.css";

export default function PasoConfigInicial({ config, setConfig }) {
  const handleChange = (e) => {
    const { name, checked } = e.target;
    setConfig((prev) => ({ ...prev, [name]: checked }));
  };

  return (
    <div className="paso-config-card">
      <h4 className="paso-config-titulo">Configuración inicial</h4>

      <label className="paso-config-checkbox">
        <input
          type="checkbox"
          name="permitePedidosComida"
          checked={config.permitePedidosComida}
          onChange={handleChange}
        />
        <span>Permitir pedidos de comida</span>
      </label>

      <label className="paso-config-checkbox">
        <input
          type="checkbox"
          name="permitePedidosBebida"
          checked={config.permitePedidosBebida}
          onChange={handleChange}
        />
        <span>Permitir pedidos de bebida</span>
      </label>

      <label className="paso-config-checkbox">
        <input
          type="checkbox"
          name="stockHabilitado"
          checked={config.stockHabilitado}
          onChange={handleChange}
        />
        <span>Habilitar control de stock</span>
      </label>
    </div>
  );
}
