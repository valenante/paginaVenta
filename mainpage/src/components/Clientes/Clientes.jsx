import React from "react";
import "./Clientes.css";
import logoZF from "../../assets/imagenes/logo-zabor-feten.png";
import logoBA from "../../assets/imagenes/logo-bodegon-argentino.png";

const MAIN_DOMAIN = import.meta.env.VITE_MAIN_DOMAIN || "softalef.com";

const clientes = [
  {
    nombre: "Zabor Feten",
    logo: logoZF,
    slug: "zabor-feten",
    ciudad: "Torremolinos, Malaga",
  },
  {
    nombre: "Bodegon Argentino",
    logo: logoBA,
    slug: "bodegon-argentino",
    ciudad: "Torremolinos, Malaga",
  },
];

export default function Clientes() {
  return (
    <section className="Clientes" id="clientes">
      <div className="Clientes-inner">
        <span className="Clientes-kicker">Restaurantes que confian en Alef</span>
        <h2 className="Clientes-titulo">Funcionando en restaurantes reales cada día</h2>
        <p className="Clientes-sub">
          Estos restaurantes ya gestionan su operativa, stock, finanzas y cocina con Alef.
          Pulsa en su logo para ver su carta digital en directo.
        </p>

        <div className="Clientes-grid">
          {clientes.map((c) => (
            <a
              key={c.slug}
              href={`https://${c.slug}-carta.${MAIN_DOMAIN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="Clientes-card"
              title={`Ver carta de ${c.nombre}`}
            >
              <div className="Clientes-logo-wrap">
                <img
                  src={c.logo}
                  alt={`Logo ${c.nombre}`}
                  className="Clientes-logo"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="Clientes-info">
                <span className="Clientes-nombre">{c.nombre}</span>
                <span className="Clientes-ciudad">{c.ciudad}</span>
              </div>
              <span className="Clientes-cta">Ver carta &rarr;</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
