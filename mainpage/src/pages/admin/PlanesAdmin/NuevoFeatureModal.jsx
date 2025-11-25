import { useState } from "react";
import api from "../../../utils/api";
import "./featureModal.css";

export default function NuevoFeatureModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    clave: "",
    descripcion: "",
    categoria: "general",
    configKey: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const crear = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/superadmin/features", form);
      onSave();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || "Error creando feature.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>➕ Nueva Feature</h2>

        <form onSubmit={crear} className="modal-form">

          <label>
            Nombre
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej. Control de stock"
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
            <select name="categoria" value={form.categoria} onChange={handleChange}>
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
              placeholder="Descripción clara de lo que hace esta funcionalidad"
            />
          </label>

          <div className="modal-buttons">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creando..." : "Crear Feature"}
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
