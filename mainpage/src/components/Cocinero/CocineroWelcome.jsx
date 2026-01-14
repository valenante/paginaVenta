// components/cocinero/CocineroWelcome.jsx
import { useAuth } from "../../context/AuthContext";
import "./CocineroWelcome.css";

export default function CocineroWelcome({ onStart }) {
  const { user } = useAuth();

  return (
    <div className="cocinero-welcome">
      <h1>👋 ¡Bienvenido, {user?.name}!</h1>

      <p className="subtitle">
        Todo listo para un servicio ágil y bien coordinado.
      </p>

      <div className="welcome-cards">
        <div className="card">🔥 Gestiona pedidos en tiempo real</div>
        <div className="card">⏱️ Controla el ritmo de cocina</div>
        <div className="card">🍳 Prioriza platos sin errores</div>
      </div>

      <button className="btn-primario" onClick={onStart}>
        Empezar turno en cocina
      </button>
    </div>
  );
}
