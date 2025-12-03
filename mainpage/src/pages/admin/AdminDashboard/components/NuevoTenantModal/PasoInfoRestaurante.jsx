import React from "react";
import "./PasoInfoRestaurante.css";

export default function PasoInfoRestaurante({ config, setConfig }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      informacionRestaurante: {
        ...prev.informacionRestaurante,
        [name]: value,
      },
    }));
  };

  return (
    <div className="paso-infoRest-card">
      <h4 className="paso-infoRest-titulo">Información del restaurante</h4>

      {/* Teléfono */}
      <div className="paso-infoRest-field">
        <label className="paso-infoRest-label">Teléfono</label>
        <input
          name="telefono"
          className="paso-infoRest-input"
          value={config.informacionRestaurante.telefono}
          onChange={handleChange}
          placeholder="Ej. +34 612 345 678"
        />
      </div>

      {/* Dirección */}
      <div className="paso-infoRest-field">
        <label className="paso-infoRest-label">Dirección</label>
        <input
          name="direccion"
          className="paso-infoRest-input"
          value={config.informacionRestaurante.direccion}
          onChange={handleChange}
          placeholder="Ej. Calle Mayor 12, Madrid"
        />
      </div>

      {/* Días de apertura */}
      <div className="paso-infoRest-field">
        <label className="paso-infoRest-label">Días de apertura</label>

        <div className="paso-infoRest-dias">
          {[
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado",
            "Domingo",
          ].map((dia) => (
            <label key={dia} className="paso-infoRest-diaItem">
              <input
                type="checkbox"
                checked={config.informacionRestaurante.diasApertura.includes(
                  dia
                )}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setConfig((prev) => {
                    const dias = new Set(
                      prev.informacionRestaurante.diasApertura
                    );
                    checked ? dias.add(dia) : dias.delete(dia);
                    return {
                      ...prev,
                      informacionRestaurante: {
                        ...prev.informacionRestaurante,
                        diasApertura: [...dias],
                      },
                    };
                  });
                }}
              />
              <span>{dia}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Horarios */}
      <div className="paso-infoRest-field">
        <label className="paso-infoRest-label">Horario (comida)</label>
        <input
          name="comida"
          className="paso-infoRest-input"
          value={config.informacionRestaurante.horarios.comida}
          onChange={handleChange}
          placeholder="Ej. 13:00 - 16:00"
        />
      </div>

      <div className="paso-infoRest-field">
        <label className="paso-infoRest-label">Horario (cena)</label>
        <input
          name="cena"
          className="paso-infoRest-input"
          value={config.informacionRestaurante.horarios.cena}
          onChange={handleChange}
          placeholder="Ej. 20:00 - 23:30"
        />
      </div>
    </div>
  );
}
