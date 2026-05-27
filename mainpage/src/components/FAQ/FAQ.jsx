import React, { useState } from "react";
import "./FAQ.css";

const preguntas = [
  {
    q: "¿Que hace Alef diferente de un TPV normal?",
    a: "Un TPV toma comandas y cobra. Alef automatiza tu restaurante entero: controla stock, analiza finanzas, predice consumo, genera pedidos a proveedores, y tiene un copiloto IA que responde cualquier pregunta sobre tu negocio con datos reales. El TPV esta incluido — pero es solo el principio.",
  },
  {
    q: "¿Que es el Copiloto IA?",
    a: "Es un asistente inteligente dentro de Alef al que puedes preguntar cualquier cosa: cual es tu plato mas rentable, que productos quitar de la carta, cuantos camareros necesitas el sabado, que proveedor te esta subiendo precios. Responde con datos reales de tu restaurante, no con respuestas genericas.",
  },
  {
    q: "¿La IA puede equivocarse?",
    a: "El copiloto usa exclusivamente datos reales de tu restaurante — no inventa cifras. Si no tiene datos suficientes, te lo dice. Y para cualquier accion que modifique algo (subir un precio, crear un producto), siempre te pide confirmacion antes de hacerlo.",
  },
  {
    q: "¿Necesito saber de tecnologia?",
    a: "No. Hablas con el copiloto como hablas con un consultor: en lenguaje normal. Le dices 'como van las ventas' o 'que deberia comprar esta semana' y te responde claro. La operativa diaria (comandas, cocina) la aprende tu equipo en 10 minutos.",
  },
  {
    q: "¿Funciona con mi tablet u ordenador actual?",
    a: "Si. Alef funciona en cualquier dispositivo con navegador (Chrome, Safari, Edge). No necesitas hardware especial — tu tablet, portatil o movil actual sirve. Sin instalar nada.",
  },
  {
    q: "¿Que pasa si se cae internet?",
    a: "Los pedidos que ya estan en cocina siguen funcionando. Cuando vuelve la conexion todo se sincroniza automaticamente. La impresion en red local sigue funcionando sin internet.",
  },
  {
    q: "¿Puedo cambiar de plan o cancelar?",
    a: "Si, en cualquier momento. Sin permanencia, sin penalizacion. Subes o bajas de plan desde tu panel.",
  },
  {
    q: "¿Mis datos estan seguros?",
    a: "Tus datos estan en servidores europeos. Cada restaurante tiene su propia base de datos aislada. Backups automaticos diarios con cifrado. Nadie mas accede a tus datos.",
  },
  {
    q: "¿Que es VERI*FACTU y me afecta?",
    a: "Es el nuevo sistema de facturacion electronica de la Agencia Tributaria (Ley 11/2021). A partir de julio 2027, todos los negocios de hosteleria deben emitir facturas con software certificado. Alef ya esta preparado — no tienes que hacer nada extra.",
  },
  {
    q: "¿Que automatiza Alef exactamente?",
    a: "Stock (alertas + pedidos a proveedor), finanzas (P&L + informe mensual), pricing (sugiere precios optimos), personal (cuantos camareros por dia), cocina (coordinacion tiempo real), carta (analisis de productos muertos/estrella), y alertas proactivas de problemas antes de que los notes.",
  },
  {
    q: "¿Puedo probarlo antes de pagar?",
    a: "Contactanos por WhatsApp o email y te hacemos una demo en directo de 10 minutos con datos reales. Veras la IA respondiendo preguntas sobre un restaurante real.",
  },
  {
    q: "¿Alef realmente publica en Instagram automáticamente?",
    a: "Sí. Alef genera posts con las fotos de tus platos, escribe el copy adaptado a tu marca, y publica según el calendario que configures. Tú solo subes buenas fotos de vez en cuando — el resto es automático. Un community manager cobra 300-700€/mes por esto.",
  },
  {
    q: "¿Cómo funciona la respuesta automática a reseñas de Google?",
    a: "Cuando recibes una reseña en Google, la IA la lee, entiende el sentimiento, y genera una respuesta personalizada con el tono de tu restaurante. Las reseñas negativas generan una alerta inmediata para que actúes. Los restaurantes que responden reseñas suben hasta un 15% en visibilidad.",
  },
  {
    q: "¿Cuánto tarda en verse el ahorro?",
    a: "Desde el primer mes. Las facturas de proveedor se procesan solas (ahorro de 1-2h/día), los pedidos de stock se generan automáticamente, y las publicaciones de Instagram salen sin community manager. Solo en community manager ya te ahorras más de lo que cuesta Alef entero.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="FAQ" id="faq">
      <div className="FAQ-inner section--wide">
        <div className="FAQ-header">
          <span className="FAQ-kicker">Preguntas frecuentes</span>
          <h2>Lo que nos preguntan antes de empezar</h2>
        </div>

        <div className="FAQ-list">
          {preguntas.map((p, i) => (
            <div
              key={i}
              className={`FAQ-item ${open === i ? "FAQ-item--open" : ""}`}
            >
              <button
                className="FAQ-question"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span>{p.q}</span>
                <span className="FAQ-arrow">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
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
