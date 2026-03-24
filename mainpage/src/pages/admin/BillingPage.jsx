import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import api from "../../utils/api";
import "../../styles/BillingPage.css";

const PAGE_SIZE = 10;

function moneyEUR(v) {
  return `${Number(v || 0).toFixed(2)} €`;
}
function fmtDateTime(ts) {
  if (!ts) return "—";
  const n = Number(ts);
  const ms = n < 1e10 ? n * 1000 : n;
  try { return new Date(ms).toLocaleString("es-ES"); } catch { return "—"; }
}
function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("es-ES"); } catch { return "—"; }
}

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const tone = s === "succeeded" || s === "paid" ? "ok" : s === "failed" || s === "canceled" ? "bad" : "neutral";
  return <span className={`billing-status billing-status--${tone}`}>{status || "—"}</span>;
}

function Pagination({ page, totalPages, setPage, disabled }) {
  if (totalPages <= 1) return null;
  return (
    <div className="billing-pagination">
      <button disabled={page <= 1 || disabled} onClick={() => setPage(page - 1)}><FiChevronLeft /></button>
      <span className="billing-pagination__info">{page} / {totalPages}</span>
      <button disabled={page >= totalPages || disabled} onClick={() => setPage(page + 1)}><FiChevronRight /></button>
    </div>
  );
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [pagoPag, setPagoPag] = useState(1);
  const [subPag, setSubPag] = useState(1);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/admin/superadminBilling");
        if (mounted) setData(res.data);
      } catch {
        if (mounted) setError("No se pudo cargar la información de facturación.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const view = useMemo(() => {
    const safe = data || {};
    return {
      mrr: Number(safe.mrr || 0),
      totalTenants: Number(safe.totalTenants || 0),
      pagos: Array.isArray(safe.pagos) ? safe.pagos : [],
      suscripciones: Array.isArray(safe.suscripciones) ? safe.suscripciones : [],
    };
  }, [data]);

  const pagosPaged = useMemo(() => {
    const start = (pagoPag - 1) * PAGE_SIZE;
    return view.pagos.slice(start, start + PAGE_SIZE);
  }, [view.pagos, pagoPag]);
  const pagosTotalPages = Math.ceil(view.pagos.length / PAGE_SIZE) || 1;

  const subsPaged = useMemo(() => {
    const start = (subPag - 1) * PAGE_SIZE;
    return view.suscripciones.slice(start, start + PAGE_SIZE);
  }, [view.suscripciones, subPag]);
  const subsTotalPages = Math.ceil(view.suscripciones.length / PAGE_SIZE) || 1;

  if (loading) return <p className="billing-state billing-state--loading">Cargando datos...</p>;
  if (error) return <p className="billing-state billing-state--error">{error}</p>;
  if (!data) return <p className="billing-state billing-state--error">No hay datos.</p>;

  return (
    <section className="billing">
      <header className="billing__header">
        <h1 className="billing__title">Facturación</h1>
        <p className="billing__subtitle">Ingresos recurrentes, pagos recientes y suscripciones activas.</p>
      </header>

      {/* KPIs */}
      <div className="billing-kpis">
        <article className="billing-kpi">
          <div className="billing-kpi__label">MRR</div>
          <div className="billing-kpi__value">{moneyEUR(view.mrr)}</div>
          <div className="billing-kpi__hint">Ingresos recurrentes</div>
        </article>
        <article className="billing-kpi">
          <div className="billing-kpi__label">Tenants</div>
          <div className="billing-kpi__value">{view.totalTenants}</div>
          <div className="billing-kpi__hint">Total registrados</div>
        </article>
        <article className="billing-kpi">
          <div className="billing-kpi__label">Suscripciones</div>
          <div className="billing-kpi__value">{view.suscripciones.length}</div>
          <div className="billing-kpi__hint">Activas</div>
        </article>
      </div>

      {/* Pagos */}
      <section className="billing-block">
        <header className="billing-block__header">
          <h2 className="billing-block__title">Últimos pagos</h2>
          <span className="billing-block__count">{view.pagos.length}</span>
        </header>

        {/* Desktop */}
        <div className="billing-desktop">
          <table className="billing-table">
            <thead className="billing-table__thead">
              <tr>
                <th>Monto</th>
                <th>Estado</th>
                <th>Cliente</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pagosPaged.length === 0 ? (
                <tr><td className="billing-table__empty" colSpan={4}>No hay pagos recientes.</td></tr>
              ) : pagosPaged.map((p) => (
                <tr key={p.id}>
                  <td>{moneyEUR((p.amount || 0) / 100)}</td>
                  <td><StatusPill status={p.status} /></td>
                  <td className="billing-table__customer">{p.customer || "—"}</td>
                  <td>{fmtDateTime(p.created)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="billing-mobile">
          {pagosPaged.length === 0 ? (
            <p className="billing-table__empty">No hay pagos recientes.</p>
          ) : pagosPaged.map((p) => (
            <div className="billing-card" key={p.id}>
              <div className="billing-card__row">
                <span className="billing-card__amount">{moneyEUR((p.amount || 0) / 100)}</span>
                <StatusPill status={p.status} />
              </div>
              <div className="billing-card__meta">
                <span>{p.customer || "—"}</span>
                <span>{fmtDateTime(p.created)}</span>
              </div>
            </div>
          ))}
        </div>

        <Pagination page={pagoPag} totalPages={pagosTotalPages} setPage={setPagoPag} />
      </section>

      {/* Suscripciones */}
      <section className="billing-block">
        <header className="billing-block__header">
          <h2 className="billing-block__title">Suscripciones</h2>
          <span className="billing-block__count">{view.suscripciones.length}</span>
        </header>

        {/* Desktop */}
        <div className="billing-desktop">
          <table className="billing-table">
            <thead className="billing-table__thead">
              <tr>
                <th>Tenant</th>
                <th>Precio</th>
                <th>Inicio</th>
                <th>Renovación</th>
              </tr>
            </thead>
            <tbody>
              {subsPaged.length === 0 ? (
                <tr><td className="billing-table__empty" colSpan={4}>No hay suscripciones.</td></tr>
              ) : subsPaged.map((s) => (
                <tr key={s._id}>
                  <td className="billing-table__tenant">{s.tenantId}</td>
                  <td>{moneyEUR(s.precioMensual || 0)}</td>
                  <td>{fmtDate(s.fechaInicio)}</td>
                  <td>{fmtDate(s.fechaRenovacion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="billing-mobile">
          {subsPaged.length === 0 ? (
            <p className="billing-table__empty">No hay suscripciones.</p>
          ) : subsPaged.map((s) => (
            <div className="billing-card" key={s._id}>
              <div className="billing-card__row">
                <span className="billing-card__tenant">{s.tenantId}</span>
                <span className="billing-card__amount">{moneyEUR(s.precioMensual || 0)}</span>
              </div>
              <div className="billing-card__meta">
                <span>Inicio: {fmtDate(s.fechaInicio)}</span>
                <span>Renov: {fmtDate(s.fechaRenovacion)}</span>
              </div>
            </div>
          ))}
        </div>

        <Pagination page={subPag} totalPages={subsTotalPages} setPage={setSubPag} />
      </section>
    </section>
  );
}
