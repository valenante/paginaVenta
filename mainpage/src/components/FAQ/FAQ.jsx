import React, { useState } from "react";
import "./FAQ.css";

const preguntas = [
  {
    q: "¿Qué hace ALEF diferente de un TPV normal?",
    a: "Un TPV toma comandas y cobra. ALEF conecta todo tu restaurante: controla stock, calcula márgenes reales, procesa facturas de proveedores automáticamente, protege tu rentabilidad y genera pedidos a proveedor cuando algo va a faltar. El TPV está incluido, pero es solo una parte del sistema.",
  },
  {
    q: "¿Necesito saber de tecnología?",
    a: "No. La operativa diaria (comandas, cocina, cobros) la aprende tu equipo en 10 minutos. El sistema funciona en cualquier tablet o portátil con navegador — sin instalar nada.",
  },
  {
    q: "¿Funciona con mi tablet u ordenador actual?",
    a: "Sí. ALEF funciona en cualquier dispositivo con navegador (Chrome, Safari, Edge). No necesitas hardware especial — tu tablet, portátil o móvil actual sirve.",
  },
  {
    q: "¿Qué pasa si se cae internet?",
    a: "Los pedidos que ya están en cocina siguen funcionando. Cuando vuelve la conexión todo se sincroniza automáticamente.",
  },
  {
    q: "¿Puedo cambiar de plan o cancelar?",
    a: "Sí, en cualquier momento. Sin permanencia, sin penalización.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Tus datos están en servidores europeos. Cada restaurante tiene su propia base de datos aislada. Backups automáticos diarios. Nadie más accede a tus datos.",
  },
  {
    q: "¿Qué es VERI*FACTU y me afecta?",
    a: "Es el nuevo sistema de facturación electrónica de la Agencia Tributaria. A partir de julio 2027, todos los negocios de hostelería deben emitir facturas con software certificado. ALEF ya está preparado — no tienes que contratar nada extra.",
  },
  {
    q: "¿Cómo funciona lo de las facturas automáticas?",
    a: "Cuando un proveedor te envía una factura por email, el sistema la lee automáticamente, extrae los productos y precios, y actualiza tu stock y tus costes. Si la factura llega en papel, la escaneas con la cámara del móvil. Además, toda la documentación se envía automáticamente a tu gestoría.",
  },
  {
    q: "¿Realmente publica en Instagram solo?",
    a: "Sí. ALEF genera posts con las fotos de tu carta, escribe textos adaptados a tu marca, y publica según el calendario que configures. Solo necesitas subir buenas fotos de vez en cuando.",
  },
  {
    q: "¿Responde reseñas de Google automáticamente?",
    a: "Sí. Cuando recibes una reseña, el sistema genera una respuesta personalizada con el tono adecuado. Las reseñas negativas generan alerta inmediata para que actúes.",
  },
  {
    q: "¿Puedo probarlo antes de pagar?",
    a: "Contáctanos por WhatsApp o email y te hacemos una demo en directo de 10 minutos con datos de un restaurante real. Sin compromiso.",
  },
  {
    q: "¿Cuánto tarda en verse el resultado?",
    a: "Desde la primera semana. Las facturas se procesan solas, el stock se controla automáticamente, y tienes visibilidad real de tus márgenes desde el primer día de uso.",
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
