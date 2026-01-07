import React from "react";
import "./Contact.css";

const Contact = () => {
  return (
    <section className="Contact section bg-fondo-oscuro reveal" id="contacto">
      <div className="Contact-inner section--wide">
        {/* LADO IZQUIERDO: TEXTO + CANALES DIRECTOS */}
        <div className="Contact-left">
          <span className="Contact-kicker">Contacto</span>
          <h2 className="Contact-title">
            Hablemos de tu restaurante
          </h2>

          <p className="Contact-subtitle">
            Cuéntanos cómo trabajáis ahora y te ayudamos a ver
            cómo Alef puede encajar en vuestro día a día: TPV,
            carta digital, reservas, VeriFactu y más.
          </p>

          <div className="Contact-channels">
            <a
              href="mailto:contacto@softalef.com"
              className="Contact-channel"
            >
              <div className="Contact-channel-icon">✉️</div>
              <div>
                <span className="Contact-channel-label">Correo electrónico</span>
                <span className="Contact-channel-value">
                  contacto@softalef.com
                </span>
              </div>
            </a>

            <a
              href="https://wa.me/34600000000"
              target="_blank"
              rel="noreferrer"
              className="Contact-channel"
            >
              <div className="Contact-channel-icon whatsapp">💬</div>
              <div>
                <span className="Contact-channel-label">WhatsApp</span>
                <span className="Contact-channel-value">
                  Respuesta rápida en horario de servicio
                </span>
              </div>
            </a>
          </div>

          <p className="Contact-help">
            También podemos agendar una llamada para ver el TPV
            en directo con tu equipo.
          </p>
        </div>

        {/* LADO DERECHO: FORMULARIO */}
        <div className="Contact-right">
          <form
            className="Contact-form card"
            onSubmit={(e) => {
              e.preventDefault();
              // Aquí más adelante puedes integrar envío real (API / email)
            }}
          >
            <div className="Contact-form-header">
              <h3>Solicita información o una demo</h3>
              <p>Te contactaremos lo antes posible.</p>
            </div>

            <div className="Contact-field">
              <label htmlFor="contact-nombre">Nombre</label>
              <input
                id="contact-nombre"
                type="text"
                placeholder="Tu nombre"
                required
              />
            </div>

            <div className="Contact-field">
              <label htmlFor="contact-email">Correo electrónico</label>
              <input
                id="contact-email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                required
              />
            </div>

            <div className="Contact-field">
              <label htmlFor="contact-restaurante">
                Nombre del restaurante (opcional)
              </label>
              <input
                id="contact-restaurante"
                type="text"
                placeholder="Restaurante, bar, cafetería, shop..."
              />
            </div>

            <div className="Contact-field">
              <label htmlFor="contact-mensaje">
                ¿En qué podemos ayudarte?
              </label>
              <textarea
                id="contact-mensaje"
                placeholder="Cuéntanos brevemente tu situación actual y qué te gustaría mejorar."
                required
              />
            </div>

            <p className="Contact-legal">
              Al enviar este formulario aceptas que te contactemos para
              resolver tu consulta. No compartimos tus datos con terceros.
            </p>

            <button type="submit" className="btn btn-primario Contact-submit">
              Enviar consulta
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
