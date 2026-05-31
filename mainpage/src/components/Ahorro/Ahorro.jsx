import React from "react";
import "./Ahorro.css";

const dolores = [
  {
    titulo: "Facturas, stock y costes a mano",
    antes: "Cada factura hay que cargarla, cada precio hay que actualizarlo, cada pedido a proveedor hay que hacerlo a mano. Horas perdidas cada semana.",
    conAlef: "Las facturas se procesan solas (email o cámara), el stock se actualiza con cada venta y los pedidos a proveedor se generan automáticamente. La documentación se envía a tu gestoría sin que hagas nada.",
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
    titulo: "Tiempo perdido en tareas que podrían hacerse solas",
    antes: "Publicar en redes, responder reseñas, gestionar reservas, planificar turnos, revisar estadísticas. Todo manual, todo disperso, todo resta tiempo al negocio.",
    conAlef: "Instagram se publica solo, las reseñas se responden automáticamente, las reservas se confirman sin intervención y los turnos se planifican según la demanda prevista.",
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
              <div className="Ahorro-dolor-antes">
                <h3 className="Ahorro-dolor-titulo">{d.titulo}</h3>
                <p>{d.antes}</p>
              </div>
              <div className="Ahorro-dolor-despues">
                <div className="Ahorro-dolor-despues-label">Con ALEF</div>
                <p>{d.conAlef}</p>
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
