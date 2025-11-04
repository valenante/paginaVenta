import { useState } from "react";
import "./ModalNuevaReserva.css";
import api from "../../utils/api";
import AlertaMensaje from "../AlertaMensaje/AlertaMensaje.jsx";

export default function ModalNuevaReserva({ onClose, onCreated }) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    personas: 2,
    hora: "",
    mensaje: "",
    alergias: "",
  });

  const [alerta, setAlerta] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const { data } = await api.post("/reservas", form);
      setAlerta({ tipo: "exito", mensaje: data.mensaje || "Reserva creada correctamente" });
      setTimeout(() => {
        onCreated?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setAlerta({ tipo: "error", mensaje: err.response?.data?.mensaje || "Error al crear reserva" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-contenido modal-nueva-reserva">
        <h2>🆕 Nueva Reserva</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input type="tel" name="telefono" value={form.telefono} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Personas</label>
            <input type="number" name="personas" min="1" max="20" value={form.personas} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Fecha y hora</label>
            <input type="datetime-local" name="hora" value={form.hora} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Mensaje (opcional)</label>
            <textarea name="mensaje" value={form.mensaje} onChange={handleChange} rows="2" />
          </div>

          <div className="form-group">
            <label>Alergias (opcional)</label>
            <textarea name="alergias" value={form.alergias} onChange={handleChange} rows="2" />
          </div>

          <div className="modal-botones">
            <button type="button" onClick={onClose} className="boton-cancelar-modal-confirmacion">
              Cancelar
            </button>
            <button type="submit" className="boton-aceptar-modal-confirmacion" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>

        {alerta && (
          <AlertaMensaje tipo={alerta.tipo} mensaje={alerta.mensaje} onClose={() => setAlerta(null)} />
        )}
      </div>
    </div>
  );
}
