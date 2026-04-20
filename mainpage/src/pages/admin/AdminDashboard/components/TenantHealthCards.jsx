// src/pages/admin/AdminDashboard/components/TenantHealthCards.jsx
// Muestra revenue por tenant y churn risk (días sin login)
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiTrendingUp, FiAlertCircle } from "react-icons/fi";

function daysSince(d) {
  if (!d) return Infinity;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export default function TenantHealthCards({ tenants }) {
  const navigate = useNavigate();

  const data = useMemo(() => {
    if (!tenants?.length) return { revenue: [], churnRisk: [] };

    const PLAN_PRICE = { "tpv-premium": 129, "tpv-esencial": 89, trial: 0, "alef-shop": 49 };

    const revenue = tenants
      .filter(t => t.estado === "activo")
      .map(t => ({
        slug: t.slug,
        nombre: t.nombre || t.slug,
        plan: t.plan,
        mrr: PLAN_PRICE[t.plan] || 0,
        lastLogin: t.lastLogin,
        daysSinceLogin: daysSince(t.lastLogin),
      }))
      .sort((a, b) => b.mrr - a.mrr);

    const churnRisk = revenue
      .filter(t => t.daysSinceLogin > 3 && t.mrr > 0)
      .sort((a, b) => b.daysSinceLogin - a.daysSinceLogin);

    return { revenue, churnRisk };
  }, [tenants]);

  if (!tenants?.length) return null;

  return (
    <div className="th-cards">
      <div className="th-card">
        <h4><FiTrendingUp /> Revenue por tenant</h4>
        <div className="th-list">
          {data.revenue.slice(0, 8).map(t => (
            <div key={t.slug} className="th-row" onClick={() => navigate(`/superadmin/tenants/${t.slug}`)}>
              <span className="th-name">{t.nombre}</span>
              <span className="th-plan">{t.plan}</span>
              <span className="th-mrr">{t.mrr}€/m</span>
            </div>
          ))}
        </div>
      </div>
      {data.churnRisk.length > 0 && (
        <div className="th-card th-card--warn">
          <h4><FiAlertCircle /> Churn risk (sin login &gt;3 días)</h4>
          <div className="th-list">
            {data.churnRisk.slice(0, 5).map(t => (
              <div key={t.slug} className="th-row" onClick={() => navigate(`/superadmin/tenants/${t.slug}`)}>
                <span className="th-name">{t.nombre}</span>
                <span className="th-days">{t.daysSinceLogin === Infinity ? "nunca" : `${t.daysSinceLogin}d`}</span>
                <span className="th-mrr">{t.mrr}€/m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
