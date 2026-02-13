// components/camarero/CamareroWelcome.jsx
import { useAuth } from "../../context/AuthContext";
import "./CamareroWelcome.css";

export default function CamareroWelcome({ onStart }) {
  const { user } = useAuth();

  return (
    <div className="camarero-welcome">
      <h1>👋 ¡Bienvenido, {user?.name}!</h1>

      <p className="subtitle">
        Hoy es un gran día para dar un servicio excelente.
      </p>

      <div className="welcome-cards">
        <div className="card">🍽️ Atiende mesas fácilmente</div>
        <div className="card">⚡ Pedidos rápidos y sin errores</div>
        <div className="card">📊 Sigue tu rendimiento</div>
      </div>

      <button className="btn btn-primario " onClick={onStart}>
        Empezar mi turno
      </button>
    </div>
  );
}
