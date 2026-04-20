// src/pages/admin/tenants/TenantDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiExternalLink, FiRefreshCw, FiUser, FiActivity } from "react-icons/fi";
import api from "../../../utils/api";
import "../../../styles/TenantDetail.css";

function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
}

function Badge({ color, children }) {
  const colors = {
    green: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
    red: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
    yellow: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24" },
    gray: { bg: "rgba(255,255,255,0.08)", text: "#9ca3af" },
  };
  const c = colors[color] || colors.gray;
  return <span style={{ background: c.bg, color: c.text, padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{children}</span>;
}

export default function TenantDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [t, h] = await Promise.allSettled([
      api.get(`/admin/superadmin/tenants?q=${slug}&limit=1`),
      api.get(`/admin/superadminMonitor/tenants?q=${slug}&limit=5`),
    ]);

    if (t.status === "fulfilled") {
      const items = t.value.data?.data?.items || t.value.data?.items || t.value.data?.data || [];
      const found = (Array.isArray(items) ? items : [items]).find(x => x.slug === slug);
      setTenant(found || null);
    }
    if (h.status === "fulfilled") {
      const items = h.value.data?.data?.items || h.value.data?.items || [];
      const found = items.find(x => x.tenantSlug === slug);
      setHealth(found || null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [slug]);

  const impersonate = async () => {
    try {
      await api.post(`/admin/superadmin/impersonar/${slug}`, {
        reasonCategory: "soporte",
        reasonText: `Acceso superadmin al tenant ${slug} desde panel AlefAdmin`,
      });
      window.open(`https://${slug}-tpv.softalef.com`, "_blank");
    } catch (e) {
      alert(`Error: ${e?.response?.data?.message || e.message}`);
    }
  };

  if (loading) return <div className="td-loading">Cargando tenant...</div>;
  if (!tenant) return <div className="td-loading">Tenant no encontrado</div>;

  const estadoColor = tenant.estado === "activo" ? "green" : tenant.estado === "suspendido" ? "yellow" : "red";
  const printOk = health?.ok === true;

  return (
    <div className="tenant-detail">
      <div className="td-topbar">
        <button className="td-back" onClick={() => navigate("/superadmin")}>
          <FiArrowLeft /> Volver
        </button>
        <button className="td-refresh" onClick={fetchAll}><FiRefreshCw /></button>
      </div>

      <div className="td-header">
        <h1>{tenant.nombre || tenant.slug}</h1>
        <div className="td-header__badges">
          <Badge color={estadoColor}>{tenant.estado?.toUpperCase()}</Badge>
          <Badge color="gray">{tenant.plan || "sin plan"}</Badge>
          <Badge color="gray">{tenant.tipoNegocio || "—"}</Badge>
        </div>
      </div>

      <div className="td-grid">
        {/* Info */}
        <div className="td-card">
          <h3><FiUser /> Información</h3>
          <div className="td-info-grid">
            <div><span className="td-label">Slug</span><span className="td-value">{tenant.slug}</span></div>
            <div><span className="td-label">Email</span><span className="td-value">{tenant.email || "—"}</span></div>
            <div><span className="td-label">Plan</span><span className="td-value">{tenant.plan || "—"}</span></div>
            <div><span className="td-label">Alta</span><span className="td-value">{fmt(tenant.createdAt)}</span></div>
            <div><span className="td-label">Tipo</span><span className="td-value">{tenant.tipoNegocio || "—"}</span></div>
            <div><span className="td-label">IP Tailscale</span><span className="td-value">{tenant.ipTailscale || "—"}</span></div>
          </div>
        </div>

        {/* Health */}
        <div className="td-card">
          <h3><FiActivity /> Salud</h3>
          <div className="td-info-grid">
            <div>
              <span className="td-label">Print Agent</span>
              <span className="td-value">{printOk ? <Badge color="green">OK</Badge> : <Badge color="red">DOWN</Badge>}</span>
            </div>
            <div><span className="td-label">Fail Streak</span><span className="td-value">{health?.failStreak ?? "—"}</span></div>
            <div><span className="td-label">Último check</span><span className="td-value">{fmt(health?.lastCheckedAt)}</span></div>
            <div><span className="td-label">Último error</span><span className="td-value td-value--error">{health?.lastError || "ninguno"}</span></div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="td-actions">
        <button className="td-action-btn td-action-btn--primary" onClick={impersonate}>
          <FiExternalLink /> Impersonar (abrir TPV)
        </button>
        <button className="td-action-btn" onClick={() => navigate(`/superadmin/exports?tenant=${slug}`)}>
          Exportar datos
        </button>
        <button className="td-action-btn" onClick={() => navigate(`/superadmin/rgpd?tenant=${slug}`)}>
          RGPD
        </button>
      </div>
    </div>
  );
}
