import React, { useState } from "react";
import "./FAQ.css";

const preguntas = [
  {
    q: "¿Funciona con mi tablet u ordenador actual?",
    a: "Si. Alef funciona en cualquier dispositivo con navegador (Chrome, Safari, Edge). No necesitas hardware especial — tu tablet, portatil o movil actual sirve. Sin instalar nada.",
  },
  {
    q: "¿Necesito impresora especial?",
    a: "Alef funciona con impresoras termicas estandar (ESC/POS) conectadas por USB o red. Si ya tienes una, seguramente es compatible. Si no, te ayudamos a elegir la mas adecuada desde 150€.",
  },
  {
    q: "¿Que pasa si se cae internet?",
    a: "Los pedidos que ya estan en cocina siguen funcionando. Cuando vuelve la conexion todo se sincroniza automaticamente. Ademas, si trabajas en red local, la impresion sigue funcionando sin internet.",
  },
  {
    q: "¿Puedo cambiar de plan o cancelar?",
    a: "Si, en cualquier momento. Sin permanencia, sin penalizacion. Subes o bajas de plan desde tu panel y el cambio se aplica en el siguiente ciclo de facturacion.",
  },
  {
    q: "¿Mis datos estan seguros?",
    a: "Tus datos estan en servidores europeos (MongoDB Atlas + DigitalOcean EU). Cada restaurante tiene su propia base de datos aislada. Backups automaticos diarios con cifrado.",
  },
  {
    q: "¿Cuanto tarda la puesta en marcha?",
    a: "Minutos. Eliges plan, pagas, y tu entorno se crea automaticamente con mesas, categorias y accesos. Puedes empezar a tomar comandas el mismo dia.",
  },
  {
    q: "¿Que es VERI*FACTU y me afecta?",
    a: "Es el nuevo sistema de facturacion electronica de la Agencia Tributaria (Ley 11/2021). A partir de julio 2027, todos los negocios de hosteleria deben emitir facturas con software certificado. El plazo se aplazó un año (Real Decreto-Ley 15/2025). Alef ya esta preparado — no tienes que hacer nada extra.",
  },
  {
    q: "¿Necesito pantallas en cocina?",
    a: "No. Alef funciona con pantallas de cocina y barra, pero tambien funciona solo con impresora. Tu decides el flujo: pantalla, tickets impresos o ambos. Se adapta a como trabajes.",
  },
  {
    q: "¿Puedo pedir funciones a medida para mi negocio?",
    a: "Si. Si tu restaurante necesita algo especifico — un flujo diferente, integracion con otro sistema, un modulo nuevo — lo desarrollamos a medida. Habla con nosotros y te decimos plazo y coste. Al ser un equipo cercano, respondemos rapido y sin burocracia — no vas a esperar meses en un ticket de soporte.",
  },
  {
    q: "¿Puedo probarlo antes de pagar?",
    a: "Contactanos por WhatsApp o email y te hacemos una demo en directo de 10 minutos con datos reales. Ves exactamente como funciona antes de decidir.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="FAQ bg-fondo-claro" id="faq">
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
