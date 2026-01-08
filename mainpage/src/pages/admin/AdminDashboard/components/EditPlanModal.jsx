// src/pages/admin/AdminDashboard/components/EditPlanModal.jsx
import { useEffect, useState } from "react";
import api from "../../../../utils/api";
import "../../../../styles/EditPlanModal.css";

export default function EditPlanModal({ tenant, onClose, onSave }) {
  const [planes, setPlanes] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(tenant.plan || "");
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Cargar planes al abrir el modal
  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const { data } = await api.get("/admin/superadminPlans");
        const activos = Array.isArray(data)
          ? data.filter((p) => p.activo !== false)
          : [];

        setPlanes(activos);

        // Si el tenant no tiene plan, usamos el primero
        if (!tenant.plan && activos[0]) {
          setSelectedPlan(activos[0].slug);
        }
      } catch (err) {
        console.error("❌ Error cargando planes:", err);
        setError("No se pudieron cargar los planes disponibles.");
      } finally {
        setLoadingPlanes(false);
      }
    };

    fetchPlanes();
  }, [tenant.plan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      setError("Debes seleccionar un plan.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave(tenant._id, selectedPlan);
      onClose();
    } catch (err) {
      console.error("❌ Error guardando plan del tenant:", err);
      setError(
        err?.response?.data?.error ||
          "No se pudo actualizar el plan del restaurante."
      );
    } finally {
      setSaving(false);
    }
  };

  const planInfo =
    planes.find((p) => p.slug === selectedPlan) ||
    planes.find((p) => p.slug === tenant.plan);

  const totalFeatures = Array.isArray(planInfo?.features)
    ? planInfo.features.length
    : 0;

  return (
    <div className="modal-overlay--planModal">
      <div className="modal-content--planModal">
        {/* CABECERA ===================================================== */}
        <header className="header--planModal">
          <h2 className="titulo--planModal">
            Editar plan de{" "}
            <span className="tenant-nombre--planModal">
              {tenant.nombre}
            </span>
          </h2>

          <p className="texto--planModal">
            Selecciona el plan asignado a este restaurante. El cambio de plan
            afecta a su facturación y a las funcionalidades disponibles en el
            TPV.
          </p>

          <p className="plan-actual--planModal">
            Plan actual:
            <span className="badge-plan--planModal">
              {tenant.plan || "Sin plan asignado"}
            </span>
          </p>
        </header>

        {/* FORMULARIO =================================================== */}
        <form onSubmit={handleSubmit} className="form--planModal">
          {/* Selector de plan */}
          <div className="campo--planModal">
            <label htmlFor="planSelect">Nuevo plan</label>
            <select
              id="planSelect"
              className="select--planModal"
              disabled={loadingPlanes}
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              {loadingPlanes && <option>Cargando planes...</option>}

              {!loadingPlanes && planes.length === 0 && (
                <option value="">No hay planes disponibles</option>
              )}

              {!loadingPlanes &&
                planes.length > 0 &&
                planes.map((plan) => (
                  <option key={plan._id} value={plan.slug}>
                    {plan.nombre} — {plan.precioMensual} €/mes
                    {plan.precioAnual > 0 ? ` · ${plan.precioAnual} €/año` : ""}
                  </option>
                ))}
            </select>
          </div>

          {/* DETALLES DEL PLAN ========================================== */}
          {planInfo && (
            <section className="plan-details--planModal">
              {/* Cabecera de detalles */}
              <div className="plan-details-header--planModal">
                <div className="plan-details-main--planModal">
                  <h3 className="plan-name--planModal">
                    {planInfo.nombre}
                  </h3>
                  {planInfo.descripcion && (
                    <p className="plan-tagline--planModal">
                      {planInfo.descripcion}
                    </p>
                  )}
                </div>

                <div className="plan-price-box--planModal">
                  <span className="plan-price-mensual--planModal">
                    {planInfo.precioMensual} €/mes
                  </span>
                  {planInfo.precioAnual > 0 && (
                    <span className="plan-price-anual--planModal">
                      {planInfo.precioAnual} €/año
                    </span>
                  )}
                </div>
              </div>

              {/* Lista de features */}
              {totalFeatures > 0 && (
                <div className="plan-features-wrapper--planModal">
                  <div className="plan-features-header--planModal">
                    <span className="plan-features-title--planModal">
                      Funcionalidades incluidas
                    </span>
                    <span className="plan-features-count--planModal">
                      {totalFeatures} ítems
                    </span>
                  </div>

                  <ul className="plan-features-grid--planModal">
                    {planInfo.features.map((f) => (
                      <li
                        key={f._id || f.slug || f.nombre || f.texto}
                        className="plan-feature-item--planModal"
                      >
                        <span className="plan-feature-icon--planModal">✓</span>
                        <span className="plan-feature-text--planModal">
                          {f.nombre || f.texto || "Funcionalidad"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {error && (
            <p className="mensaje-error--planModal">
              {error}
            </p>
          )}

          {/* BOTONES ===================================================== */}
          <div className="modal-actions--planModal">
            <button
              type="button"
              className="boton-cancelar--planModal"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="boton--planModal"
              disabled={saving || loadingPlanes || !selectedPlan}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
