import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import "../styles/Soporte.css";

export default function SoporteDetalle() {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.ticket);
    } catch (err) {
      console.error("Error cargando ticket", err);
      setError("No se pudo cargar el ticket.");
    }
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (enviando) return;

    if (mensaje.trim().length < 2) {
      setError("El mensaje es demasiado corto.");
      return;
    }

    setEnviando(true);
    setError("");

    try {
      await api.post(`/tickets/${id}/mensaje`, {
        mensaje: mensaje.trim(),
      });

      setMensaje("");
      await cargar();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "No se pudo enviar el mensaje. Inténtalo de nuevo."
      );
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!ticket) {
    return <p className="soporte-loading">Cargando ticket…</p>;
  }

  const ticketCerrado = ticket.estado === "cerrado";

  return (
    <div className="soporte-contenedor">
      {/* HEADER */}
      <div className="soporte-header">
        <div>
          <h1>{ticket.asunto}</h1>
          <p className="soporte-subtitulo">
            Ticket #{ticket._id.slice(-6)}
          </p>
        </div>

        <div className="soporte-badges">
          <span className={`badge-estado estado-${ticket.estado}`}>
            {ticket.estado}
          </span>
          <span className={`badge-prioridad prioridad-${ticket.prioridad}`}>
            {ticket.prioridad}
          </span>
        </div>
      </div>

      {/* CHAT */}
      <div className="soporte-chat">
        {ticket.mensajes.map((msg, i) => (
          <div
            key={i}
            className={`msg ${
              msg.autor === "cliente" ? "cliente" : "admin"
            }`}
          >
            <div className="msg-bubble">
              <p>{msg.mensaje}</p>
              <span className="msg-fecha">
                {new Date(msg.fecha).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* AVISO CERRADO */}
      {ticketCerrado && (
        <p className="soporte-info">
          Este ticket está cerrado. Si necesitas más ayuda, crea un nuevo ticket.
        </p>
      )}

      {/* FORM */}
      {!ticketCerrado && (
        <form className="soporte-chat-form" onSubmit={enviarMensaje}>
          <input
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribe un mensaje…"
            maxLength={2000}
            disabled={enviando}
            required
          />
          <button
            className="btn btn-primario "
            type="submit"
            disabled={enviando}
          >
            {enviando ? "Enviando…" : "Enviar"}
          </button>
        </form>
      )}

      {error && <p className="soporte-error">{error}</p>}
    </div>
  );
}
