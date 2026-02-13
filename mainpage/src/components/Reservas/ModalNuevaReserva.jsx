import { useEffect, useMemo, useRef, useState } from "react";
import "./ModalNuevaReserva.css";
import api from "../../utils/api";
import AlertaMensaje from "../AlertaMensaje/AlertaMensaje.jsx";

export default function ModalNuevaReserva({ onClose, onCreated }) {
  const dialogRef = useRef(null);

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

  const closeSafe = () => {
    if (saving) return;
    onClose?.();
  };

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeSafe();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving]);

  // Focus inicial (sin librerías)
  useEffect(() => {
    const el = dialogRef.current?.querySelector('input[name="nombre"]');
    el?.focus?.();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === "personas") {
        const n = Number(value);
        return { ...prev, personas: Number.isFinite(n) ? n : prev.personas };
      }
      return { ...prev, [name]: value };
    });
  };

  const trimOr = (v) => String(v || "").trim();
  const isEmail = (v) => /\S+@\S+\.\S+/.test(String(v || ""));
  const canSubmit = useMemo(() => {
    const nombreOk = trimOr(form.nombre).length >= 2;
    const telOk = trimOr(form.telefono).length >= 6;
    const emailOk = isEmail(form.email);
    const horaOk = !!form.hora;
    const persOk = Number.isInteger(Number(form.personas)) && Number(form.personas) >= 1;
    return nombreOk && telOk && emailOk && horaOk && persOk;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlerta(null);

    if (!canSubmit) {
      setAlerta({ tipo: "error", mensaje: "Revisa los campos obligatorios." });
      return;
    }

    try {
      setSaving(true);

      // Si quieres marcar origen TPV en backend: envía origen:"tpv"
      // y en el controller permite origen solo si req.user existe.
      const payload = {
        ...form,
        nombre: trimOr(form.nombre),
        email: trimOr(form.email).toLowerCase(),
        telefono: trimOr(form.telefono),
        mensaje: String(form.mensaje || ""),
        alergias: String(form.alergias || ""),
        // origen: "tpv",
      };

      const { data } = await api.post("/reservas", payload);

      setAlerta({
        tipo: "exito",
        mensaje: data?.mensaje || "Reserva creada correctamente.",
      });

      // cierra rápido pero dejando feedback
      setTimeout(() => {
        onCreated?.();
        onClose?.();
      }, 900);
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.error ||
        "Error al crear la reserva.";
      setAlerta({ tipo: "error", mensaje: msg });
    } finally {
      setSaving(false);
    }
  };

  // Click fuera para cerrar
  const onOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) closeSafe();
  };

  return (
    <div
      className="mnr-overlay"
      onMouseDown={onOverlayMouseDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="card mnr-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mnr-title"
        aria-describedby="mnr-subtitle"
      >
        {/* HEADER */}
        <header className="mnr-header">
          <div className="mnr-headtext">
            <h2 id="mnr-title" className="mnr-title">
              🆕 Nueva reserva
            </h2>
            <p id="mnr-subtitle" className="mnr-subtitle text-suave">
              Crea una reserva para un cliente desde el TPV. Se guardará en el módulo
              de reservas y podrás confirmarla o cancelarla.
            </p>
          </div>

          <button
            type="button"
            className="btn-icon-only mnr-close"
            onClick={closeSafe}
            aria-label="Cerrar"
            disabled={saving}
            title={saving ? "Guardando..." : "Cerrar"}
          >
            ✕
          </button>
        </header>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="mnr-form" autoComplete="off">
          <div className="mnr-grid">
            <div className="mnr-field">
              <label htmlFor="mnr-nombre">Nombre</label>
              <input
                id="mnr-nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                placeholder="Nombre del cliente"
                autoComplete="name"
                disabled={saving}
              />
            </div>

            <div className="mnr-field">
              <label htmlFor="mnr-personas">Personas</label>
              <input
                id="mnr-personas"
                type="number"
                name="personas"
                min="1"
                max="20"
                value={form.personas}
                onChange={handleChange}
                inputMode="numeric"
                disabled={saving}
              />
            </div>

            <div className="mnr-field">
              <label htmlFor="mnr-email">Email</label>
              <input
                id="mnr-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="cliente@email.com"
                autoComplete="email"
                inputMode="email"
                disabled={saving}
              />
            </div>

            <div className="mnr-field">
              <label htmlFor="mnr-telefono">Teléfono</label>
              <input
                id="mnr-telefono"
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                required
                placeholder="600 000 000"
                autoComplete="tel"
                inputMode="tel"
                disabled={saving}
              />
            </div>

            <div className="mnr-field mnr-full">
              <label htmlFor="mnr-hora">Fecha y hora</label>
              <input
                id="mnr-hora"
                type="datetime-local"
                name="hora"
                value={form.hora}
                onChange={handleChange}
                required
                disabled={saving}
              />
              <p className="mnr-help text-suave">
                Recomendación: elige una hora dentro de una franja disponible.
              </p>
            </div>

            <div className="mnr-field mnr-full">
              <label htmlFor="mnr-mensaje">Mensaje (opcional)</label>
              <textarea
                id="mnr-mensaje"
                name="mensaje"
                value={form.mensaje}
                onChange={handleChange}
                rows={2}
                placeholder="Ej: mesa cerca de ventana..."
                disabled={saving}
              />
            </div>

            <div className="mnr-field mnr-full">
              <label htmlFor="mnr-alergias">Alergias (opcional)</label>
              <textarea
                id="mnr-alergias"
                name="alergias"
                value={form.alergias}
                onChange={handleChange}
                rows={2}
                placeholder="Ej: gluten, marisco..."
                disabled={saving}
              />
            </div>
          </div>

          {/* FOOTER ACCIONES */}
          <footer className="mnr-actions">
            <button
              type="button"
              onClick={closeSafe}
              className="btn btn-secundario mnr-btn"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primario  mnr-btn"
              disabled={saving || !canSubmit}
              title={!canSubmit ? "Completa los campos obligatorios" : "Guardar"}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </footer>

          {/* ALERTA */}
          {alerta && (
            <div className="mnr-alert">
              <AlertaMensaje
                tipo={alerta.tipo}
                mensaje={alerta.mensaje}
                onClose={() => setAlerta(null)}
              />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
