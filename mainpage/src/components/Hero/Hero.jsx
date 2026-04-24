// src/components/Hero/Hero.jsx
// VeriFactu — ahora sección secundaria de confianza, no hero principal
import React from "react";
import "./Hero.css";
import facturaImg from "../../assets/imagenes/facturacion.png";

const Hero = () => {
  return (
    <section className="Hero section bg-fondo-claro reveal" id="verifactu">
      <div className="Hero-inner section--wide">
        <div className="Hero-texto">
          <div className="Hero-badge">
            Obligatorio desde julio 2027
          </div>

          <h2 className="Hero-titulo">
            Cumple con Hacienda sin pensar
          </h2>

          <p className="Hero-parrafo">
            A partir de julio 2027 todos los negocios de hosteleria deben
            emitir facturas con software certificado (Ley 11/2021).
            Alef ya genera facturas encadenadas con hash inalterable
            y esta preparado para VERI*FACTU. Tu trabajas, Alef se encarga de la ley.
          </p>

          <ul className="Hero-lista">
            <li>📌 Numeracion encadenada e inalterable en cada ticket y factura.</li>
            <li>📌 Hash antifraude que garantiza que nadie modifica los datos.</li>
            <li>📌 Preparado para envio automatico a la AEAT.</li>
          </ul>

          <p className="Hero-aviso">
            <strong>Los que se adaptan ahora lo hacen tranquilos.</strong> Te acompañamos
            en la adaptacion sin coste extra ni letra pequeña.
          </p>

          <div className="Hero-acciones">
            <a href="/verifactu" className="Hero-link">
              Leer guia completa VERI*FACTU →
            </a>
            <a href="#contacto" className="Hero-link">
              Tengo dudas, quiero hablar →
            </a>
          </div>
        </div>

        <div className="Hero-visual">
          <div className="Hero-card">
            <img
              src={facturaImg}
              alt="Factura con verificacion antifraude"
              className="Hero-img"
            />
            <div className="Hero-card-footer">
              <span className="Hero-chip">Hash antifraude</span>
              <span className="Hero-chip Hero-chip--verde">VERI*FACTU ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
