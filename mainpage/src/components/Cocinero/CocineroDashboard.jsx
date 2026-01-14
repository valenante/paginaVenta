// components/cocinero/CocineroDashboard.jsx
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";
import CocineroStats from "./CocineroStats.jsx";
import "./CocineroDashboard.css";

export default function CocineroDashboard() {
  const { user, loading } = useAuth();

  // ⏳ Mientras se comprueba la sesión
  if (loading) return null;

  // 🔒 Sesión caída o no válida
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="cocinero-dashboard">
      <header>
        <h2>👋 Hola, {user.name}</h2>
        <span className="role">Cocinero</span>
      </header>

      <CocineroStats />
    </div>
  );
}
