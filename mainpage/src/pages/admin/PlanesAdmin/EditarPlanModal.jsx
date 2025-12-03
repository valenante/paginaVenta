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

  return(
    <div className="modal-overlay-plansEdit">
      <div className="modal-card-plansEdit">
        <h2 className="modal-title-plansEdit">✏️ Editar Plan</h2>

        <form onSubmit={actualizar} className="modal-form-plansEdit">

          <label className="form-label-plansEdit">
            Nombre
            <input
              className="input-plansEdit"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-label-plansEdit">
            Precio Mensual (€)
            <input
              className="input-plansEdit"
              name="precioMensual"
              type="number"
              value={form.precioMensual}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-label-plansEdit">
            Precio Anual (€)
            <input
              className="input-plansEdit"
              name="precioAnual"
              type="number"
              value={form.precioAnual}
              onChange={handleChange}
            />
          </label>

          <label className="form-label-plansEdit">
            Descripción
            <textarea
              className="textarea-plansEdit"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
            />
          </label>

          {/* FEATURES */}
          <h3 className="features-title-plansEdit">Características incluidas</h3>

          <div className="features-list-plansEdit">
            {features.length === 0 && (
              <p className="features-empty-plansEdit">
                No hay features creadas todavía.
              </p>
            )}

            {features.map((f) => (
              <div className="feature-card-plansEdit" key={f._id}>
                <div className="feature-info-plansEdit">
                  <strong>{f.nombre}</strong>
                  {f.descripcion && (
                    <p className="feature-desc-plansEdit">{f.descripcion}</p>
                  )}
                  <small className="feature-tag-plansEdit">
                    clave: <code>{f.clave}</code> · {f.categoria}
                  </small>
                </div>

                <div className="feature-checkbox-plansEdit">
                  <input
                    type="checkbox"
                    className="checkbox-plansEdit"
                    checked={selectedFeatures.includes(f._id)}
                    onChange={() => toggleFeature(f._id)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="modal-buttons-plansEdit">
            <button type="submit" className="btn-primary-plansEdit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </button>

            <button
              type="button"
              className="btn-secondary-plansEdit"
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
