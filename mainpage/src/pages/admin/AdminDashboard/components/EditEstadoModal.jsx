// src/pages/admin/AdminDashboard/components/EditEstadoModal.jsx
import { useState } from "react";
import '../../../../styles/EditEstadoModal.css'

const ESTADOS_PERMITIDOS = ["trial", "activo", "impago", "suspendido", "cancelado"];

export default function EditEstadoModal({ tenant, onClose, onSave }) {
    const [estado, setEstado] = useState(tenant.estado || "trial");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError("");
            await onSave(tenant._id, estado);
            onClose();
        } catch (err) {
            // onSave ya hace alert, aquí solo mostramos algo suave si quieres
            setError("No se pudo guardar el nuevo estado.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="modal-overlay">
            <div className="estado-modal">
                <div className="estado-modal-header">
                    <h3>Cambiar estado del restaurante</h3>
                </div>

                <div className="estado-modal-body">
                    <p>
                        Restaurante: <strong>{tenant.nombre}</strong>
                    </p>

                    <div className="estado-actual-row">
                        <span>Estado actual:</span>
                        <span className="estado-pill">{tenant.estado}</span>
                    </div>

                    <div className="estado-field">
                        <label>Nuevo estado</label>
                        <select
                            className="estado-select"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                        >
                            {ESTADOS_PERMITIDOS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="estado-modal-error">{error}</p>}
                </div>

                <div className="estado-modal-footer">
                    <button
                        type="button"
                        className="estado-btn-secundario"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="estado-btn"
                        onClick={handleSubmit}
                        disabled={loading || !estado}
                    >
                        {loading ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}
