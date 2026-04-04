import { useMemo, useState } from "react";
import "../../../../styles/EditEstadoModal.css";

const ESTADOS_PERMITIDOS = ["trial", "activo", "impago", "suspendido", "cancelado"];

const TRANSICIONES = {
  trial: ["activo", "suspendido", "cancelado"],
  activo: ["impago", "suspendido", "cancelado"],
  impago: ["activo", "suspendido", "cancelado"],
  suspendido: ["activo", "cancelado"],
  cancelado: ["activo"],
};

const ADVERTENCIAS = {
  suspendido: "Se pausará la suscripción en Stripe, se revocarán los tokens de todos los usuarios y se bloqueará el acceso al TPV y la Carta.",
  cancelado: "Se cancelará la suscripción en Stripe definitivamente, se revocarán los tokens y se bloqueará todo acceso.",
  impago: "Se bloqueará el acceso al TPV y la Carta hasta que se resuelva el pago.",
  activo: "Se reactivará el acceso al TPV y la Carta. Si la suscripción estaba pausada en Stripe, se reanudará.",
};

const ESTADO_LABELS = {
  trial: "Trial",
  activo: "Activo",
  impago: "Impago",
  suspendido: "Suspendido",
  cancelado: "Cancelado",
};

export default function EditEstadoModal({ tenant, onClose, onSave }) {
  const [estado, setEstado] = useState(tenant.estado || "trial");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const permitidos = useMemo(() => TRANSICIONES[tenant.estado] || [], [tenant.estado]);
  const needsMotivo = ["suspendido", "cancelado", "impago"].includes(estado) && estado !== tenant.estado;
  const advertencia = estado !== tenant.estado ? ADVERTENCIAS[estado] : null;

  const handleSubmit = async () => {
    if (needsMotivo && motivo.trim().length < 10) {
      setError("El motivo debe tener al menos 10 caracteres.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await onSave(tenant._id, estado, motivo.trim() || undefined);
      onClose();
    } catch {
      setError("No se pudo guardar el nuevo estado.");
    } finally {
      setLoading(false);
    }
  };

  const historial = tenant.estadoHistorial || [];

  return (
    <div className="modal-overlay">
      <div className="estado-modal">
        <div className="estado-modal-header">
          <h3>Cambiar estado</h3>
        </div>

        <div className="estado-modal-body">
          <p>
            Restaurante: <strong>{tenant.nombre}</strong>
          </p>

          <div className="estado-actual-row">
            <span>Estado actual:</span>
            <span className={`estado-pill estado-pill--${tenant.estado}`}>
              {ESTADO_LABELS[tenant.estado] || tenant.estado}
            </span>
          </div>

          <div className="estado-field">
            <label>Nuevo estado</label>
            <select
              className="estado-select"
              value={estado}
              onChange={(e) => { setEstado(e.target.value); setError(""); }}
            >
              <option value={tenant.estado} disabled>
                {ESTADO_LABELS[tenant.estado]} (actual)
              </option>
              {permitidos.map((option) => (
                <option key={option} value={option}>
                  {ESTADO_LABELS[option] || option}
                </option>
              ))}
            </select>
          </div>

          {advertencia && (
            <div className={`estado-warning estado-warning--${estado}`}>
              {advertencia}
            </div>
          )}

          {needsMotivo && (
            <div className="estado-field">
              <label>Motivo (obligatorio)</label>
              <textarea
                className="estado-textarea"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Describe el motivo del cambio (mín. 10 caracteres)..."
                rows={3}
              />
            </div>
          )}

          {error && <p className="estado-modal-error">{error}</p>}

          {historial.length > 0 && (
            <div className="estado-historial">
              <h4>Historial de cambios</h4>
              <div className="estado-historial-list">
                {historial.slice(-5).reverse().map((h, i) => (
                  <div className="estado-historial-item" key={i}>
                    <span className={`estado-pill estado-pill--${h.estado}`}>
                      {ESTADO_LABELS[h.estado] || h.estado}
                    </span>
                    <span className="estado-historial-arrow">←</span>
                    <span className="estado-historial-prev">{ESTADO_LABELS[h.anterior] || h.anterior}</span>
                    <span className="estado-historial-date">
                      {h.fecha ? new Date(h.fecha).toLocaleString("es-ES") : "—"}
                    </span>
                    {h.motivo && <span className="estado-historial-motivo">{h.motivo}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="estado-modal-footer">
          <button type="button" className="estado-btn-secundario" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className="estado-btn"
            onClick={handleSubmit}
            disabled={loading || estado === tenant.estado}
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
