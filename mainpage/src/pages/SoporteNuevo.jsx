// src/pages/SoporteNuevo.jsx ✅ PERFECTO (UX Errors PRO)
// - OK/avisos: AlertaMensaje
// - Errores backend: ErrorToast (normalizeApiError)
// - Validaciones de UI: AlertaMensaje (warn) + fields si quieres (ready)
// - Sin err.response.data.*
// - Sin strings legacy en catch
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/Soporte.css";

import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ErrorToast from "../components/common/ErrorToast.jsx";
import { normalizeApiError } from "../utils/normalizeApiError.js";

export default function SoporteNuevo() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    asunto: "",
    descripcion: "",
    prioridad: "media",
  });

  const [enviando, setEnviando] = useState(false);

  // OK/avisos
  const [alerta, setAlerta] = useState(null);

  // KO contrato
  const [errorToast, setErrorToast] = useState(null);

  const showOk = (msg) => setAlerta({ tipo: "exito", mensaje: msg });
  const showWarn = (msg) => setAlerta({ tipo: "warn", mensaje: msg });
  const showErr = (err, fallback = "No se pudo completar la operación.") => {
    const n = normalizeApiError(err);
    setErrorToast({ ...n, message: n?.message || fallback });
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validar = () => {
    const asunto = String(form.asunto || "").trim();
    const descripcion = String(form.descripcion || "").trim();

    if (asunto.length < 5) return "El asunto debe tener al menos 5 caracteres.";
    if (descripcion.length < 10) return "Describe el problema con un poco más de detalle.";
    return null;
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;

    const errorValidacion = validar();
    if (errorValidacion) {
      showWarn(errorValidacion);
      return;
    }

    setEnviando(true);
    setErrorToast(null);

    try {
      await api.post("/tickets", {
        asunto: form.asunto.trim(),
        descripcion: form.descripcion.trim(),
        prioridad: form.prioridad,
      });

      // Puedes mostrar éxito, pero normalmente redirigimos directo
      showOk("Ticket creado. Te responderemos lo antes posible.");
      navigate("/soporte");
    } catch (err) {
      showErr(err, "No se pudo crear el ticket. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const onRetry = () => {
    // Reintentar aquí = volver a enviar el formulario
    // (solo si no está enviando)
    if (enviando) return;

    const errorValidacion = validar();
    if (errorValidacion) {
      showWarn(errorValidacion);
      return;
    }

    // simulamos submit
    enviar({ preventDefault: () => {} });
  };

  return (
    <div className="soporte-contenedor">
      {/* ERROR TOAST */}
      {errorToast && (
        <ErrorToast
          error={errorToast}
          onRetry={errorToast.canRetry ? onRetry : undefined}
          onClose={() => setErrorToast(null)}
        />
      )}

      {/* ALERTA OK / avisos */}
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
          autoCerrar
          duracion={3200}
        />
      )}

      <div className="soporte-header">
        <div>
          <h1>Nuevo ticket de soporte</h1>
          <p className="soporte-subtitulo">
            Describe tu incidencia y el equipo de soporte te responderá lo antes posible.
          </p>
        </div>
      </div>

      <form className="soporte-form" onSubmit={enviar} noValidate>
        <label htmlFor="asunto">Asunto</label>
        <input
          id="asunto"
          type="text"
          name="asunto"
          value={form.asunto}
          onChange={handleChange}
          maxLength={120}
          placeholder="Ej: No imprime la cocina"
          disabled={enviando}
          required
        />
        <small className="soporte-hint">{form.asunto.length}/120 caracteres</small>

        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          maxLength={2000}
          placeholder="Explica qué ocurre, cuándo empezó y cómo te afecta…"
          rows={6}
          disabled={enviando}
          required
        />
        <small className="soporte-hint">{form.descripcion.length}/2000 caracteres</small>

        <label htmlFor="prioridad">Prioridad</label>
        <select
          id="prioridad"
          name="prioridad"
          value={form.prioridad}
          onChange={handleChange}
          disabled={enviando}
        >
          <option value="baja">Baja — duda o mejora</option>
          <option value="media">Media — algo no funciona bien</option>
          <option value="alta">Alta — afecta al servicio</option>
          <option value="critica">Crítica — no puedo operar el negocio</option>
        </select>

        <div className="soporte-form-actions">
          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Enviando ticket…" : "Crear ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}