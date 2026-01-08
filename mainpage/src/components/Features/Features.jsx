// src/components/Features/Features.jsx
import React from "react";
import useRevealOnScroll from "../../Hooks/useRevealOnScroll";
import "./Features.css";

const ventajas = [
  {
    icono: "🎨",
    titulo: "Personalización total del sistema",
    descripcion:
      "Colores, logo, nombre del negocio y módulos activables según tus necesidades. Alef se adapta tanto a restaurantes como a tiendas.",
  },
  {
    icono: "🗣️",
    titulo: "Control por voz inteligente",
    descripcion:
      "Comandas, estados de platos, acciones rápidas y flujos internos mediante voz. Ideal para sala, cocina, barra o mostrador.",
  },
  {
    icono: "📲",
    titulo: "Pedidos digitales y autoservicio",
    descripcion:
      "Carta digital para restaurantes y flujos de autoservicio para tiendas. Pedidos desde el móvil del cliente conectados al sistema central.",
  },
  {
    icono: "📅",
    titulo: "Reservas y gestión de turnos",
    descripcion:
      "Reservas integradas con mesas y capacidad en restaurantes, o planificación de horarios y picos de venta en tiendas.",
  },
  {
    icono: "📦",
    titulo: "Stock y proveedores profesionales",
    descripcion:
      "Control de stock en tiempo real, alertas de mínimos, consumo automático y gestión de proveedores unificada para todo el negocio.",
  },
  {
    icono: "📈",
    titulo: "Estadísticas avanzadas de negocio",
    descripcion:
      "Ventas, márgenes, productos, horarios, empleados y rendimiento. Datos claros para tomar decisiones reales.",
  },
  {
    icono: "🧾",
    titulo: "Facturación legal y antifraude",
    descripcion:
      "Facturación encadenada, rectificaciones, registros inalterables y sistema preparado para VERI*FACTU y normativa vigente.",
  },
  {
    icono: "🔎",
    titulo: "Escáner y ventas rápidas (Shop)",
    descripcion:
      "Compatible con escáneres de código de barras para tiendas. Venta inmediata, control de inventario y trazabilidad completa.",
  },
  {
    icono: "💻",
    titulo: "Web, multi-dispositivo y en tiempo real",
    descripcion:
      "Funciona desde cualquier navegador. TPV, cocina, barra, móvil o tablet sincronizados sin límites de dispositivos.",
  },
  {
    icono: "🤝",
    titulo: "Instalación guiada y soporte humano",
    descripcion:
      "Puesta en marcha asistida, hardware preconfigurado y soporte real de personas que entienden cómo funciona un negocio físico.",
  },
];

const Features = () => {
  useRevealOnScroll();

  return (
    <section className="Features bg-fondo-claro reveal" id="ventajas">
      <div className="Features-inner section--wide">
        <div className="Features-header">
          <span className="Features-kicker">Ventajas clave</span>
          <h2>Una sola plataforma para gestionar todo tu negocio</h2>
          <p>
            Alef unifica TPV, ventas, stock, proveedores, facturación legal,
            voz y estadísticas en un sistema web diseñado para restaurantes
            y tiendas que quieren trabajar mejor y escalar sin límites.
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
