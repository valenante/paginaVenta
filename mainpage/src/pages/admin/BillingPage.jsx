import { useCallback, useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiCreditCard, FiRepeat, FiExternalLink, FiRotateCw, FiCornerDownLeft, FiAlertTriangle } from "react-icons/fi";
import api from "../../utils/api";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../context/ToastContext";
import "../../styles/BillingPage.css";

const PAGE_SIZE = 10;

function stripeUrl(path, mode) {
  const base = mode === "test" ? "https://dashboard.stripe.com/test" : "https://dashboard.stripe.com";
  return path ? `${base}/${path}` : base;
}

function moneyEUR(v) { return `${Number(v || 0).toFixed(2)} €`; }

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
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [pagoPag, setPagoPag] = useState(1);
  const [subPag, setSubPag] = useState(1);

  // Refund modal
  const [refundTarget, setRefundTarget] = useState(null); // payment object
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("requested_by_customer");
  const [refundLoading, setRefundLoading] = useState(false);

  // Per-row loading
  const [rowLoading, setRowLoading] = useState(null); // paymentIntentId

  // Churn stats
  const [churnStats, setChurnStats] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/admin/superadminBilling");
      setData(res.data);
    } catch {
      setError("No se pudo cargar la información de facturación.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await api.get("/admin/superadminBilling/churn-overview");
        setChurnStats(d.stats);
      } catch { /* churn stats optional */ }
    })();
  }, []);

  const view = useMemo(() => {
    const safe = data || {};
    return {
      mrr: Number(safe.mrr || 0),
      totalTenants: Number(safe.totalTenants || 0),
      stripeMode: safe.stripeMode || "live",
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

  // ── Refund ──
  const openRefundModal = (p) => {
    setRefundTarget(p);
    setRefundAmount(((p.amount || 0) / 100).toFixed(2));
    setRefundReason("requested_by_customer");
  };

  const submitRefund = async () => {
    if (!refundTarget) return;
    setRefundLoading(true);
    try {
      const body = {
        paymentIntentId: refundTarget.id,
        reason: refundReason,
      };
      const totalEur = (refundTarget.amount || 0) / 100;
      const requestedEur = parseFloat(refundAmount);
      if (requestedEur > 0 && requestedEur < totalEur) {
        body.amount = requestedEur; // partial
      }
      await api.post("/admin/superadminBilling/refund", body);
      showToast("Reembolso procesado correctamente", "exito");
      setRefundTarget(null);
      await fetchData();
    } catch (err) {
      showToast(err?.response?.data?.error || "Error procesando reembolso", "error");
    } finally {
      setRefundLoading(false);
    }
  };

  // ── Retry ──
  const retryPayment = async (p) => {
    setRowLoading(p.id);
    try {
      const invoiceId = p.invoice;
      if (!invoiceId) {
        showToast("Este pago no tiene invoice asociada para reintentar", "aviso");
        return;
      }
      await api.post("/admin/superadminBilling/retry", { invoiceId });
      showToast("Cobro reintentado correctamente", "exito");
      await fetchData();
    } catch (err) {
      showToast(err?.response?.data?.error || "Error reintentando cobro", "error");
    } finally {
      setRowLoading(null);
    }
  };

  if (loading) return <p className="billing-state billing-state--loading">Cargando datos...</p>;
  if (error) return <p className="billing-state billing-state--error">{error}</p>;
  if (!data) return <p className="billing-state billing-state--error">No hay datos.</p>;

  const pStatus = (s) => String(s || "").toLowerCase();

  return (
    <section className="billing">
      <header className="billing__header">
        <div>
          <h1 className="billing__title">Facturación</h1>
          <p className="billing__subtitle">Ingresos, pagos, suscripciones y riesgo de churn.</p>
        </div>
        <a href={stripeUrl("", view.stripeMode)} target="_blank" rel="noopener noreferrer" className="billing__stripe-btn">
          <FiExternalLink /> Stripe Dashboard
        </a>
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
        {churnStats && (
          <>
            <article className="billing-kpi billing-kpi--warn">
              <div className="billing-kpi__label">En riesgo</div>
              <div className="billing-kpi__value">{churnStats.atRisk}</div>
              <div className="billing-kpi__hint">Tenants en riesgo de churn</div>
            </article>
            <article className="billing-kpi billing-kpi--danger">
              <div className="billing-kpi__label">Past due</div>
              <div className="billing-kpi__value">{churnStats.pastDue}</div>
              <div className="billing-kpi__hint">Pagos fallidos</div>
            </article>
          </>
        )}
      </div>

      {/* ── Pagos ── */}
      <section className="billing-block">
        <header className="billing-block__header">
          <h2 className="billing-block__title">Últimos pagos</h2>
          <span className="billing-block__count">{view.pagos.length}</span>
        </header>

        <div className="billing-desktop">
          <table className="billing-table">
            <thead className="billing-table__thead">
              <tr>
                <th>Monto</th>
                <th>Estado</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagosPaged.length === 0 ? (
                <tr><td colSpan={5}><EmptyState icon={FiCreditCard} title="Sin pagos recientes" description="Los pagos aparecerán aquí cuando se procesen." /></td></tr>
              ) : pagosPaged.map((p) => (
                <tr key={p.id} className={rowLoading === p.id ? "billing-table__row--loading" : ""}>
                  <td>{moneyEUR((p.amount || 0) / 100)}</td>
                  <td><StatusPill status={p.status} /></td>
                  <td className="billing-table__customer">{p.customer || "—"}</td>
                  <td>{fmtDateTime(p.created)}</td>
                  <td className="billing-table__actions">
                    <a href={stripeUrl(`payments/${p.id}`, view.stripeMode)} target="_blank" rel="noopener noreferrer" className="billing-stripe-link" title="Ver en Stripe">
                      <FiExternalLink />
                    </a>
                    {pStatus(p.status) === "succeeded" && (
                      <button
                        className="billing-action-btn billing-action-btn--refund"
                        onClick={() => openRefundModal(p)}
                        title="Reembolsar"
                        disabled={rowLoading === p.id}
                      >
                        <FiCornerDownLeft /> Reembolsar
                      </button>
                    )}
                    {(pStatus(p.status) === "requires_payment_method" || pStatus(p.status) === "requires_confirmation") && p.invoice && (
                      <button
                        className="billing-action-btn billing-action-btn--retry"
                        onClick={() => retryPayment(p)}
                        title="Reintentar cobro"
                        disabled={rowLoading === p.id}
                      >
                        <FiRotateCw /> {rowLoading === p.id ? "..." : "Reintentar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="billing-mobile">
          {pagosPaged.length === 0 ? (
            <EmptyState icon={FiCreditCard} title="Sin pagos recientes" description="Los pagos aparecerán aquí." />
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
              <div className="billing-card__actions">
                {pStatus(p.status) === "succeeded" && (
                  <button className="billing-action-btn billing-action-btn--refund" onClick={() => openRefundModal(p)}>
                    <FiCornerDownLeft /> Reembolsar
                  </button>
                )}
                {(pStatus(p.status) === "requires_payment_method" || pStatus(p.status) === "requires_confirmation") && p.invoice && (
                  <button className="billing-action-btn billing-action-btn--retry" onClick={() => retryPayment(p)} disabled={rowLoading === p.id}>
                    <FiRotateCw /> Reintentar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Pagination page={pagoPag} totalPages={pagosTotalPages} setPage={setPagoPag} />
      </section>

      {/* ── Suscripciones ── */}
      <section className="billing-block">
        <header className="billing-block__header">
          <h2 className="billing-block__title">Suscripciones</h2>
          <span className="billing-block__count">{view.suscripciones.length}</span>
        </header>

        <div className="billing-desktop">
          <table className="billing-table">
            <thead className="billing-table__thead">
              <tr>
                <th>Tenant</th>
                <th>Precio</th>
                <th>Inicio</th>
                <th>Renovación</th>
                <th>Stripe</th>
              </tr>
            </thead>
            <tbody>
              {subsPaged.length === 0 ? (
                <tr><td colSpan={5}><EmptyState icon={FiRepeat} title="Sin suscripciones activas" description="Las suscripciones se mostrarán aquí." /></td></tr>
              ) : subsPaged.map((s) => (
                <tr key={s._id}>
                  <td className="billing-table__tenant">{s.tenantId}</td>
                  <td>{moneyEUR(s.precioMensual || 0)}</td>
                  <td>{fmtDate(s.fechaInicio)}</td>
                  <td>{fmtDate(s.fechaRenovacion)}</td>
                  <td>
                    {s.stripeSubscriptionId ? (
                      <a href={stripeUrl(`subscriptions/${s.stripeSubscriptionId}`, view.stripeMode)} target="_blank" rel="noopener noreferrer" className="billing-stripe-link" title="Ver en Stripe">
                        <FiExternalLink />
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="billing-mobile">
          {subsPaged.length === 0 ? (
            <EmptyState icon={FiRepeat} title="Sin suscripciones" description="Las suscripciones aparecerán aquí." />
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

      {/* ── Refund Modal ── */}
      {refundTarget && (
        <div className="billing-modal-overlay" onClick={() => !refundLoading && setRefundTarget(null)}>
          <div className="billing-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="billing-modal__title">Reembolsar pago</h3>
            <p className="billing-modal__info">
              Pago: <strong>{moneyEUR((refundTarget.amount || 0) / 100)}</strong> — {refundTarget.customer || "—"}
            </p>

            <label className="billing-modal__label">
              Monto a reembolsar (€)
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={((refundTarget.amount || 0) / 100).toFixed(2)}
                className="billing-modal__input"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                disabled={refundLoading}
              />
              <small className="billing-modal__hint">Deja el total para reembolso completo, o reduce para parcial.</small>
            </label>

            <label className="billing-modal__label">
              Motivo
              <select className="billing-modal__input" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} disabled={refundLoading}>
                <option value="requested_by_customer">Solicitado por el cliente</option>
                <option value="duplicate">Pago duplicado</option>
                <option value="fraudulent">Fraudulento</option>
              </select>
            </label>

            <div className="billing-modal__actions">
              <button className="billing-modal__btn billing-modal__btn--cancel" onClick={() => setRefundTarget(null)} disabled={refundLoading}>
                Cancelar
              </button>
              <button className="billing-modal__btn billing-modal__btn--confirm" onClick={submitRefund} disabled={refundLoading}>
                {refundLoading ? "Procesando..." : "Confirmar reembolso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
