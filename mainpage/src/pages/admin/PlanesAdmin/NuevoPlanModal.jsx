// NuevoPlanModal.jsx
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import './NuevoPlanModal.css';

export default function NuevoPlanModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    slug: "",
    tipoNegocio: "restaurante", // 👈 por defecto
    precioMensual: "",
    precioAnual: "",
    descripcion: "",
  });

  const [features, setFeatures] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  // 🔥 Cargar todas las features del sistema
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const { data } = await api.get("/admin/superadmin/features");
        setFeatures(data);
      } catch (err) {
        console.error("Error cargando features:", err);
      }
    };
    fetchFeatures();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Manejar toggles de features
  const toggleFeature = (id) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const crear = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/superadminPlans", {
        ...form,
        features: selectedFeatures,   // ⬅️ ahora sí coincide con el backend
      });
      onSave();
      onClose();
    } catch (err) {
      alert("Error creando plan.");
    }
  };

  return (
    <div className="modal-overlay-plans">
      <div className="modal-card-plans">
        <h2 className="modal-title-plans">➕ Crear Plan</h2>

        <form onSubmit={crear} className="modal-form-plans">

          <label className="form-label-plans">
            Nombre
            <input
              className="input-plans"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-label-plans">
            Slug
            <input
              className="input-plans"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-label-plans">
            Tipo de negocio
            <select
              className="input-plans"
              name="tipoNegocio"
              value={form.tipoNegocio}
              onChange={handleChange}
              required
            >
              <option value="restaurante">🍽 Restaurante</option>
              <option value="shop">🛒 Tienda / Shop</option>
            </select>
          </label>


          <label className="form-label-plans">
            Precio Mensual (€)
            <input
              className="input-plans"
              name="precioMensual"
              type="number"
              value={form.precioMensual}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-label-plans">
            Precio Anual (€)
            <input
              className="input-plans"
              name="precioAnual"
              type="number"
              value={form.precioAnual}
              onChange={handleChange}
            />
          </label>

          <label className="form-label-plans">
            Descripción
            <textarea
              className="textarea-plans"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
            />
          </label>

          {/* FEATURES */}
          <h3 className="features-title-plans">Características incluidas</h3>

          <div className="features-list-plans">
            {features.map((f) => (
              <label key={f._id} className="feature-item-plans">
                <input
                  className="feature-checkbox-plans"
                  type="checkbox"
                  checked={selectedFeatures.includes(f._id)}
                  onChange={() => toggleFeature(f._id)}
                />
                <strong>{f.nombre}</strong>
                <small>{f.descripcion}</small>
              </label>
            ))}
          </div>

          {/* BOTONES */}
          <div className="modal-buttons-plans">
            <button type="submit" className="btn-primary-plans">
              Crear
            </button>

            <button
              type="button"
              className="btn-secondary-plans"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
