import React from "react";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import cartaDemo from "../../assets/videos/carta-demo.mp4";
import "./CartaShowcase.css";

const puntos = [
  {
    icono: "🧠",
    titulo: "Sugerencias inteligentes",
    desc: "La carta aprende qué piden tus clientes y sugiere platos por contexto: hora, clima, mesa, historial. Cada restaurante tiene su propia IA.",
  },
  {
    icono: "📊",
    titulo: "Analytics en tiempo real",
    desc: "Qué platos se miran y no se piden. Qué categorías convierten más. Tiempo medio de decisión. Datos que antes no existían.",
  },
  {
    icono: "🌍",
    titulo: "Multiidioma automático",
    desc: "Español, inglés, francés — traducido profesionalmente. El turista lee la carta en su idioma sin que tú hagas nada.",
  },
  {
    icono: "⚡",
    titulo: "Pedido directo a cocina",
    desc: "El cliente escanea, elige, y el pedido llega a cocina. Sin camarero intermediario. Sin errores de transcripción. Sin esperas.",
  },
];

const CartaShowcase = () => {
  useRevealOnScroll();

  return (
    <section className="CartaShow reveal" id="carta-qr">
      <div className="CartaShow-inner">
        <div className="CartaShow-visual">
          <div className="tablet-mockup">
            <div className="tablet-screen">
              <video
                src={cartaDemo}
                autoPlay
                loop
                muted
                playsInline
                className="tablet-video"
              />
            </div>
          </div>
        </div>

        <div className="CartaShow-content">
          <span className="CartaShow-kicker">Carta QR inteligente</span>
          <h2 className="CartaShow-titulo">
            Tu carta no solo muestra platos.
            <br />
            Aprende cómo piden tus clientes.
          </h2>
          <p className="CartaShow-desc">
            Cada restaurante tiene su propia carta digital con IA integrada.
            Sugiere platos según el contexto, se traduce sola, recoge datos
            que nunca has tenido, y envía pedidos directo a cocina desde el
            móvil del cliente.
          </p>

          <div className="CartaShow-puntos">
            {puntos.map((p, i) => (
              <div key={i} className="CartaShow-punto">
                <span className="CartaShow-punto-icono">{p.icono}</span>
                <div>
                  <h4 className="CartaShow-punto-titulo">{p.titulo}</h4>
                  <p className="CartaShow-punto-desc">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartaShowcase;
