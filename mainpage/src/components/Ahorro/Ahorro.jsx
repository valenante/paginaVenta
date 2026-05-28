import React from "react";
import "./Ahorro.css";

const costes = [
  { servicio: "Community manager / Instagram", rango: "150–350€/mes", nota: "freelance, 3 posts por semana" },
  { servicio: "Software de inventario", rango: "50–150€/mes", nota: "MarketMan, Tiller, etc." },
  { servicio: "Carta digital QR", rango: "30–80€/mes", nota: "Qamarero, OrderEat, etc." },
  { servicio: "Sistema de reservas", rango: "30–90€/mes", nota: "TheFork, CoverManager" },
  { servicio: "Gestión de reseñas", rango: "0–50€/mes", nota: "la mayoría no responde o lo hace manual" },
  { servicio: "TPV con soporte", rango: "50–100€/mes", nota: "solo comandas y cobros" },
  { servicio: "Facturación certificada", rango: "20–50€/mes", nota: "para cumplir VeriFactu" },
];

const incluido = [
  "Copiloto IA con 50 herramientas",
  "Instagram automático",
  "Reseñas Google con IA",
  "Stock predictivo + pedidos a proveedor",
  "P&L automático + informe al contable",
  "Carta digital QR en 3 idiomas",
  "Facturación VeriFactu",
  "25 automatizaciones en background",
  "Soporte incluido",
];

export default function Ahorro() {
  return (
    <section className="Ahorro" id="ahorro">
      <div className="Ahorro-inner">
        <span className="Ahorro-kicker">El coste real de NO tener Alef</span>
        <h2 className="Ahorro-titulo">Estás pagando 330–870€/mes sin saberlo</h2>
        <p className="Ahorro-sub">Cada herramienta por separado tiene un coste. Alef las reemplaza todas.</p>

        <div className="Ahorro-grid">
          {/* Columna izquierda — costes actuales */}
          <div className="Ahorro-costes">
            <h3 className="Ahorro-costes-title">Lo que pagas ahora</h3>
            {costes.map((c, i) => (
              <div key={i} className="Ahorro-coste-row">
                <div className="Ahorro-coste-info">
                  <span className="Ahorro-coste-servicio">{c.servicio}</span>
                  <span className="Ahorro-coste-nota">{c.nota}</span>
                </div>
                <span className="Ahorro-coste-precio">{c.rango}</span>
              </div>
            ))}
            <div className="Ahorro-total-row">
              <span>TOTAL</span>
              <span className="Ahorro-total-precio">330 – 870€/mes</span>
            </div>
          </div>

          {/* Columna derecha — Alef */}
          <div className="Ahorro-alef">
            <div className="Ahorro-alef-card">
              <span className="Ahorro-alef-desde"></span>
              <span className="Ahorro-alef-precio">129€<span className="Ahorro-alef-mes">/mes</span></span>
              <span className="Ahorro-alef-sub">Todo incluido. Sin permanencia.</span>

              <ul className="Ahorro-alef-lista">
                {incluido.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <a href="#contacto" className="btn btn-primario Ahorro-cta">
                Quiero ahorrar desde el primer mes
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
