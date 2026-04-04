import { useEffect, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiMail } from "react-icons/fi";
import api from "../../../../utils/api";
import "./ChurnSection.css";

function formatLastLogin(date) {
  if (!date) return "nunca";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "nunca";
  const diffMs = Date.now() - d.getTime();
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffD < 1) return "hoy";
  if (diffD === 1) return "ayer";
  return `hace ${diffD}d`;
}

export default function ChurnSection() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: d } = await api.get("/admin/superadminBilling/churn-overview");
        if (mounted) setData(d);
      } catch { /* optional section */ }
    })();
    return () => { mounted = false; };
  }, []);

  if (!data || data.atRisk?.length === 0) {
    return (
      <section className="churn-section churn-section--ok">
        <FiCheckCircle className="churn-section__ok-icon" />
        <span>Todos los tenants están saludables</span>
      </section>
    );
  }

  return (
    <section className="churn-section">
      <header className="churn-section__header">
        <FiAlertTriangle className="churn-section__warn-icon" />
        <h3 className="churn-section__title">
          Tenants en riesgo
          <span className="churn-section__count">{data.atRisk.length}</span>
        </h3>
      </header>

      <div className="churn-grid">
        {data.atRisk.map((t) => (
          <div className={`churn-card churn-card--${t.riskLevel}`} key={t._id}>
            <div className="churn-card__top">
              <div>
                <span className="churn-card__name">{t.nombre}</span>
                <span className="churn-card__slug">{t.slug}</span>
              </div>
              <span className={`churn-badge churn-badge--${t.riskLevel}`}>
                {t.riskLevel === "high" ? "ALTO" : "MEDIO"}
              </span>
            </div>

            <div className="churn-card__reasons">
              {t.riskReasons.map((r, i) => (
                <span className="churn-reason" key={i}>{r}</span>
              ))}
            </div>

            <div className="churn-card__footer">
              <span className="churn-card__login">
                Último login: <strong>{formatLastLogin(t.lastLogin)}</strong>
              </span>
              <a
                href={`mailto:?subject=Alef — Tu cuenta necesita atención&body=Hola ${t.nombre},%0D%0A%0D%0AHemos detectado que no has accedido a tu cuenta en varios días...`}
                className="churn-card__action"
                title="Enviar email"
              >
                <FiMail /> Contactar
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
