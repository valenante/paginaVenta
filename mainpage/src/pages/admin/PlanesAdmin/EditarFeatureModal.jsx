import { useState } from "react";
import api from "../../../utils/api";
import "./featureModal.css";

export default function EditarFeatureModal({ feature, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: feature.nombre,
    clave: feature.clave,                // ⬅️ Ya existía aquí
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
    <div className="modal-overlay-featureEdit">
      <div className="modal-card-featureEdit">
        <h2 className="modal-title-featureEdit">✏️ Editar Feature</h2>

        <form onSubmit={guardar} className="modal-form-featureEdit">

          {/* ===== NOMBRE ===== */}
          <label className="form-label-featureEdit">
            Nombre
            <input
              className="input-featureEdit"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </label>

          {/* ===== CLAVE INTERNA (FALTABA) ===== */}
          <label className="form-label-featureEdit">
            Clave interna (slug)
            <input
              className="input-featureEdit"
              name="clave"
              value={form.clave}
              onChange={handleChange}
              placeholder="Ej: estadisticas_avanzadas"
              required
            />
          </label>

          {/* ===== CONFIGKEY ===== */}
          <label className="form-label-featureEdit">
            Clave de configuración (configKey)
            <input
              className="input-featureEdit"
              name="configKey"
              value={form.configKey}
              onChange={handleChange}
              placeholder="Ej: features.estadisticasAvanzadas"
            />
          </label>

          {/* ===== CATEGORÍA ===== */}
          <label className="form-label-featureEdit">
            Categoría
            <select
              className="select-featureEdit"
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

          {/* ===== DESCRIPCIÓN ===== */}
          <label className="form-label-featureEdit">
            Descripción
            <textarea
              className="textarea-featureEdit"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
            />
          </label>

          {/* ===== SWITCH ACTIVA ===== */}
          <label className="switch-label-featureEdit">
            <input
              type="checkbox"
              className="switch-checkbox-featureEdit"
              checked={form.activa}
              onChange={toggleActiva}
            />
            <span className="switch-text-featureEdit">
              {form.activa ? "Activa ✔" : "Inactiva ✖"}
            </span>
          </label>

          {/* ===== BOTONES ===== */}
          <div className="modal-buttons-featureEdit">
            <button
              type="submit"
              className="btn-primary-featureEdit"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>

            <button
              type="button"
              className="btn-secondary-featureEdit"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
