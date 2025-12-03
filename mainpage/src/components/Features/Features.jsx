// src/components/Features/Features.jsx
import React from "react";
import useRevealOnScroll from "../../Hooks/useRevealOnScroll";
import "./Features.css";

const ventajas = [
  {
    icono: "🎨",
    titulo: "Personalización total",
    descripcion:
      "Colores, logo, nombre del restaurante y módulos activados a tu medida. Alef se adapta a tu forma de trabajar, no al revés.",
  },
  {
    icono: "🗣️",
    titulo: "Voz en sala, cocina y barra",
    descripcion:
      "Toma comandas por voz, marca platos listos o solicita bebidas sin tocar la pantalla. Más rapidez y menos errores en momentos de estrés.",
  },
  {
    icono: "📲",
    titulo: "Carta digital y pedidos en mesa",
    descripcion:
      "Los clientes pueden ver la carta, hacer pedidos desde el móvil y solicitar la cuenta. Todo entra en tu TPV central y pasa por camarero.",
  },
  {
    icono: "📅",
    titulo: "Reservas conectadas con el TPV",
    descripcion:
      "Agenda de reservas integrada: control de turnos, número de comensales, estado de cada reserva y sincronización con las mesas del local.",
  },
  {
    icono: "📦",
    titulo: "Control de stock en tiempo real",
    descripcion:
      "Controla existencias, alertas de mínimos y consumo por producto. Reduce mermas y ten siempre claro qué se vende y qué no.",
  },
  {
    icono: "📈",
    titulo: "Estadísticas y datos de negocio",
    descripcion:
      "Ventas por día, franja horaria, camarero, zona, producto y mucho más. Toma decisiones con datos, no con intuiciones.",
  },
  {
    icono: "🧾",
    titulo: "Facturación encadenada y Ley Antifraude",
    descripcion:
      "Facturas inalterables con hash encadenado, registros de rectificación y sistema preparado para integrarse con VERI*FACTU.",
  },
  {
    icono: "💻",
    titulo: "Funciona en cualquier dispositivo",
    descripcion:
      "Alef es 100 % web: solo necesitas un navegador. Ordenadores, tablets o móviles conectados al mismo sistema en tiempo real.",
  },
  {
    icono: "🤝",
    titulo: "Instalación guiada y soporte cercano",
    descripcion:
      "Te enviamos el equipo preconfigurado y te acompañamos en la puesta en marcha. Soporte humano que entiende la hostelería.",
  },
];

const Features = () => {
  useRevealOnScroll();

  return (
    <section className="Features bg-fondo-claro reveal" id="ventajas">
      <div className="Features-inner section--wide">
        <div className="Features-header">
          <span className="Features-kicker">Ventajas clave</span>
          <h2>Todo lo que tu restaurante necesita en un solo sistema</h2>
          <p>
            Alef unifica TPV, carta digital, reservas, stock, voz y
            facturación antifraude en una plataforma web pensada para
            restaurantes que quieren trabajar mejor y crecer.
          </p>
        </div>

        <div className="Features-grid">
          {ventajas.map((v, i) => (
            <article key={i} className="Features-card">
              <div className="Features-icono">{v.icono}</div>
              <h3 className="Features-titulo">{v.titulo}</h3>
              <p className="Features-descripcion">{v.descripcion}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
