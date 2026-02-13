import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/Soporte.css";

export default function SoporteNuevo() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    asunto: "",
    descripcion: "",
    prioridad: "media",
  });

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validar = () => {
    if (form.asunto.trim().length < 5) {
      return "El asunto debe tener al menos 5 caracteres.";
    }
    if (form.descripcion.trim().length < 10) {
      return "Describe el problema con un poco más de detalle.";
    }
    return null;
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;

    const errorValidacion = validar();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setEnviando(true);
    setError("");

    try {
      await api.post("/tickets", {
        asunto: form.asunto.trim(),
        descripcion: form.descripcion.trim(),
        prioridad: form.prioridad,
      });

      navigate("/soporte");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "No se pudo crear el ticket. Inténtalo de nuevo."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="soporte-contenedor">
      <div className="soporte-header">
        <div>
          <h1>Nuevo ticket de soporte</h1>
          <p className="soporte-subtitulo">
            Describe tu incidencia y el equipo de soporte te responderá lo antes
            posible.
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
        <small className="soporte-hint">
          {form.asunto.length}/120 caracteres
        </small>

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
        <small className="soporte-hint">
          {form.descripcion.length}/2000 caracteres
        </small>

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
          <option value="critica">
            Crítica — no puedo operar el negocio
          </option>
        </select>

        {error && <p className="soporte-error">{error}</p>}

        <div className="soporte-form-actions">
          <button
            type="submit"
            className="btn btn-primario "
            disabled={enviando}
          >
            {enviando ? "Enviando ticket…" : "Crear ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
