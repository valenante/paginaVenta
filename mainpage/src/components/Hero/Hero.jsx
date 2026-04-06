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
            Obligatorio desde julio 2026
          </div>

          <h2 className="Hero-titulo">
            ¿Tu TPV actual cumple <br />
            con la Ley Antifraude?
          </h2>

          <p className="Hero-parrafo">
            A partir de julio 2026 todos los negocios de hosteleria deben
            emitir facturas con software certificado. Alef ya genera facturas
            encadenadas con hash inalterable y esta preparado para VERI*FACTU.
            No esperes a que te pillen — adelantate.
          </p>

          <ul className="Hero-lista">
            <li>📌 Cada factura y ticket queda registrado con numeracion encadenada.</li>
            <li>📌 Hash antifraude que garantiza que nadie modifica los datos.</li>
            <li>📌 Listo para enviar a la AEAT cuando se active VERI*FACTU.</li>
          </ul>

          <p className="Hero-aviso">
            <strong>Sin letra pequeña:</strong> te acompañamos en la adaptacion,
            te explicamos que implica para tu restaurante y lo dejamos funcionando.
          </p>

          <div className="Hero-acciones">
            <a href="#packs" className="Hero-boton btn btn-primario ">
              Cumple desde hoy
            </a>
            <a href="/verifactu" className="Hero-link">
              Leer guia completa VERI*FACTU →
            </a>
            <a href="#contacto" className="Hero-link">
              Tengo dudas, quiero hablar →
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
