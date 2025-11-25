// NuevoPlanModal.jsx
import { useState, useEffect } from "react";
import api from "../../../utils/api";

export default function NuevoPlanModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    slug: "",
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
        const { data } = await api.get("/superadmin/features");
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
      await api.post("/superadminPlans", {
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
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>➕ Crear Plan</h2>

        <form onSubmit={crear} className="modal-form">
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
            Slug
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Precio Mensual (€)
            <input
              name="precioMensual"
              type="number"
              value={form.precioMensual}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Precio Anual (€)
            <input
              name="precioAnual"
              type="number"
              value={form.precioAnual}
              onChange={handleChange}
            />
          </label>

          <label>
            Descripción
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
            />
          </label>

          {/* ===================== FEATURES DINÁMICAS ===================== */}
          <h3>Características incluidas</h3>
          <div className="features-list">
            {features.map((f) => (
              <label key={f._id} className="feature-item">
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(f._id)}
                  onChange={() => toggleFeature(f._id)}
                />
                <strong>{f.nombre}</strong>
                <small>{f.descripcion}</small>
              </label>
            ))}
          </div>
          {/* ============================================================= */}

          <div className="modal-buttons">
            <button type="submit" className="btn-primary">
              Crear
            </button>
            <button
              type="button"
              className="btn-secondary"
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
