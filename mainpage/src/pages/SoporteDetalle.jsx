// src/pages/SoporteDetalle.jsx ✅ PERFECTO (UX Errors PRO)
// - OK/avisos: AlertaMensaje
// - Errores backend: ErrorToast (normalizeApiError)
// - Sin console.error, sin err.response.data.*
// - Retry del toast: recarga ticket
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import "../styles/Soporte.css";

import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ErrorToast from "../components/common/ErrorToast.jsx";
import { normalizeApiError } from "../utils/normalizeApiError.js";

export default function SoporteDetalle() {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  // OK / avisos
  const [alerta, setAlerta] = useState(null);

  // KO contrato
  const [errorToast, setErrorToast] = useState(null);

  const showOk = (msg) => setAlerta({ tipo: "exito", mensaje: msg });
  const showWarn = (msg) => setAlerta({ tipo: "warn", mensaje: msg });
  const showErr = (err, fallback = "No se pudo completar la operación.") => {
    const n = normalizeApiError(err);
    setErrorToast({ ...n, message: n?.message || fallback });
  };

  const cargar = useCallback(async () => {
    try {
      setErrorToast(null);
      const res = await api.get(`/tickets/${id}`);
      setTicket(res?.data?.ticket || null);
    } catch (err) {
      setTicket(null);
      showErr(err, "No se pudo cargar el ticket.");
    }
  }, [id]);

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (enviando) return;

    const text = String(mensaje || "").trim();

    if (text.length < 2) {
      showWarn("El mensaje es demasiado corto.");
      return;
    }

    setEnviando(true);
    setErrorToast(null);

    try {
      await api.post(`/tickets/${id}/mensaje`, { mensaje: text });

      setMensaje("");
      showOk("Mensaje enviado.");
      await cargar();
    } catch (err) {
      showErr(err, "No se pudo enviar el mensaje. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [cargar]);

  const onRetry = useCallback(() => {
    cargar();
  }, [cargar]);

  if (!ticket) {
    return (
      <div className="soporte-contenedor">
        {errorToast && (
          <ErrorToast
            error={errorToast}
            onRetry={errorToast.canRetry ? onRetry : undefined}
            onClose={() => setErrorToast(null)}
          />
        )}
        {alerta && (
          <AlertaMensaje
            tipo={alerta.tipo}
            mensaje={alerta.mensaje}
            onClose={() => setAlerta(null)}
            autoCerrar
            duracion={3400}
          />
        )}

        <p className="soporte-loading">Cargando ticket…</p>

        <div style={{ marginTop: 12 }}>
          <button className="btn btn-secundario" onClick={cargar}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const ticketCerrado = ticket.estado === "cerrado";

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
          duracion={3400}
        />
      )}

      {/* HEADER */}
      <div className="soporte-header">
        <div>
          <h1>{ticket.asunto}</h1>
          <p className="soporte-subtitulo">Ticket #{String(ticket._id || "").slice(-6)}</p>
        </div>

        <div className="soporte-badges">
          <span className={`badge-estado estado-${ticket.estado}`}>{ticket.estado}</span>
          <span className={`badge-prioridad prioridad-${ticket.prioridad}`}>{ticket.prioridad}</span>
        </div>
      </div>

      {/* CHAT */}
      <div className="soporte-chat">
        {(ticket.mensajes || []).map((msg, i) => (
          <div key={i} className={`msg ${msg.autor === "cliente" ? "cliente" : "admin"}`}>
            <div className="msg-bubble">
              <p>{msg.mensaje}</p>
              <span className="msg-fecha">{new Date(msg.fecha).toLocaleString()}</span>
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
          <button className="btn btn-primario" type="submit" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar"}
          </button>
        </form>
      )}
    </div>
  );
}