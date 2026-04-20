// src/pages/admin/AdminDashboard/AdminDashboard.jsx
// Dashboard rediseñado — estructura limpia, status en tiempo real por tenant
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiDollarSign, FiAlertTriangle, FiServer, FiUsers, FiPlus, FiRefreshCw,
  FiCoffee, FiMapPin, FiClock, FiArrowRight, FiZap, FiPrinter,
  FiCheckCircle, FiUnlock, FiXCircle, FiUserX,
} from "react-icons/fi";
import api from "../../../utils/api";
import useTenantsData from "../../../hooks/useTenantsData";
import TenantTable from "./components/TenantTable";
import "../../../styles/AdminDashboard.css";

/* ── Helpers ──────────────────────────── */
function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
}
function money(n) { return n != null ? `${Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€` : "—"; }

/* ══════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState(null);
  const [incidents, setIncidents] = useState(null);
  const [deploy, setDeploy] = useState(null);
  const [live, setLive] = useState([]);
  const [liveLoading, setLiveLoading] = useState(true);

  // Emergency state
  const [emSlug, setEmSlug] = useState("");
  const [emEmail, setEmEmail] = useState("");
  const [emResult, setEmResult] = useState({});
  const [emLoading, setEmLoading] = useState({});

  const { filtered, loading, error, search, setSearch, planFilter, setPlanFilter, fetchTenants, page, setPage, totalPages, total } = useTenantsData();

  // Fetch all dashboard data in parallel
  const fetchDashboard = useCallback(async () => {
    const [b, m, a, l] = await Promise.allSettled([
      api.get("/admin/superadminBilling"),
      api.get("/admin/superadminMonitor/overview"),
      api.get("/admin/system/api/status"),
      api.get("/admin/superadmin/live"),
    ]);
    if (b.status === "fulfilled") setBilling(b.value.data);
    if (m.status === "fulfilled") {
      const d = m.value.data?.data || m.value.data;
      setIncidents(d?.counts || null);
    }
    if (a.status === "fulfilled") {
      const d = a.value.data?.data || a.value.data;
      const active = d?.activeSlot || {};
      setDeploy({ slot: active.slot, sha: active.deploySha, buildTime: active.buildTime });
    }
    if (l.status === "fulfilled") {
      setLive(l.value.data?.data?.items || l.value.data?.items || []);
    }
    setLiveLoading(false);
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Emergency action helper
  const emExec = async (key, fn) => {
    setEmLoading(p => ({ ...p, [key]: true }));
    setEmResult(p => ({ ...p, [key]: null }));
    try { setEmResult(p => ({ ...p, [key]: { ok: true, msg: await fn() } })); }
    catch (e) { setEmResult(p => ({ ...p, [key]: { ok: false, msg: e?.response?.data?.message || e.message } })); }
    setEmLoading(p => ({ ...p, [key]: false }));
  };

  const mrr = billing?.data?.mrr ?? billing?.mrr ?? null;
  const activeSubs = billing?.data?.activeSubscriptions ?? billing?.activeSubscriptions ?? 0;
  const openTotal = incidents?.openTotal || 0;
  const p1 = incidents?.bySeverity?.P1 || 0;

  return (
    <div className="admin-dashboard">

      {/* ═══ SECTION 1: KPI HERO ═══ */}
      <div className="dash-kpis">
        <div className="dash-kpi dash-kpi--accent">
          <FiDollarSign className="dash-kpi__icon" />
          <div className="dash-kpi__body">
            <span className="dash-kpi__value">{money(mrr)}</span>
            <span className="dash-kpi__label">MRR · {activeSubs} activas</span>
          </div>
        </div>
        <div className={`dash-kpi ${openTotal > 0 ? "dash-kpi--danger" : "dash-kpi--ok"}`}>
          <FiAlertTriangle className="dash-kpi__icon" />
          <div className="dash-kpi__body">
            <span className="dash-kpi__value">{openTotal === 0 ? "Todo OK" : `${openTotal} abiertos`}</span>
            <span className="dash-kpi__label">{p1 > 0 ? `${p1} P1 activos` : "Incidentes"}</span>
          </div>
        </div>
        <div className="dash-kpi">
          <FiServer className="dash-kpi__icon" />
          <div className="dash-kpi__body">
            <span className="dash-kpi__value">{deploy?.sha?.slice(0, 8) || "—"}</span>
            <span className="dash-kpi__label">Deploy · {deploy?.slot || "—"} · {fmt(deploy?.buildTime)}</span>
          </div>
        </div>
        <div className="dash-kpi">
          <FiUsers className="dash-kpi__icon" />
          <div className="dash-kpi__body">
            <span className="dash-kpi__value">{filtered?.length || 0}</span>
            <span className="dash-kpi__label">Tenants</span>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: RESTAURANTES EN VIVO ═══ */}
      <section className="dash-section">
        <div className="dash-section__head">
          <h2><FiCoffee /> Restaurantes en vivo</h2>
          <button className="dash-btn-ghost" onClick={fetchDashboard}><FiRefreshCw /> Actualizar</button>
        </div>

        {liveLoading ? (
          <div className="dash-empty">Cargando...</div>
        ) : live.length === 0 ? (
          <div className="dash-empty">Sin tenants activos</div>
        ) : (
          <div className="dash-live-grid">
            {live.map(t => (
              <div key={t.slug} className={`dash-live-card ${t.enServicio ? "dash-live-card--active" : ""}`} onClick={() => navigate(`/superadmin/tenants/${t.slug}`)}>
                <div className="dash-live-card__head">
                  <span className={`dash-live-dot ${t.enServicio ? "dash-live-dot--on" : ""}`} />
                  <strong>{t.nombre || t.slug}</strong>
                  <span className="dash-live-plan">{t.plan}</span>
                </div>
                {t.error ? (
                  <div className="dash-live-card__body dash-live-card__error">Error al consultar</div>
                ) : (
                  <div className="dash-live-card__body">
                    <div className="dash-live-stat">
                      <FiMapPin />
                      <span><strong>{t.mesasAbiertas}</strong> mesas</span>
                    </div>
                    <div className="dash-live-stat">
                      <FiUsers />
                      <span><strong>{t.comensales}</strong> comensales</span>
                    </div>
                    <div className="dash-live-stat">
                      <FiDollarSign />
                      <span><strong>{money(t.totalEnMesas)}</strong> en mesa</span>
                    </div>
                    <div className="dash-live-stat">
                      <FiClock />
                      <span>{t.cajaAbierta ? `Caja desde ${fmt(t.cajaDesde)}` : "Caja cerrada"}</span>
                    </div>
                  </div>
                )}
                <div className="dash-live-card__foot">
                  <span className="dash-live-link">Ver detalle <FiArrowRight /></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ SECTION 3: ACCIONES RÁPIDAS ═══ */}
      <section className="dash-section">
        <h2><FiZap /> Acciones rápidas</h2>
        <div className="dash-actions-grid">
          <button className="dash-action" onClick={async () => {
            const { data } = await api.get("/admin/superadminMonitor/tenants?limit=100");
            const items = data?.data?.items || data?.items || [];
            alert(`Print Agents: ${items.filter(i => i.ok).length} OK, ${items.filter(i => !i.ok).length} DOWN`);
          }}><FiPrinter /> Check Print Agents</button>
          <button className="dash-action" onClick={async () => {
            const { data } = await api.get("/admin/superadminMonitor/incidents?status=open&limit=50");
            const items = data?.data?.items || data?.items || [];
            const stale = items.filter(i => (Date.now() - new Date(i.lastSeenAt).getTime()) > 7 * 86400000);
            for (const i of stale) await api.patch(`/admin/superadminMonitor/incidents/${i._id}/resolve`, { resolution: "stale >7d" });
            alert(stale.length > 0 ? `${stale.length} stale resueltos` : "Sin stale");
          }}><FiCheckCircle /> Resolver stale</button>
          <button className="dash-action dash-action--primary" onClick={() => navigate("/superadmin/tenants/nuevo")}><FiPlus /> Nuevo negocio</button>
        </div>

        <div className="dash-emergency">
          <h4>Emergencias</h4>
          <div className="dash-emergency__row">
            <input className="dash-input" placeholder="tenant slug" value={emSlug} onChange={e => setEmSlug(e.target.value)} />
            <button className="dash-action dash-action--danger" disabled={emLoading.caja} onClick={() => emExec("caja", async () => {
              const { data } = await api.post("/admin/superadmin/emergency/reopen-caja", { tenantSlug: emSlug.trim() });
              return (data?.data || data)?.message;
            })}><FiUnlock /> Reabrir caja</button>
            <button className="dash-action dash-action--danger" disabled={emLoading.zombies} onClick={() => emExec("zombies", async () => {
              const { data } = await api.post("/admin/superadmin/emergency/close-zombie-mesas", { tenantSlug: emSlug.trim() });
              return (data?.data || data)?.message;
            })}><FiXCircle /> Cerrar zombies</button>
          </div>
          {(emResult.caja || emResult.zombies) && <div className="dash-emergency__result">{[emResult.caja, emResult.zombies].filter(Boolean).map((r, i) => <span key={i} className={r.ok ? "dash-ok" : "dash-err"}>{r.msg}</span>)}</div>}
          <div className="dash-emergency__row" style={{ marginTop: 6 }}>
            <input className="dash-input" placeholder="email usuario" value={emEmail} onChange={e => setEmEmail(e.target.value)} />
            <button className="dash-action dash-action--danger" disabled={emLoading.session} onClick={() => emExec("session", async () => {
              const { data } = await api.post("/admin/superadmin/emergency/reset-user-session", { email: emEmail.trim() });
              return (data?.data || data)?.message;
            })}><FiUserX /> Reset sesión</button>
          </div>
          {emResult.session && <div className="dash-emergency__result"><span className={emResult.session.ok ? "dash-ok" : "dash-err"}>{emResult.session.msg}</span></div>}
        </div>
      </section>

      {/* ═══ SECTION 4: TENANTS TABLE ═══ */}
      <section className="dash-section">
        <div className="dash-section__head">
          <h2><FiUsers /> Tenants</h2>
          <div className="dash-section__filters">
            <input className="dash-input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="dash-select" value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
              <option value="">Todos los planes</option>
              <option value="tpv-premium">Premium</option>
              <option value="tpv-esencial">Esencial</option>
              <option value="trial">Trial</option>
            </select>
          </div>
        </div>

        {error && <div className="dash-error">{error}<button onClick={fetchTenants}>Reintentar</button></div>}

        <TenantTable
          tenants={filtered}
          onRefresh={fetchTenants}
          loading={loading}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          total={total}
        />
      </section>
    </div>
  );
}
