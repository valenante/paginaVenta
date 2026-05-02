import React, { useCallback, useMemo, useState } from "react";
import { trackEvent } from "../../utils/trackEvent";
import "./Contact.css";

const WHATSAPP_NUMBER = "34623754328"; // sin +, formato internacional
const CONTACT_EMAIL = "contacto@softalef.com";

const Contact = () => {
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);

  const openWhatsApp = useCallback((text) => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      text
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const openEmailFallback = useCallback((subject, body) => {
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);

      const nombre = String(data.get("nombre") || "").trim();
      const email = String(data.get("email") || "").trim();
      const negocio = String(data.get("negocio") || "").trim();
      const mensaje = String(data.get("mensaje") || "").trim();

      if (!nombre || !email || !mensaje) return;

      setSending(true);
      setSentOk(false);

      const subject = `Solicitud demo Alef — ${negocio || "Negocio sin nombre"}`;
      const body = [
        `Hola! Soy ${nombre}.`,
        `Email: ${email}`,
        `Negocio: ${negocio || "—"}`,
        "",
        mensaje,
      ].join("\n");

      // 1) Abrimos WhatsApp (principal)
      try {
        trackEvent("lead_form_submit", { negocio: negocio || "sin nombre" });
        openWhatsApp(`${subject}\n\n${body}`);
        setSentOk(true);
        form.reset();
      } catch {
        // 2) Fallback a email si WhatsApp falla
        openEmailFallback(subject, body);
      } finally {
        setSending(false);
      }
    },
    [openWhatsApp, openEmailFallback]
  );

  return (
    <section className="Contact section bg-fondo-oscuro reveal" id="contacto">
      <div className="Contact-inner section--wide">
        {/* LADO IZQUIERDO: TEXTO + CANALES DIRECTOS */}
        <div className="Contact-left">
          <span className="Contact-kicker">Demo gratuita</span>
          <h2 className="Contact-title">¿Quieres verlo en accion? Te lo enseñamos en 10 minutos</h2>

          <p className="Contact-subtitle">
            Te mostramos Alef funcionando con datos reales: comandas, cocina,
            cuenta, caja y carta digital. Sin compromiso, sin presion.
          </p>

          <div className="Contact-channels">
            <a href={`mailto:${CONTACT_EMAIL}`} className="Contact-channel" onClick={() => trackEvent("click_email", { location: "contact" })}>
              <div className="Contact-channel-icon">✉️</div>
              <div>
                <span className="Contact-channel-label">Correo electrónico</span>
                <span className="Contact-channel-value">{CONTACT_EMAIL}</span>
              </div>
            </a>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="Contact-channel"
              onClick={() => trackEvent("click_whatsapp", { location: "contact" })}
            >
              <div className="Contact-channel-icon whatsapp">💬</div>
              <div>
                <span className="Contact-channel-label">WhatsApp</span>
                <span className="Contact-channel-value">
                  Respuesta rápida y directa
                </span>
              </div>
            </a>
          </div>

          <p className="Contact-help">
            También podemos agendar una llamada o una demo en directo para
            enseñarte Alef funcionando en un entorno real.
          </p>
        </div>

        {/* LADO DERECHO: FORMULARIO */}
        <div className="Contact-right">
          <form className="Contact-form card" onSubmit={handleSubmit}>
            <div className="Contact-form-header">
              <h3>Solicita información o una demo</h3>
              <p>Te contactaremos lo antes posible.</p>
            </div>

            <div className="Contact-field">
              <label htmlFor="contact-nombre">Nombre</label>
              <input
                id="contact-nombre"
                name="nombre"
                type="text"
                placeholder="Tu nombre"
                required
                autoComplete="name"
              />
            </div>

            <div className="Contact-field">
              <label htmlFor="contact-email">Correo electrónico</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="Contact-field">
              <label htmlFor="contact-negocio">Nombre del negocio (opcional)</label>
              <input
                id="contact-negocio"
                name="negocio"
                type="text"
                placeholder="Restaurante, bar, tienda, shop..."
                autoComplete="organization"
              />
            </div>

            <div className="Contact-field">
              <label htmlFor="contact-mensaje">¿En qué podemos ayudarte?</label>
              <textarea
                id="contact-mensaje"
                name="mensaje"
                placeholder="Cuéntanos brevemente cómo trabajas ahora y qué te gustaría mejorar."
                required
                rows={5}
              />
            </div>

            <p className="Contact-legal">
              Al enviar este formulario aceptas que te contactemos para resolver
              tu consulta. No compartimos tus datos con terceros.
            </p>

            <button
              type="submit"
              className="btn btn-primario Contact-submit"
              disabled={sending}
            >
              {sending ? "Enviando…" : "Enviar consulta"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;