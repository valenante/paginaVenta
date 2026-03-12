import { useAuth } from "../../context/AuthContext";
import "./StaffWelcome.css";

export default function StaffWelcome({ onStart }) {
  const { user } = useAuth();

  return (
    <div className="staff-welcome">
      <h1>👋 ¡Bienvenido, {user?.name}!</h1>

      <p className="subtitle">
        Hoy es un gran día para trabajar con rapidez, orden y buen servicio.
      </p>

      <div className="welcome-cards">
        <div className="card">⚡ Gestiona tareas de forma ágil</div>
        <div className="card">🧾 Reduce errores en la operativa</div>
        <div className="card">📊 Sigue tu rendimiento diario</div>
      </div>

      <button className="btn btn-primario" onClick={onStart}>
        Empezar turno
      </button>
    </div>
  );
}