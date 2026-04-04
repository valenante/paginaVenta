import { useResumenDia } from "../../hooks/useResumenDia";
import "./ResumenDia.css";

function Tarjeta({ titulo, valor, subtitulo, color, icono }) {
  if (valor == null) return null;
  return (
    <div className={`resumen-tarjeta resumen-tarjeta--${color}`}>
      <span className="resumen-tarjeta__icono">{icono}</span>
      <div className="resumen-tarjeta__contenido">
        <span className="resumen-tarjeta__valor">{valor}</span>
        <span className="resumen-tarjeta__titulo">{titulo}</span>
        {subtitulo && <span className="resumen-tarjeta__sub">{subtitulo}</span>}
      </div>
    </div>
  );
}

export default function ResumenDia() {
  const { data, loading, error, refetch } = useResumenDia();

  if (loading) return null;

  if (error) {
    return (
      <section className="resumen-dia">
        <h3 className="resumen-dia__titulo">Resumen de hoy</h3>
        <div className="resumen-dia__error">
          <span className="resumen-dia__error-text">{error}</span>
          <button className="resumen-dia__error-btn" onClick={refetch}>
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  if (!data) return null;

  const {
    reservasHoy,
    mesasAbiertas,
    stockBajo,
    stockBajoItems,
    pedidosHoy,
    ventasHoy,
    topProductos,
  } = data;

  const hayAlgo =
    reservasHoy != null ||
    mesasAbiertas != null ||
    stockBajo != null ||
    pedidosHoy != null ||
    ventasHoy != null;

  if (!hayAlgo) return null;

  return (
    <section className="resumen-dia">
      <h3 className="resumen-dia__titulo">Resumen de hoy</h3>

      <div className="resumen-dia__tarjetas">
        <Tarjeta
          titulo="Reservas hoy"
          valor={reservasHoy}
          color="blue"
          icono="📅"
        />
        <Tarjeta
          titulo="Mesas abiertas"
          valor={mesasAbiertas}
          color="green"
          icono="🍽"
        />
        <Tarjeta
          titulo="Stock bajo"
          valor={stockBajo}
          subtitulo={
            stockBajoItems?.length
              ? stockBajoItems.map((i) => i.nombre).join(", ")
              : undefined
          }
          color={stockBajo > 0 ? "red" : "green"}
          icono="📦"
        />
        <Tarjeta
          titulo="Pedidos hoy"
          valor={pedidosHoy}
          color="purple"
          icono="🧾"
        />
        <Tarjeta
          titulo="Ventas hoy"
          valor={ventasHoy != null ? `${ventasHoy.toFixed(2)} €` : null}
          color="gold"
          icono="💰"
        />
      </div>
    </section>
  );
}
