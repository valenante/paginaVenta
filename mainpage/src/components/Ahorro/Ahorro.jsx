import React from "react";
import "./Ahorro.css";

const dolores = [
  {
    titulo: "Cargar facturas a mano",
    antes: "Cada factura de proveedor llega por email. La abres, la lees, la cargas en el sistema, actualizas precios.",
    conAlef: "ALEF lee tus emails, extrae los datos de cada factura y actualiza tu stock automáticamente.",
  },
  {
    titulo: "Descubrir tarde que te subieron precios",
    antes: "Un proveedor sube un 15% y no te enteras hasta final de mes. Tus márgenes se erosionan sin que lo sepas.",
    conAlef: "ALEF detecta cambios de precio en 48 horas y te dice exactamente qué platos pierden margen y a cuánto subirlos.",
  },
  {
    titulo: "Quedarte sin producto un viernes",
    antes: "El stock se controla de memoria o con una hoja de Excel. Cuando falta algo, ya es demasiado tarde.",
    conAlef: "ALEF predice tu consumo de los próximos 7 días y genera pedidos a proveedor antes de que te falte nada.",
  },
  {
    titulo: "No saber qué platos te dan dinero",
    antes: "Facturas mucho, pero no sabes cuánto ganas realmente con cada plato. Los costes cambian y los márgenes también.",
    conAlef: "ALEF calcula el margen real de cada producto en tiempo real. Sabes qué vender más y qué replantear.",
  },
];

export default function Ahorro() {
  return (
    <section className="Ahorro" id="ahorro">
      <div className="Ahorro-inner">
        <h2 className="Ahorro-titulo">¿Cuántas horas pierdes cada semana en tareas que no deberían ser tuyas?</h2>
        <p className="Ahorro-sub">Estos son los problemas reales que ALEF resuelve. No con más herramientas — con un sistema que lo conecta todo.</p>

        <div className="Ahorro-dolores">
          {dolores.map((d, i) => (
            <div key={i} className="Ahorro-dolor">
              <h3 className="Ahorro-dolor-titulo">{d.titulo}</h3>
              <div className="Ahorro-dolor-grid">
                <div className="Ahorro-dolor-antes">
                  <span className="Ahorro-dolor-tag">Hoy</span>
                  <p>{d.antes}</p>
                </div>
                <div className="Ahorro-dolor-despues">
                  <span className="Ahorro-dolor-tag Ahorro-dolor-tag--alef">Con ALEF</span>
                  <p>{d.conAlef}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="Ahorro-cta-wrap">
          <a href="#contacto" className="btn btn-primario Ahorro-cta">
            Solicitar demo
          </a>
        </div>
      </div>
    </section>
  );
}
