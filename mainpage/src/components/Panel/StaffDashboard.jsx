import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../context/ConfigContext";
import { Navigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard.jsx";
import StaffStats from "./StaffStats.jsx";
import "./StaffDashboard.css";

const ADMIN_ROLES = ["superadmin", "admin_restaurante", "admin_shop"];

export default function StaffDashboard() {
  const { user, loading } = useAuth();
  const { config } = useConfig();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleLabel = user?.roleLabel || user?.role || "staff";
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  return (
    <div className="staff-dashboard">
      <header className="staff-dashboard-header">
        <h2>👋 Hola, {user.name}</h2>
        <span className="role dash-badge-role">{roleLabel}</span>
      </header>

      {isAdmin ? (
        <AdminDashboard />
      ) : (
        <StaffStats />
      )}
    </div>
  );
}