import React from "react";
import { Link } from "react-router-dom";
import ClienteLayout from "./ClienteLayout";
import "./cliente.css";

export default function RecuperarPasswordCliente() {
  return (
    <ClienteLayout narrow>
      <div className="cliente-auth-grid cliente-auth-grid--login">
        <aside className="cliente-auth-hero">
          <h2>Recupera tu cuenta <span>ALEF</span></h2>
          <p>
            Si has olvidado tu contraseña, escríbenos por email o WhatsApp y te
            ayudaremos a recuperar el acceso a tu cuenta y tus puntos en menos
            de un día laboral.
          </p>
        </aside>

        <div className="cliente-auth-card">
          <header className="cliente-auth-card__header">
            <h1>¿Olvidaste tu contraseña?</h1>
            <p>
              La recuperación automática estará disponible muy pronto. Mientras tanto,
              contáctanos y resolvemos al momento.
            </p>
          </header>

          <div className="cliente-recuperar-actions">
            <a
              className="cliente-btn cliente-btn--primary"
              href="mailto:contacto@softalef.com?subject=Recuperar%20cuenta%20ALEF&body=Hola%2C%20no%20recuerdo%20la%20contrase%C3%B1a%20de%20mi%20cuenta%20ALEF.%20Mi%20email%20es%3A%20"
            >
              ✉ Escribir a soporte
            </a>
            <a
              className="cliente-btn cliente-btn--ghost"
              href="https://wa.me/34000000000?text=Hola%2C%20no%20recuerdo%20la%20contrase%C3%B1a%20de%20mi%20cuenta%20ALEF"
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 WhatsApp
            </a>
          </div>

          <div className="cliente-auth-card__alt">
            <Link to="/cliente/login">← Volver a inicio de sesión</Link>
          </div>
        </div>
      </div>
    </ClienteLayout>
  );
}
