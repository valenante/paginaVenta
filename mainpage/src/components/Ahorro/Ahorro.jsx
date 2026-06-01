import React from "react";
import "./Ahorro.css";

const dolores = [
  {
    titulo: "Compras y facturas a ciegas",
    antes: "Cada factura hay que cargarla a mano. Cada pedido a proveedor requiere llamar, revisar y anotar. 5-8 horas/semana perdidas en tareas administrativas.",
    conAlef: "Las facturas se procesan solas desde email o cámara. Los pedidos a proveedor se generan automáticamente cuando algo va a faltar. La documentación se envía sola a tu gestoría.",
  },
  {
    titulo: "No saber cuánto ganas realmente",
    antes: "Facturas 15.000€/mes pero no sabes qué platos te dan dinero. Un proveedor sube un 12% y no te enteras hasta que cierras caja.",
    conAlef: "Margen real de cada plato en tiempo real. Si un proveedor sube precio, el sistema te avisa y te dice qué platos se ven afectados. Sabes qué vender más y qué sacar.",
  },
  {
    titulo: "Cocina y sala desconectadas",
    antes: "Comandas que se pierden, cocina que no sabe qué viene, tiempos que se alargan. Cada error de coordinación le cuesta entre 5 y 15€ al restaurante.",
    conAlef: "Comandas en tiempo real por estación. Cocina predice qué pedidos vienen antes de que lleguen. Tiempos controlados. Menos errores, mejor servicio.",
  },
  {
    titulo: "Horas en tareas que se hacen solas",
    antes: "Cerrar caja, cuadrar turnos, revisar stock, publicar en redes, responder reseñas. Todo manual, todo disperso. 2-3 horas diarias que no dedicas a tu negocio.",
    conAlef: "Cierre de caja automático. Stock que se controla solo. Instagram que se publica solo. Reseñas respondidas automáticamente. Tu tiempo vuelve a ser tuyo.",
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
                <h3 className="Ahorro-dolor-titulo">
                  <span className="Ahorro-dolor-icon">✗</span>
                  {d.titulo}
                </h3>
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
