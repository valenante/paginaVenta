import { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import "../../styles/BillingPage.css";

function moneyEUR(centsOrNumber) {
  const n = Number(centsOrNumber || 0);
  // si viene en euros ya, no pasa nada (se usa como number)
  return `€ ${n.toFixed(2)}`;
}

function fmtDateTime(tsMsOrSec) {
  if (!tsMsOrSec) return "—";
  const n = Number(tsMsOrSec);
  const ms = n < 10_000_000_000 ? n * 1000 : n; // heurística: sec -> ms
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "—";
  }
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "—";
  }
}

function StatusPill({ status }) {
  const s = String(status || "unknown").toLowerCase();
  const tone =
    s === "succeeded" || s === "paid"
      ? "ok"
      : s === "failed" || s === "canceled"
      ? "bad"
      : "neutral";

  return (
    <span className={`billing-status billing-status--${tone}`} title={status}>
      {status || "—"}
    </span>
  );
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchBilling = async () => {
      try {
        const res = await api.get("/admin/superadminBilling");
        if (!mounted) return;
        setData(res.data);
      } catch (err) {
        console.error("❌ Error billing:", err);
        if (!mounted) return;
        setError("No se pudo cargar la información de facturación.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchBilling();
    return () => {
      mounted = false;
    };
  }, []);

  const view = useMemo(() => {
    const safe = data || {};
    const pagos = Array.isArray(safe.pagos) ? safe.pagos : [];
    const suscripciones = Array.isArray(safe.suscripciones) ? safe.suscripciones : [];

    return {
      mrr: Number(safe.mrr || 0),
      totalTenants: Number(safe.totalTenants || 0),
      pagos,
      suscripciones,
    };
  }, [data]);

  if (loading) return <p className="billing-state billing-state--loading">Cargando datos…</p>;
  if (error) return <p className="billing-state billing-state--error">{error}</p>;
  if (!data) return <p className="billing-state billing-state--error">No hay datos.</p>;

  return (
    <section className="billing">
      <header className="billing__header">
        <h1 className="billing__title">📄 Facturación</h1>
        <p className="billing__subtitle">
          Vista rápida de ingresos recurrentes, pagos recientes y suscripciones activas.
        </p>
      </header>

      {/* KPI */}
      <div className="billing-kpis">
        <article className="billing-kpi">
          <div className="billing-kpi__label">MRR (Mensual)</div>
          <div className="billing-kpi__value">{moneyEUR(view.mrr)}</div>
          <div className="billing-kpi__hint">Ingresos recurrentes estimados</div>
        </article>

        <article className="billing-kpi">
          <div className="billing-kpi__label">Total tenants</div>
          <div className="billing-kpi__value">{view.totalTenants}</div>
          <div className="billing-kpi__hint">Restaurantes / tiendas</div>
        </article>

        <article className="billing-kpi">
          <div className="billing-kpi__label">Suscripciones activas</div>
          <div className="billing-kpi__value">{view.suscripciones.length}</div>
          <div className="billing-kpi__hint">En curso (Stripe + manuales)</div>
        </article>
      </div>

      {/* Pagos */}
      <section className="billing-block">
        <header className="billing-block__header">
          <h2 className="billing-block__title">💳 Últimos pagos Stripe</h2>
        </header>

        <div className="billing-tableWrap">
          <table className="billing-table">
            <thead className="billing-table__thead">
              <tr>
                <th>Monto</th>
                <th>Estado</th>
                <th>Cliente</th>
                <th>Fecha</th>
              </tr>
            </thead>

            <tbody className="billing-table__tbody">
              {view.pagos.length === 0 ? (
                <tr>
                  <td className="billing-table__empty" colSpan={4}>
                    No hay pagos recientes.
                  </td>
                </tr>
              ) : (
                view.pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td data-label="Monto">{moneyEUR((pago.amount || 0) / 100)}</td>
                    <td data-label="Estado">
                      <StatusPill status={pago.status} />
                    </td>
                    <td data-label="Cliente">{pago.customer || "—"}</td>
                    <td data-label="Fecha">{fmtDateTime(pago.created)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Suscripciones */}
      <section className="billing-block">
        <header className="billing-block__header">
          <h2 className="billing-block__title">📦 Suscripciones</h2>
        </header>

        <div className="billing-tableWrap">
          <table className="billing-table">
            <thead className="billing-table__thead">
              <tr>
                <th>Tenant</th>
                <th>Precio mensual</th>
                <th>Inicio</th>
                <th>Renovación</th>
              </tr>
            </thead>

            <tbody className="billing-table__tbody">
              {view.suscripciones.length === 0 ? (
                <tr>
                  <td className="billing-table__empty" colSpan={4}>
                    No hay suscripciones.
                  </td>
                </tr>
              ) : (
                view.suscripciones.map((s) => (
                  <tr key={s._id}>
                    <td data-label="Tenant">{s.tenantId}</td>
                    <td data-label="Precio mensual">{moneyEUR(Number(s.precioMensual || 0))}</td>
                    <td data-label="Inicio">{fmtDate(s.fechaInicio)}</td>
                    <td data-label="Renovación">{fmtDate(s.fechaRenovacion)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}