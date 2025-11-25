import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import "../styles/Soporte.css";

export default function SoporteDetalle() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const cargar = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.ticket);
    } catch (err) {
      console.error("Error cargando ticket", err);
    }
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();

    await api.post(`/tickets/${id}/mensaje`, {
      autor: "cliente",
      mensaje
    });

    setMensaje("");
    cargar();
  };

  useEffect(() => {
    cargar();
  }, [id]);

  if (!ticket)
    return <p className="soporte-loading">Cargando ticket...</p>;

  return (
    <div className="soporte-contenedor">
      <h1>{ticket.asunto}</h1>

      <div className="soporte-chat">
        {ticket.mensajes.map((msg, i) => (
          <div
            key={i}
            className={`msg ${msg.autor === "cliente" ? "cliente" : "admin"}`}
          >
            <p>{msg.mensaje}</p>
            <span>{new Date(msg.fecha).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <form className="soporte-chat-form" onSubmit={enviarMensaje}>
        <input
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribe un mensaje…"
          required
        />
        <button className="btn-primario">Enviar</button>
      </form>
    </div>
  );
}
