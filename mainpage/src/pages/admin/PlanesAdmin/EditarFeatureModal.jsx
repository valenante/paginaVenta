import { useState } from "react";
import api from "../../../utils/api";
import "./featureModal.css";

export default function EditarFeatureModal({ feature, onClose, onSave }) {
const [form, setForm] = useState({
  nombre: feature.nombre,
  clave: feature.clave,
  descripcion: feature.descripcion,
  categoria: feature.categoria,
  activa: feature.activa,
  configKey: feature.configKey || "",
});

  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const toggleActiva = () =>
    setForm({ ...form, activa: !form.activa });

  const guardar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/superadmin/features/${feature._id}`, form);
      onSave();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || "Error actualizando feature.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>✏️ Editar Feature</h2>

        <form onSubmit={guardar} className="modal-form">

          <label>
            Nombre
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Clave de configuración (configKey)
            <input
              name="configKey"
              value={form.configKey || ""}
              onChange={handleChange}
              placeholder="Ej: stockHabilitado"
            />
          </label>

          <label>
            Categoría
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
            >
              <option value="general">General</option>
              <option value="tpv">TPV</option>
              <option value="carta">Carta digital</option>
              <option value="facturacion">Facturación</option>
              <option value="extras">Extras</option>
            </select>
          </label>

          <label>
            Descripción
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
            />
          </label>

          <label className="switch-label">
            <input
              type="checkbox"
              checked={form.activa}
              onChange={toggleActiva}
            />
            <span>{form.activa ? "Activa ✔" : "Inactiva ✖"}</span>
          </label>

          <div className="modal-buttons">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>

            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
