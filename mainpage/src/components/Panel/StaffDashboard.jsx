import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";
import StaffStats from "./StaffStats.jsx";
import "./StaffDashboard.css";

export default function StaffDashboard() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleLabel = user?.roleLabel || user?.role || "staff";

  return (
    <div className="staff-dashboard">
      <header className="staff-dashboard-header">
        <h2>👋 Hola, {user.name}</h2>
        <span className="role">{roleLabel}</span>
      </header>

      <StaffStats />
    </div>
  );
}