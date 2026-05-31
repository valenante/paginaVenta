import React from "react";
import "./Ahorro.css";

const dolores = [
  {
    titulo: "Facturas, stock y costes a mano",
    antes: "Cada factura hay que cargarla, cada precio hay que actualizarlo, cada pedido a proveedor hay que hacerlo a mano. Horas perdidas cada semana.",
    conAlef: "Las facturas se procesan solas (email o cámara), el stock se actualiza con cada venta, los pedidos a proveedor se generan automáticamente. La documentación se envía a tu gestoría sin que hagas nada.",
  },
  {
    titulo: "No saber realmente cuánto ganas",
    antes: "Facturas mucho pero no sabes qué platos te dan dinero. Un proveedor sube precios y no te enteras hasta final de mes.",
    conAlef: "ALEF calcula el margen real de cada producto, detecta cambios de precio y te dice exactamente qué ajustar. Sabes qué vender más y qué quitar de la carta.",
  },
  {
    titulo: "Cocina y sala desconectadas",
    antes: "Las comandas se pierden, cocina no sabe qué viene, los tiempos se alargan. Errores de coordinación que afectan al servicio.",
    conAlef: "Comandas en tiempo real por estación, tiempos controlados, y cocina que sabe qué pedidos vienen antes de que lleguen. Menos errores, mejor servicio.",
  },
  {
    titulo: "Instagram, reservas, turnos — todo por separado",
    antes: "Una app para reservas, otra para Instagram, otra para turnos, otra para estadísticas. Cada una con su coste y su gestión.",
    conAlef: "Instagram se publica solo, las reservas se confirman automáticamente, los turnos se planifican según demanda y las reseñas de Google se responden solas. Todo desde un mismo sitio.",
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
