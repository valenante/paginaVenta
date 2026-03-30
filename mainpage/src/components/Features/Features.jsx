// src/components/Features/Features.jsx
import React from "react";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import "./Features.css";

const ventajas = [
  {
    icono: "🧾",
    titulo: "Tickets claros y comandas sin errores",
    descripcion:
      "Notas por plato y por sección, orden de salida y tickets entendibles para cocina y barra. Menos confusiones, más ritmo de servicio.",
  },
  {
    icono: "👨‍🍳",
    titulo: "Cocina y barra en tiempo real por secciones",
    descripcion:
      "Organiza la producción por estaciones (cocina/bar/mostrador), marca estados y coordina el flujo sin perder el control del servicio.",
  },
  {
    icono: "📲",
    titulo: "Carta digital (3 idiomas) y pedidos ON/OFF",
    descripcion:
      "Tu carta por QR, lista para turistas. Puedes activar o bloquear pedidos desde mesa cuando quieras (según volumen y operativa).",
  },
  {
    icono: "💳",
    titulo: "Caja diaria y control de cierres",
    descripcion:
      "Aperturas/cierres, totales, registros y control diario para tener la caja ordenada y evitar descuadres.",
  },
  {
    icono: "📦",
    titulo: "Stock y proveedores integrados",
    descripcion:
      "Alertas de mínimos, consumo y control de inventario. Proveedores, pedidos y facturas organizados desde el panel.",
  },
  {
    icono: "📈",
    titulo: "Estadísticas que sirven para decidir",
    descripcion:
      "Ventas, márgenes, productos top, horas fuertes y rendimiento. Datos claros para mejorar el negocio sin adivinar.",
  },
  {
    icono: "🗣️",
    titulo: "Voz inteligente para acciones rápidas",
    descripcion:
      "Comandas y acciones por voz para sala, cocina o barra (ideal en horas pico). Más velocidad sin tocar pantallas.",
  },
  {
    icono: "🧾",
    titulo: "Facturación encadenada y antifraude",
    descripcion:
      "Registro encadenado, trazabilidad y base preparada para integraciones de cumplimiento cuando aplique (VERI*FACTU).",
  },
  {
    icono: "💻",
    titulo: "Web multi-dispositivo y sin instalaciones",
    descripcion:
      "PC, tablet o móvil desde el navegador. Todo sincronizado en tiempo real, sin límites de dispositivos.",
  },
];

const Features = () => {
  useRevealOnScroll();

  return (
    <section className="Features bg-fondo-claro reveal" id="ventajas">
      <div className="Features-inner section--wide">
        <div className="Features-header">
          <span className="Features-kicker">Ventajas clave</span>
          <h2>Trabaja más rápido y con menos errores</h2>
          <p>
            Alef está diseñado para el servicio real: comandas claras, cocina/bar
            coordinadas, carta QR y gestión completa del negocio desde un solo panel.
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