import "./Packs.css";

const Packs = () => {
  return (
    <section className="Packs" id="packs">
      {/* === Cabecera === */}
      <div className="fila-superior">
        <div className="packs-header">
          <h2>Planes disponibles</h2>
          <p>
            Elige el plan que mejor se adapte a tu restaurante. Todos incluyen instalación, soporte y formación.
          </p>
        </div>
      </div>

      {/* === Contenedor de los planes === */}
      <div className="Packs-cards">
        <div className="Packs1">
          <h3>Básico</h3>
          <ul>
            <li>TPV completo</li>
            <li>Carta digital</li>
            <li>Impresión en cocina</li>
          </ul>
        </div>

        <div className="Packs2">
          <h3>Pro</h3>
          <ul>
            <li>Todo lo del Básico</li>
            <li>Facturación con QR y hash</li>
            <li>Gestión de stock</li>
          </ul>
        </div>

        <div className="Packs3">
          <h3>Full</h3>
          <ul>
            <li>Todo lo del Pro</li>
            <li>Reservas avanzadas</li>
            <li>Soporte prioritario</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Packs;
