// src/components/Hero/Hero.jsx
import React from "react";
import "./Hero.css";
import facturaImg from "../../assets/imagenes/facturacion.png";

const Hero = () => {
  return (
    <section className="Hero section bg-fondo-claro reveal" id="verifactu">
      <div className="Hero-inner section--wide">
        {/* Columna texto */}
        <div className="Hero-texto">
          <div className="Hero-badge">
            Listo para Ley Antifraude y VERI*FACTU
          </div>

          <h2 className="Hero-titulo">
            Facturación encadenada, <br />
            preparada para conectarse con Hacienda
          </h2>

          <p className="Hero-parrafo">
            Alef genera facturas encadenadas con hash inalterable, registra
            cada emisión y rectificación y está diseñado para integrarse con
            VERI*FACTU en cuanto la Agencia Tributaria habilite el sistema
            definitivo. Así tu restaurante se adelanta a la normativa y evita
            sorpresas de última hora.
          </p>

          <ul className="Hero-lista">
            <li>📌 Numeración encadenada y registro de cada factura y ticket.</li>
            <li>📌 Hash antifraude y trazabilidad de modificaciones.</li>
            <li>📌 Preparado para enviar la información a la AEAT (VERI*FACTU).</li>
          </ul>

          <p className="Hero-aviso">
            <strong>Sin letra pequeña:</strong> te acompañamos en la adaptación
            a la nueva normativa y te explicamos, en lenguaje claro, qué implica
            para tu restaurante.
          </p>

          <div className="Hero-acciones">
            <a href="#packs" className="Hero-boton btn btn-primario ">
              Ver planes con facturación antifraude
            </a>
            <a href="#contacto" className="Hero-link">
              Resolver dudas legales →
            </a>
          </div>
        </div>

        {/* Columna visual */}
        <div className="Hero-visual">
          <div className="Hero-card">
            <img
              src={facturaImg}
              alt="Factura con código QR y verificación antifraude"
              className="Hero-img"
            />

            <div className="Hero-card-footer">
              <span className="Hero-chip">Hash antifraude</span>
              <span className="Hero-chip Hero-chip--verde">
                Lista para VERI*FACTU
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
