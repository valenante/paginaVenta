import React, { useState } from "react";
import "./FAQ.css";

const preguntas = [
  {
    q: "¿Qué hace ALEF diferente de un TPV normal?",
    a: "Un TPV toma comandas y cobra. ALEF conecta todo tu restaurante: calcula márgenes reales por plato, procesa facturas de proveedores automáticamente, predice tu stock, protege tu rentabilidad y genera pedidos a proveedor cuando algo va a faltar. El TPV está incluido, pero es solo una parte del sistema.",
  },
  {
    q: "¿Funciona con mi tablet u ordenador actual?",
    a: "Sí. ALEF funciona en cualquier dispositivo con navegador (Chrome, Safari, Edge). No necesitas hardware especial — tu tablet, portátil o móvil actual sirve. Tu equipo aprende la operativa en 10 minutos.",
  },
  {
    q: "¿Qué pasa si se cae internet?",
    a: "Los pedidos que ya están en cocina siguen funcionando. Cuando vuelve la conexión todo se sincroniza automáticamente.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. Sin permanencia, sin penalización, sin letra pequeña. Cancelas cuando quieras.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Tus datos están en servidores europeos. Cada restaurante tiene su propia base de datos aislada. Backups automáticos diarios. Nadie más accede a tus datos.",
  },
  {
    q: "¿Qué es VeriFactu y me afecta?",
    a: "Es el nuevo sistema de facturación electrónica de Hacienda. A partir de julio 2027, todos los negocios de hostelería deben usar software certificado. ALEF ya cumple — no tienes que contratar nada extra.",
  },
  {
    q: "¿Cómo funciona lo de las facturas automáticas?",
    a: "Cuando un proveedor te envía una factura por email, el sistema la lee, extrae productos y precios, y actualiza stock y costes automáticamente. Si llega en papel, la escaneas con el móvil. La documentación se envía sola a tu gestoría.",
  },
  {
    q: "¿Puedo probarlo antes de pagar?",
    a: "Sí. Te hacemos una demo en directo de 10 minutos con datos de un restaurante real que ya usa ALEF. Sin compromiso. Por WhatsApp, email o videollamada.",
  },
];

export default function FAQ() {
  const [abierta, setAbierta] = useState(null);

  return (
    <section className="FAQ" id="faq">
      <div className="FAQ-inner">
        <div className="FAQ-header">
          <h2>Preguntas frecuentes</h2>
        </div>

        <div className="FAQ-list">
          {preguntas.map((p, i) => (
            <div
              key={i}
              className={`FAQ-item ${abierta === i ? "FAQ-item--open" : ""}`}
            >
              <button className="FAQ-question" onClick={() => setAbierta(abierta === i ? null : i)}>
                <span>{p.q}</span>
                <span className="FAQ-arrow">{abierta === i ? "−" : "+"}</span>
              </button>
              {abierta === i && (
                <div className="FAQ-answer">
                  <p>{p.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
