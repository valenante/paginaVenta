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
            Hablemos de tu negocio
          </h2>

          <p className="Contact-subtitle">
            Cuéntanos cómo trabajas ahora y te ayudamos a ver
            cómo Alef puede encajar en tu día a día: TPV,
            gestión de ventas, stock, proveedores, facturación
            legal y mucho más, tanto en restaurante como en tienda.
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
              href="https://wa.me/34623754328"
              target="_blank"
              rel="noreferrer"
              className="Contact-channel"
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
            También podemos agendar una llamada o una demo en directo
            para enseñarte Alef funcionando en un entorno real.
          </p>
        </div>

        {/* LADO DERECHO: FORMULARIO */}
        <div className="Contact-right">
          <form
            className="Contact-form card"
            onSubmit={(e) => {
              e.preventDefault();
              // Integración real más adelante (API / CRM / email)
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
              <label htmlFor="contact-negocio">
                Nombre del negocio (opcional)
              </label>
              <input
                id="contact-negocio"
                type="text"
                placeholder="Restaurante, bar, tienda, shop..."
              />
            </div>

            <div className="Contact-field">
              <label htmlFor="contact-mensaje">
                ¿En qué podemos ayudarte?
              </label>
              <textarea
                id="contact-mensaje"
                placeholder="Cuéntanos brevemente cómo trabajas ahora y qué te gustaría mejorar."
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
