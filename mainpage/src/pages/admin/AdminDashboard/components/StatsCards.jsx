import {
  FiUsers,
  FiStar,
  FiCheckCircle,
  FiClock,
  FiShoppingBag,
  FiCoffee,
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

  const latest =
    tenants.length > 0
      ? new Date(
          Math.max(...tenants.map((t) => new Date(t.createdAt)))
        ).toLocaleDateString()
      : "—";

  return (
    <div className="stats-cards">
      {/* TOTAL */}
      <div className="stat-card">
        <FiUsers className="icon" />
        <div>
          <h3>Total Tenants</h3>
          <p>{total}</p>
        </div>
      </div>

      {/* RESTAURANTES */}
      <div className="stat-card restaurante">
        <FiCoffee className="icon" />
        <div>
          <h3>Restaurantes</h3>
          <p>{restaurantes}</p>
        </div>
      </div>

      {/* TIENDAS */}
      <div className="stat-card shop">
        <FiShoppingBag className="icon" />
        <div>
          <h3>Tiendas</h3>
          <p>{tiendas}</p>
        </div>
      </div>

      {/* PREMIUM */}
      <div className="stat-card premium">
        <FiStar className="icon" />
        <div>
          <h3>Premium</h3>
          <p>{premium}</p>
        </div>
      </div>

      {/* VERIFACTU */}
      <div className="stat-card verifactu">
        <FiCheckCircle className="icon" />
        <div>
          <h3>Con VeriFactu</h3>
          <p>{verifactu}</p>
        </div>
      </div>

      {/* ÚLTIMO REGISTRO */}
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
