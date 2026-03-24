// src/pages/admin/AdminMonitor/AdminMonitorPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiSearch, FiFilter } from "react-icons/fi";
import api from "../../../utils/api";
import AdminMonitorJobs from "./AdminMonitorJobs";
import "./AdminMonitor.css";

const PAGE_SIZE = 10;

/* ── Helpers ──────────────────────────────── */

function StatusDot({ state }) {
  return <span className={`m-dot m-dot--${state}`} />;
}
function StatusBadge({ state, label }) {
  return (
    <span className={`m-badge m-badge--${state}`}>
      <StatusDot state={state} /> {label}
    </span>
  );
}
function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
}
function num(n, s = "") {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n)}${s}`;
}
function httpTenantState({ errorRate, p95Ms, total }) {
  if ((total || 0) < 30) return "skipped";
  if (Number(errorRate || 0) >= 5 || Number(p95Ms || 0) >= 2000) return "down";
  if (Number(errorRate || 0) >= 1 || Number(p95Ms || 0) >= 1000) return "degraded";
  return "ok";
}
function useDebounced(v, ms = 400) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

function Pagination({ page, total, setPage }) {
  const tp = Math.ceil(total / PAGE_SIZE) || 1;
  if (tp <= 1) return null;
  return (
    <div className="m-pagination">
      <button disabled={page <= 1} onClick={() => setPage(page - 1)}><FiChevronLeft /></button>
      <span className="m-pagination__info">{page} / {tp}</span>
      <button disabled={page >= tp} onClick={() => setPage(page + 1)}><FiChevronRight /></button>
    </div>
  );
}

function paginate(arr, page) {
  const s = (page - 1) * PAGE_SIZE;
  return arr.slice(s, s + PAGE_SIZE);
}

const STATE_LABEL = { ok: "OK", degraded: "DEGRADED", down: "DOWN", skipped: "SKIPPED" };

/* ── Main ─────────────────────────────────── */

export default function AdminMonitorPage() {
  const [overview, setOverview] = useState(null);
  const [rows, setRows] = useState([]);
  const [httpGlobal, setHttpGlobal] = useState(null);
  const [httpTenants, setHttpTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailTenants, setEmailTenants] = useState([]);
  const [vps, setVps] = useState(null);
  const [onlyDown, setOnlyDown] = useState(false);
  const [q, setQ] = useState("");
  const qDebounced = useDebounced(q, 400);
  const reqSeq = useRef(0);

  // Pagination states
  const [httpPage, setHttpPage] = useState(1);
  const [emailPage, setEmailPage] = useState(1);
  const [printPage, setPrintPage] = useState(1);

  // Reset pages on filter change
  useEffect(() => { setHttpPage(1); setEmailPage(1); setPrintPage(1); }, [qDebounced, onlyDown]);

  const fetchAll = async ({ onlyDown, q }) => {
    const mySeq = ++reqSeq.current;
    setLoading(true);
    try {
      const [ov, ten, http, httpT] = await Promise.all([
        api.get("/admin/superadminMonitor/overview"),
        api.get("/admin/superadminMonitor/tenants", { params: { onlyDown, q } }),
        api.get("/admin/metrics/http"),
        api.get("/admin/metrics/http/tenants", { params: { q, minReq: 30, limit: 200, onlyBad: onlyDown } }),
      ]);
      if (mySeq !== reqSeq.current) return;
      setOverview(ov.data);
      setRows(ten.data?.items || []);
      setHttpGlobal(http.data || null);
      setHttpTenants(httpT.data?.items || []);
    } catch (e) { console.error("Monitor core error:", e); }

    try {
      const emailT = await api.get("/admin/superadminMonitor/services", { params: { service: "email", q } });
      if (mySeq !== reqSeq.current) return;
      setEmailTenants(emailT.data?.items || []);
    } catch { setEmailTenants([]); }
    finally { if (mySeq === reqSeq.current) setLoading(false); }
  };

  const fetchVps = async () => {
    try { const { data } = await api.get("/admin/superadminMonitor/vps"); setVps(data?.ok ? data : null); }
    catch { setVps(null); }
  };

  useEffect(() => {
    const p = { onlyDown, q: qDebounced };
    fetchAll(p); fetchVps();
    const id = setInterval(() => { fetchAll(p); fetchVps(); }, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyDown, qDebounced]);

  function emailState({ ok, failStreak }) {
    if (ok === true) return "ok";
    if ((failStreak || 0) < 3) return "degraded";
    return "down";
  }
  function vpsState(v) {
    if (v?.state) return v.state;
    const ram = Number(v?.ram?.usagePct ?? 0), disk = Number(v?.disk?.usagePct ?? 0), cpu = Number(v?.cpu?.load1 ?? 0);
    if (disk >= 85 || ram >= 85 || cpu >= 1) return "down";
    if (disk >= 70 || ram >= 75 || cpu >= 0.7) return "degraded";
    return "ok";
  }

  const globalApiOk = overview?.global?.api?.ok === true;
  const globalSocketOk = overview?.global?.socket?.ok === true;
  const counts = overview?.counts || {};

  const httpStats = httpGlobal?.ok ? httpGlobal : null;
  const httpState = useMemo(() => {
    if (!httpStats) return "degraded";
    if (Number(httpStats?.errorRate ?? 0) >= 5 || Number(httpStats?.latency?.p95Ms ?? 0) >= 2000) return "down";
    if (Number(httpStats?.errorRate ?? 0) >= 1 || Number(httpStats?.latency?.p95Ms ?? 0) >= 1000) return "degraded";
    return "ok";
  }, [httpStats]);

  const filteredPrint = useMemo(() => {
    if (!q.trim()) return rows;
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => (r.tenantSlug || "").toLowerCase().includes(qq) || (r.tenant?.nombre || "").toLowerCase().includes(qq));
  }, [rows, q]);

  const filteredHttpTenants = useMemo(() => {
    if (!q.trim()) return httpTenants;
    const qq = q.trim().toLowerCase();
    return httpTenants.filter((t) => (t.tenantSlug || "").toLowerCase().includes(qq));
  }, [httpTenants, q]);

  if (loading && !overview) return <div className="m-loading">Cargando monitor...</div>;

  const refresh = () => { fetchAll({ onlyDown, q: qDebounced }); fetchVps(); };

  return (
    <div className="monitor">
      {/* ── Header ──────────── */}
      <header className="monitor__header">
        <div>
          <h2 className="monitor__title">Estado del sistema</h2>
          <p className="monitor__subtitle">Monitorización en tiempo real — auto-refresh 30s</p>
        </div>
        <div className="monitor__controls">
          <div className="monitor__search">
            <FiSearch className="monitor__search-icon" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar tenant..." />
          </div>
          <label className="monitor__toggle">
            <input type="checkbox" checked={onlyDown} onChange={(e) => setOnlyDown(e.target.checked)} />
            <FiFilter size={14} /> Solo caídos
          </label>
          <button className="monitor__refresh" onClick={refresh}><FiRefreshCw size={14} /> Actualizar</button>
        </div>
      </header>

      {/* ── KPI Cards ──────── */}
      <section className="monitor__kpis">
        <article className="m-kpi">
          <div className="m-kpi__head"><StatusDot state={globalApiOk ? "ok" : "down"} /><span className="m-kpi__label">API</span></div>
          <div className="m-kpi__value">{globalApiOk ? "Operativa" : "Caída"}</div>
          <div className="m-kpi__hint">{fmt(overview?.global?.api?.lastCheckedAt)}</div>
        </article>
        <article className="m-kpi">
          <div className="m-kpi__head"><StatusDot state={globalSocketOk ? "ok" : "down"} /><span className="m-kpi__label">Sockets</span></div>
          <div className="m-kpi__value">{globalSocketOk ? "Activos" : "Caídos"}</div>
          <div className="m-kpi__hint">{fmt(overview?.global?.socket?.lastCheckedAt)}</div>
        </article>
        <article className="m-kpi">
          <div className="m-kpi__head"><StatusDot state={httpState} /><span className="m-kpi__label">HTTP</span></div>
          <div className="m-kpi__value">p95: {num(httpStats?.latency?.p95Ms, "ms")}</div>
          <div className="m-kpi__hint">err: {num(httpStats?.errorRate, "%")} · rpm: {num(httpStats?.rpm)} · {num(httpStats?.total)} req</div>
        </article>
        <article className="m-kpi">
          <div className="m-kpi__head"><StatusDot state={counts.openTotal ? "degraded" : "ok"} /><span className="m-kpi__label">Incidentes</span></div>
          <div className="m-kpi__value m-kpi__value--big">{counts.openTotal ?? 0}</div>
          <div className="m-kpi__hint">P1:{counts.bySeverity?.P1 || 0} P2:{counts.bySeverity?.P2 || 0} P3:{counts.bySeverity?.P3 || 0}</div>
        </article>
        <article className="m-kpi">
          <div className="m-kpi__head"><StatusDot state={vps ? vpsState(vps) : "degraded"} /><span className="m-kpi__label">VPS</span></div>
          {vps ? (
            <>
              <div className="m-kpi__value">{vpsState(vps) === "ok" ? "OK" : vpsState(vps) === "degraded" ? "Degradado" : "Crítico"}</div>
              <div className="m-kpi__hint">RAM:{num(vps.ram?.usagePct,"%")} CPU:{num(vps.cpu?.load1)} Disco:{num(vps.disk?.usagePct,"%")}</div>
            </>
          ) : (
            <><div className="m-kpi__value">Sin datos</div><div className="m-kpi__hint">No se pudo obtener estado</div></>
          )}
        </article>
      </section>

      {/* ── Jobs ───────────── */}
      <AdminMonitorJobs q={q} onlyBad={onlyDown} />

      {/* ── HTTP por tenant ── */}
      <section className="m-section">
        <div className="m-section__header">
          <h3 className="m-section__title">HTTP por tenant</h3>
          <span className="m-section__count">{filteredHttpTenants.length}</span>
        </div>

        <div className="m-section__desktop">
          <table className="m-table">
            <thead><tr><th>Estado</th><th>Tenant</th><th>RPM</th><th>Total</th><th>5xx</th><th>Err%</th><th>p50</th><th>p95</th><th>p99</th></tr></thead>
            <tbody>
              {paginate(filteredHttpTenants, httpPage).map((t) => {
                const st = httpTenantState({ total: t.total, errorRate: t.errorRate, p95Ms: t?.latency?.p95Ms });
                return (
                  <tr key={t.tenantSlug}>
                    <td><StatusBadge state={st} label={STATE_LABEL[st]} /></td>
                    <td><div className="m-tenant-cell"><strong>{t.tenantSlug}</strong></div></td>
                    <td>{num(t.rpm)}</td><td>{num(t.total)}</td><td>{num(t.err5xx)}</td><td>{num(t.errorRate,"%")}</td>
                    <td>{num(t?.latency?.p50Ms,"ms")}</td><td>{num(t?.latency?.p95Ms,"ms")}</td><td>{num(t?.latency?.p99Ms,"ms")}</td>
                  </tr>
                );
              })}
              {!filteredHttpTenants.length && <tr><td colSpan={9} className="m-table__empty">Sin datos HTTP en la ventana.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="m-section__mobile">
          {paginate(filteredHttpTenants, httpPage).map((t) => {
            const st = httpTenantState({ total: t.total, errorRate: t.errorRate, p95Ms: t?.latency?.p95Ms });
            return (
              <div className="m-card" key={t.tenantSlug}>
                <div className="m-card__top"><StatusBadge state={st} label={STATE_LABEL[st]} /><strong>{t.tenantSlug}</strong></div>
                <div className="m-card__grid">
                  <span>RPM: {num(t.rpm)}</span><span>Total: {num(t.total)}</span><span>5xx: {num(t.err5xx)}</span>
                  <span>Err: {num(t.errorRate,"%")}</span><span>p95: {num(t?.latency?.p95Ms,"ms")}</span><span>p99: {num(t?.latency?.p99Ms,"ms")}</span>
                </div>
              </div>
            );
          })}
          {!filteredHttpTenants.length && <p className="m-table__empty">Sin datos HTTP.</p>}
        </div>
        <Pagination page={httpPage} total={filteredHttpTenants.length} setPage={setHttpPage} />
        <p className="m-footnote">* SKIPPED = &lt;30 requests (evita falsos positivos).</p>
      </section>

      {/* ── Email por tenant ── */}
      <section className="m-section">
        <div className="m-section__header">
          <h3 className="m-section__title">Email por tenant</h3>
          <span className="m-section__count">{emailTenants.length}</span>
        </div>

        <div className="m-section__desktop">
          <table className="m-table">
            <thead><tr><th>Estado</th><th>Tenant</th><th>Fail streak</th><th>SMTP</th><th>Último envío</th><th>Incidente</th><th>Error</th></tr></thead>
            <tbody>
              {paginate(emailTenants, emailPage).map((r) => {
                const st = emailState(r);
                return (
                  <tr key={`${r.tenantSlug}-email`}>
                    <td><StatusBadge state={st} label={STATE_LABEL[st] || st.toUpperCase()} /></td>
                    <td><div className="m-tenant-cell"><strong>{r.tenant?.nombre || r.tenantSlug}</strong><small>{r.tenantSlug}</small></div></td>
                    <td>{r.failStreak || 0}</td>
                    <td className="m-mono">{r.meta?.smtpHost ? `${r.meta.smtpHost}:${r.meta.smtpPort || "—"}` : "—"}</td>
                    <td>{fmt(r.lastCheckedAt)}</td>
                    <td>{r.incident ? <span className={`m-sev m-sev--${r.incident.severity}`}>{r.incident.severity}</span> : "—"}</td>
                    <td className="m-err">{r.lastError ? String(r.lastError).slice(0, 60) : "—"}</td>
                  </tr>
                );
              })}
              {!emailTenants.length && <tr><td colSpan={7} className="m-table__empty">Sin actividad de email.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="m-section__mobile">
          {paginate(emailTenants, emailPage).map((r) => {
            const st = emailState(r);
            return (
              <div className="m-card" key={`${r.tenantSlug}-email`}>
                <div className="m-card__top"><StatusBadge state={st} label={STATE_LABEL[st] || st.toUpperCase()} /><strong>{r.tenant?.nombre || r.tenantSlug}</strong></div>
                <div className="m-card__grid">
                  <span>Fails: {r.failStreak || 0}</span>
                  <span>SMTP: {r.meta?.smtpHost || "—"}</span>
                  <span>{fmt(r.lastCheckedAt)}</span>
                </div>
                {r.lastError && <div className="m-card__err">{String(r.lastError).slice(0, 80)}</div>}
              </div>
            );
          })}
          {!emailTenants.length && <p className="m-table__empty">Sin actividad de email.</p>}
        </div>
        <Pagination page={emailPage} total={emailTenants.length} setPage={setEmailPage} />
      </section>

      {/* ── Print por tenant ── */}
      <section className="m-section">
        <div className="m-section__header">
          <h3 className="m-section__title">Impresión por tenant</h3>
          <span className="m-section__count">{filteredPrint.length}</span>
        </div>

        <div className="m-section__desktop">
          <table className="m-table">
            <thead><tr><th>Estado</th><th>Tenant</th><th>Plan</th><th>Fail streak</th><th>Último check</th><th>Incidente</th><th>Error</th></tr></thead>
            <tbody>
              {paginate(filteredPrint, printPage).map((r) => {
                const skipped = !!r?.meta?.skipped;
                const degraded = !r.ok && (r.failStreak || 0) < 3;
                const st = skipped ? "skipped" : r.ok ? "ok" : degraded ? "degraded" : "down";
                return (
                  <tr key={`${r.tenantSlug}-${r.service}`}>
                    <td><StatusBadge state={st} label={STATE_LABEL[st]} /></td>
                    <td><div className="m-tenant-cell"><strong>{r.tenant?.nombre || r.tenantSlug}</strong><small>{r.tenantSlug}</small></div></td>
                    <td>{r.tenant?.plan || "—"}</td>
                    <td>{r.failStreak || 0}</td>
                    <td>{fmt(r.lastCheckedAt)}</td>
                    <td>{r.incident ? <span className={`m-sev m-sev--${r.incident.severity}`}>{r.incident.severity}</span> : "—"}</td>
                    <td className="m-err">{r.lastError ? String(r.lastError).slice(0, 60) : "—"}</td>
                  </tr>
                );
              })}
              {!filteredPrint.length && <tr><td colSpan={7} className="m-table__empty">Sin resultados.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="m-section__mobile">
          {paginate(filteredPrint, printPage).map((r) => {
            const skipped = !!r?.meta?.skipped;
            const degraded = !r.ok && (r.failStreak || 0) < 3;
            const st = skipped ? "skipped" : r.ok ? "ok" : degraded ? "degraded" : "down";
            return (
              <div className="m-card" key={`${r.tenantSlug}-${r.service}`}>
                <div className="m-card__top"><StatusBadge state={st} label={STATE_LABEL[st]} /><strong>{r.tenant?.nombre || r.tenantSlug}</strong></div>
                <div className="m-card__grid">
                  <span>Plan: {r.tenant?.plan || "—"}</span>
                  <span>Fails: {r.failStreak || 0}</span>
                  <span>{fmt(r.lastCheckedAt)}</span>
                </div>
                {r.lastError && <div className="m-card__err">{String(r.lastError).slice(0, 80)}</div>}
              </div>
            );
          })}
          {!filteredPrint.length && <p className="m-table__empty">Sin resultados.</p>}
        </div>
        <Pagination page={printPage} total={filteredPrint.length} setPage={setPrintPage} />
      </section>
    </div>
  );
}
