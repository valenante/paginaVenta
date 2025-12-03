// src/pages/admin/AdminDashboard/components/StatsCards.jsx
import { FiUsers, FiStar, FiCheckCircle, FiClock } from "react-icons/fi";

export default function StatsCards({ tenants }) {
  const total = tenants.length;
  const premium = tenants.filter(t => t.plan === "tpv-premium").length;
  const verifactu = tenants.filter(t => t.verifactuEnabled).length;

  const latest =
    tenants.length > 0
      ? new Date(
          Math.max(...tenants.map(t => new Date(t.createdAt)))
        ).toLocaleDateString()
      : "—";

  return (
    <div className="stats-cards">
      <div className="stat-card">
        <FiUsers className="icon" />
        <div>
          <h3>Total Tenants</h3>
          <p>{total}</p>
        </div>
      </div>

      <div className="stat-card premium">
        <FiStar className="icon" />
        <div>
          <h3>Activos Premium</h3>
          <p>{premium}</p>
        </div>
      </div>

      <div className="stat-card verifactu">
        <FiCheckCircle className="icon" />
        <div>
          <h3>Con VeriFactu</h3>
          <p>{verifactu}</p>
        </div>
      </div>

      <div className="stat-card">
        <FiClock className="icon" />
        <div>
          <h3>Último Registro</h3>
          <p>{latest}</p>
        </div>
      </div>
    </div>
  );
}
