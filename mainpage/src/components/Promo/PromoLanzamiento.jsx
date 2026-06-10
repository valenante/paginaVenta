import React from "react";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import "./PromoLanzamiento.css";

const PROMO = {
  ciudad: "Torremolinos",
  plazasTotal: 10,
  plazasOcupadas: 2,
  clientes: ["Zabor Feten", "Bodegon Argentino"],
  whatsapp: "623754328",
  planes: [
    {
      nombre: "Esencial",
      precioOriginal: 79.99,
      precioPromo: 59.99,
      features: [
        "TPV tactil completo",
        "Carta QR con IA",
        "Facturacion VeriFactu",
        "Stock y proveedores",
        "Soporte incluido",
      ],
    },
    {
      nombre: "Premium",
      precioOriginal: 129.99,
      precioPromo: 109.99,
      destacado: true,
      features: [
        "Todo lo de Esencial",
        "Copiloto IA avanzado",
        "Automatizaciones",
        "Instagram y resenas con IA",
        "Cocina y barra conectadas",
        "Analitica de margenes",
      ],
    },
  ],
  extras: [
    { label: "Instalacion y puesta en marcha", valor: "GRATIS" },
    { label: "Carga de tu carta y datos", valor: "GRATIS" },
    { label: "Formacion personalizada", valor: "GRATIS" },
    { label: "Sin permanencia", valor: "Cancela cuando quieras" },
  ],
};

const PromoLanzamiento = () => {
  useRevealOnScroll();

  const plazasRestantes = PROMO.plazasTotal - PROMO.plazasOcupadas;
  const porcentaje = (PROMO.plazasOcupadas / PROMO.plazasTotal) * 100;
  const whatsappFmt = PROMO.whatsapp.replace(
    /(\d{3})(\d{3})(\d{3})/,
    "$1 $2 $3"
  );

  return (
    <section className="Promo reveal" id="promo">
      <div className="Promo-inner section--wide">
        <span className="Promo-badge">
          Promocion {PROMO.ciudad}
        </span>

        <h2 className="Promo-titulo">
          ALEF llega a {PROMO.ciudad}.
        </h2>

        <p className="Promo-subtitulo">
          Precio de lanzamiento exclusivo para los primeros{" "}
          {PROMO.plazasTotal} restaurantes. Instalacion, carga de datos y
          formacion incluidas sin coste.
        </p>

        <div className="Promo-cards">
          {PROMO.planes.map((plan) => (
            <article
              key={plan.nombre}
              className={`PromoCard${plan.destacado ? " PromoCard--destacado" : ""}`}
            >
              {plan.destacado && (
                <span className="PromoCard-ribbon">Recomendado</span>
              )}

              <h3 className="PromoCard-nombre">{plan.nombre}</h3>

              <div className="PromoCard-precio">
                <span className="PromoCard-precio-original">
                  {plan.precioOriginal.toFixed(2).replace(".", ",")} euros/mes
                </span>
                <span className="PromoCard-precio-promo">
                  {plan.precioPromo.toFixed(2).replace(".", ",")}
                  <span className="PromoCard-precio-unidad"> euros/mes</span>
                </span>
              </div>

              <ul className="PromoCard-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="Promo-extras">
          {PROMO.extras.map((extra) => (
            <div key={extra.label} className="Promo-extra-row">
              <span className="Promo-extra-label">{extra.label}</span>
              <span className="Promo-extra-valor">{extra.valor}</span>
            </div>
          ))}
        </div>

        <p className="Promo-social">
          Ya confian en ALEF:{" "}
          <strong>{PROMO.clientes.join(" · ")}</strong>
        </p>

        <div className="Promo-plazas">
          <div className="Promo-plazas-info">
            <span>
              <strong>{PROMO.plazasOcupadas}</strong> de{" "}
              <strong>{PROMO.plazasTotal}</strong> plazas ocupadas
            </span>
            <span className="Promo-plazas-restantes">
              Quedan {plazasRestantes}
            </span>
          </div>
          <div className="Promo-plazas-bar">
            <div
              className="Promo-plazas-fill"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        <div className="Promo-cta">
          <a href="#contacto" className="Promo-boton principal">
            Reserva tu plaza
          </a>
          <a
            href={`https://wa.me/34${PROMO.whatsapp}`}
            className="Promo-boton whatsapp"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp {whatsappFmt}
          </a>
        </div>
      </div>
    </section>
  );
};

export default PromoLanzamiento;
