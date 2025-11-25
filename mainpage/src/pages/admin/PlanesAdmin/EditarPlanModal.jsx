// src/pages/admin/PlanesAdmin/EditarPlanModal.jsx
import { useState } from "react";
import api from "../../../utils/api";

export default function EditarPlanModal({ plan, onClose, onSave, features = [] }) {
  const [form, setForm] = useState({
    nombre: plan.nombre || "",
    precioMensual: plan.precioMensual || "",
    precioAnual: plan.precioAnual || "",
    descripcion: plan.descripcion || "",
  });

  const [loading, setLoading] = useState(false);

  // 🧩 IDs de features seleccionadas en este plan
  const [selectedFeatures, setSelectedFeatures] = useState(
    (plan.features || []).map((f) => (typeof f === "string" ? f : f._id))
  );

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const toggleFeature = (id) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const actualizar = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/superadminPlans/${plan._id}`, {
        ...form,
        features: selectedFeatures,
      });

      onSave();
      onClose();
    } catch (err) {
      console.error("Error actualizando plan:", err);
      alert(err.response?.data?.error || "Error actualizando plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>✏️ Editar Plan</h2>

        <form onSubmit={actualizar} className="modal-form">
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

          {/* ================== FEATURES ================== */}
          <h3 style={{ marginTop: "1.5rem" }}>Características incluidas</h3>

          <div className="features-list">
            {features.length === 0 && (
              <p style={{ fontSize: ".9rem", color: "#777" }}>
                No hay features creadas todavía.
              </p>
            )}

            {features.map((f) => (
              <div className="feature-card" key={f._id}>
                <div className="feature-info">
                  <strong>{f.nombre}</strong>
                  {f.descripcion && (
                    <p className="feature-desc">{f.descripcion}</p>
                  )}
                  <small className="feature-tag">
                    clave: <code>{f.clave}</code> · {f.categoria}
                  </small>
                </div>

                <div className="feature-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(f._id)}
                    onChange={() => toggleFeature(f._id)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="modal-buttons">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
