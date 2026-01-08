import { useState } from "react";
import api from "../../../utils/api";
import "./featureModal.css";

// src/components/.../NuevoFeatureModal.jsx
export default function NuevoFeatureModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    clave: "",
    descripcion: "",
    categoria: "tpv",
    configKey: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const crear = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/superadmin/features", form);
      onSave();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || "Error creando feature.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay-featureCreate">
      <div className="modal-card-featureCreate">
        <h2 className="modal-title-featureCreate">➕ Nueva Feature</h2>

        <form onSubmit={crear} className="modal-form-featureCreate">
          <label className="form-label-featureCreate">
            Nombre
            <input
              className="input-featureCreate"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej. Estadísticas avanzadas"
              required
            />
          </label>

          <label className="form-label-featureCreate">
            Clave interna (slug)
            <input
              className="input-featureCreate"
              name="clave"
              value={form.clave}
              onChange={handleChange}
              placeholder="Ej: estadisticas_avanzadas"
            />
          </label>

          <label className="form-label-featureCreate">
            Clave de configuración (configKey)
            <input
              className="input-featureCreate"
              name="configKey"
              value={form.configKey || ""}
              onChange={handleChange}
              placeholder="Ej: features.estadisticasAvanzadas"
              required
            />
          </label>

          <label className="form-label-featureCreate">
            Categoría
            <select
              className="select-featureCreate"
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

          <label className="form-label-featureCreate">
            Descripción
            <textarea
              className="textarea-featureCreate"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Descripción clara de lo que hace esta funcionalidad"
            />
          </label>

          <div className="modal-buttons-featureCreate">
            <button
              type="submit"
              className="btn-primary-featureCreate"
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear Feature"}
            </button>

            <button
              type="button"
              className="btn-secondary-featureCreate"
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
