import React, { useMemo } from "react";
import { ALERGENOS, ALERGENOS_BY_CODIGO } from "../../constants/alergenos";
import "./AlergenosSelector.css";

/**
 * Grid de selección de alérgenos.
 * Cada alérgeno tiene 3 estados: ninguno / contiene / puede contener (excluyentes).
 *
 * Props:
 *   alergenos:        string[]  códigos canónicos marcados como CONTIENE
 *   alergenosTrazas:  string[]  códigos canónicos marcados como PUEDE CONTENER
 *   raros:            string[]  valores heredados no mapeables (solo aviso, sin acción)
 *   onChange:         ({ alergenos, alergenosTrazas }) => void
 */
const AlergenosSelector = ({ alergenos = [], alergenosTrazas = [], raros = [], onChange }) => {
  const setContiene = useMemo(() => new Set(alergenos), [alergenos]);
  const setTrazas = useMemo(() => new Set(alergenosTrazas), [alergenosTrazas]);

  const cambiarEstado = (codigo, nuevoEstado) => {
    const nuevosContiene = new Set(setContiene);
    const nuevasTrazas = new Set(setTrazas);

    nuevosContiene.delete(codigo);
    nuevasTrazas.delete(codigo);

    if (nuevoEstado === "contiene") nuevosContiene.add(codigo);
    else if (nuevoEstado === "trazas") nuevasTrazas.add(codigo);

    onChange?.({
      alergenos: Array.from(nuevosContiene),
      alergenosTrazas: Array.from(nuevasTrazas),
    });
  };

  const limpiarTodo = () => onChange?.({ alergenos: [], alergenosTrazas: [] });

  const estadoDe = (codigo) => {
    if (setContiene.has(codigo)) return "contiene";
    if (setTrazas.has(codigo)) return "trazas";
    return "ninguno";
  };

  return (
    <div className="alergenos-selector">
      <div className="alergenos-selector__header">
        <span className="alergenos-selector__col-alergeno">Alérgeno</span>
        <span className="alergenos-selector__col-opcion">Contiene</span>
        <span className="alergenos-selector__col-opcion">Puede contener</span>
      </div>

      {ALERGENOS.map(({ codigo, icono, es }) => {
        const estado = estadoDe(codigo);
        return (
          <div key={codigo} className={`alergenos-selector__row alergenos-selector__row--${estado}`}>
            <label className="alergenos-selector__label">
              <span className="alergenos-selector__icon">{icono}</span>
              <span className="alergenos-selector__nombre">{es}</span>
            </label>

            <label className="alergenos-selector__opt">
              <input
                type="radio"
                name={`alergeno-${codigo}`}
                checked={estado === "contiene"}
                onChange={() => cambiarEstado(codigo, "contiene")}
              />
            </label>

            <label className="alergenos-selector__opt">
              <input
                type="radio"
                name={`alergeno-${codigo}`}
                checked={estado === "trazas"}
                onChange={() => cambiarEstado(codigo, "trazas")}
              />
            </label>

            {estado !== "ninguno" && (
              <button
                type="button"
                className="alergenos-selector__clear-row"
                onClick={() => cambiarEstado(codigo, "ninguno")}
                aria-label={`Quitar ${es}`}
                title="Quitar"
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {raros.length > 0 && (
        <div className="alergenos-selector__raros">
          <strong>⚠️ Valores no estándar detectados:</strong>{" "}
          <code>{raros.join(", ")}</code>
          <p>Se mantendrán hasta que guardes. Marca los equivalentes arriba para reemplazarlos.</p>
        </div>
      )}

      {(setContiene.size > 0 || setTrazas.size > 0) && (
        <button
          type="button"
          className="alergenos-selector__clear-all"
          onClick={limpiarTodo}
        >
          Limpiar todos
        </button>
      )}
    </div>
  );
};

export default AlergenosSelector;
