import {
  FiUsers,
  FiStar,
  FiCheckCircle,
  FiClock,
  FiShoppingBag,
  FiCoffee,
  FiAlertTriangle,
} from "react-icons/fi";

export default function StatsCards({ tenants }) {
  const total = tenants.length;

  const restaurantes = tenants.filter(
    (t) => t.tipoNegocio !== "shop"
  ).length;

  const tiendas = tenants.filter(
    (t) => t.tipoNegocio === "shop"
  ).length;

  const premium = tenants.filter(
    (t) => t.plan === "tpv-premium"
  ).length;

  const verifactu = tenants.filter(
    (t) => t.verifactuEnabled
  ).length;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const inactivos = tenants.filter(
    (t) => !t.lastLogin || new Date(t.lastLogin) < sevenDaysAgo
  ).length;

  const latest =
    tenants.length > 0
      ? new Date(
          Math.max(...tenants.map((t) => new Date(t.createdAt)))
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

      <div className="stat-card restaurante">
        <FiCoffee className="icon" />
        <div>
          <h3>Restaurantes</h3>
          <p>{restaurantes}</p>
        </div>
      </div>

      <div className="stat-card shop">
        <FiShoppingBag className="icon" />
        <div>
          <h3>Tiendas</h3>
          <p>{tiendas}</p>
        </div>
      </div>

      <div className="stat-card premium">
        <FiStar className="icon" />
        <div>
          <h3>Premium</h3>
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

      <div className="stat-card inactivos">
        <FiAlertTriangle className="icon" />
        <div>
          <h3>Inactivos (7d+)</h3>
          <p>{inactivos}</p>
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
