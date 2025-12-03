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

      setAlerta({
        tipo: "exito",
        mensaje: data.mensaje || "Reserva creada correctamente",
      });

      setTimeout(() => {
        onCreated?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setAlerta({
        tipo: "error",
        mensaje:
          err.response?.data?.mensaje || "Error al crear la reserva",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay--modalnuevareserva modal-overlay-reservas--modalnuevareserva">
      <div className="card modal-contenido--modalnuevareserva modal-nueva-reserva--modalnuevareserva">

        {/* HEADER */}
        <header className="modal-nueva-header--modalnuevareserva">
          <div>
            <h2 className="modal-nueva-title--modalnuevareserva">🆕 Nueva reserva</h2>
            <p className="modal-nueva-subtitle--modalnuevareserva text-suave">
              Crea una reserva rápida para un cliente desde el TPV.
              Los datos se guardarán en el módulo de reservas.
            </p>
          </div>

          <button
            type="button"
            className="btn-icon-only modal-nueva-close--modalnuevareserva"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        {/* FORMULARIO */}
        <form
          onSubmit={handleSubmit}
          className="modal-nueva-form--modalnuevareserva"
          autoComplete="off"
        >
          {/* Grid principal */}
          <div className="form-grid--modalnuevareserva">

            <div className="form-group--modalnuevareserva">
              <label>Nombre</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group--modalnuevareserva">
              <label>Personas</label>
              <input
                type="number"
                name="personas"
                min="1"
                max="20"
                value={form.personas}
                onChange={handleChange}
              />
            </div>

            <div className="form-group--modalnuevareserva">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group--modalnuevareserva">
              <label>Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group--modalnuevareserva form-group-full--modalnuevareserva">
              <label>Fecha y hora</label>
              <input
                type="datetime-local"
                name="hora"
                value={form.hora}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group--modalnuevareserva form-group-full--modalnuevareserva">
              <label>Mensaje (opcional)</label>
              <textarea
                name="mensaje"
                value={form.mensaje}
                onChange={handleChange}
                rows="2"
              />
            </div>

            <div className="form-group--modalnuevareserva form-group-full--modalnuevareserva">
              <label>Alergias (opcional)</label>
              <textarea
                name="alergias"
                value={form.alergias}
                onChange={handleChange}
                rows="2"
              />
            </div>
          </div>

          {/* BOTONES */}
          <div className="modal-botones--modalnuevareserva">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secundario boton-cancelar-modal-confirmacion--modalnuevareserva"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primario boton-aceptar-modal-confirmacion--modalnuevareserva"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>

        {/* ALERTA */}
        {alerta && (
          <div className="modal-alerta-wrapper--modalnuevareserva">
            <AlertaMensaje
              tipo={alerta.tipo}
              mensaje={alerta.mensaje}
              onClose={() => setAlerta(null)}
            />
          </div>
        )}

      </div>
    </div>
  );
}
