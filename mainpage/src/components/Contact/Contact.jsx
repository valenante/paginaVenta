import React from "react";
import "./Contact.css";

const Contact = () => {
  return (
    <section className="Contact" id="contacto">
      <div className="Contact-left">
        <div className="Contact-info">
          <h2>¿Tienes dudas?</h2>
          <p>Estamos aquí para ayudarte con la digitalización de tu restaurante.</p>
          <a href="mailto:contacto@tpvzf.com" className="Contact-boton">Escríbenos por correo</a>
          <a href="https://wa.me/34600000000" target="_blank" rel="noreferrer" className="Contact-boton whatsapp">
            Escríbenos por WhatsApp
          </a>
        </div>
      </div>

      <div className="Contact-right">
        <form className="Contact-form">
          <input type="text" placeholder="Tu nombre" required />
          <input type="email" placeholder="Tu correo" required />
          <textarea placeholder="¿En qué podemos ayudarte?" required></textarea>
          <button type="submit">Enviar</button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
