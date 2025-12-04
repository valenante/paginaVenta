// src/components/Stock/CrearIngredienteModal.jsx
import React, { useState } from "react";
import api from "../../utils/api";
import AlefSelect from "../AlefSelect/AlefSelect";   // << IMPORTANTE
import "./CrearIngredienteModal.css";

const unidades = ["g", "kg", "ml", "L", "uds"];

export default function CrearIngredienteModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    unidad: "g",
    stockActual: 0,
    stockMinimo: 0,
    stockCritico: 0,
    stockMax: 100,
  });

  const [loading, setLoading] = useState(false);

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const updateUnidad = (value) => {
    setForm({ ...form, unidad: value });
  };

  const crear = async () => {
    try {
      setLoading(true);
      await api.post("/stock/ingrediente", form);
      onSave();
      onClose();
    } catch (e) {
      alert("Error creando ingrediente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alef-modal-overlay" onClick={onClose}>
      <div className="alef-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="crear-ingrediente-modal">
          <h3>➕ Nuevo ingrediente</h3>
          <p>Registra un nuevo insumo para controlar su stock.</p>

          {/* Nombre */}
          <label className="label--editar">
            Nombre
            <input
              className="input--editar"
              name="nombre"
              value={form.nombre}
              onChange={update}
            />
          </label>

          {/* Unidad → usando AlefSelect */}
          <AlefSelect
            label="Unidad"
            value={form.unidad}
            options={unidades}
            onChange={updateUnidad}
            placeholder="Selecciona unidad"
          />

          {/* Campos numéricos */}
          <label className="label--editar">
            Stock inicial
            <input
              className="input--editar"
              type="number"
              name="stockActual"
              value={form.stockActual}
              onChange={update}
            />
          </label>

          <label className="label--editar">
            Stock mínimo
            <input
              className="input--editar"
              type="number"
              name="stockMinimo"
              value={form.stockMinimo}
              onChange={update}
            />
          </label>

          <label className="label--editar">
            Stock crítico
            <input
              className="input--editar"
              type="number"
              name="stockCritico"
              value={form.stockCritico}
              onChange={update}
            />
          </label>

          <label className="label--editar">
            Stock máximo
            <input
              className="input--editar"
              type="number"
              name="stockMax"
              value={form.stockMax}
              onChange={update}
            />
          </label>

          {/* Botones */}
          <div className="botones--editar">
            <button className="boton--cancelar" onClick={onClose}>
              Cancelar
            </button>

            <button className="boton--editar" onClick={crear} disabled={loading}>
              {loading ? "Guardando…" : "Crear ingrediente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
