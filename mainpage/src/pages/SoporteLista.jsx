import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import "../styles/Soporte.css";

export default function SoporteLista() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarTickets = async () => {
    try {
      const res = await api.get("/tickets/cliente");
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error("Error cargando tickets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTickets();
  }, []);

  if (loading)
    return <p className="soporte-loading">Cargando...</p>;

  return (
    <div className="soporte-contenedor">
      <div className="soporte-header">
        <h1>Soporte técnico</h1>
        <Link to="/soporte/nuevo" className="btn-primario">Nuevo ticket</Link>
      </div>

      {tickets.length === 0 ? (
        <p className="soporte-vacio">No tienes tickets todavía.</p>
      ) : (
        <div className="soporte-lista">
          {tickets.map((t) => (
            <Link
              to={`/soporte/${t._id}`}
              className="soporte-item"
              key={t._id}
            >
              <div>
                <h3>{t.asunto}</h3>
                <p className={`estado ${t.estado}`}>{t.estado}</p>
              </div>

              <small>
                {new Date(t.createdAt).toLocaleDateString()}
              </small>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
