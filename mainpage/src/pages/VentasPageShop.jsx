// src/pages/VentasPageShop.jsx
import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { VentasProvider, useVentas } from "../context/VentasContext";
import { useTenant } from "../context/TenantContext.jsx"; // ✅ AÑADIR
import "../styles/VentasPageShop.css";

const fmtMoney = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return "-";
  return x.toFixed(2) + " €";
};

const fmtDateTime = (d) => {
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return "-";
  return t.toLocaleString();
};

function VentasPageShopInner() {
  const {
    tenantId,
    ventasPage,
    loading,
    error,
    info,
    lastUpdatedAt,

    filters,
    setQ,
    setDesde,
    setHasta,
    setMetodoPago,
    setCanal,
    setEstado,
    clearFilters,

    metodosDisponibles,
    canalesDisponibles,

    totals,
    refresh,
    exportCsv,

    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
  } = useVentas();

  const meta = useMemo(() => {
    const ts = lastUpdatedAt ? fmtDateTime(lastUpdatedAt) : "—";
    return `Actualizado: ${ts}`;
  }, [lastUpdatedAt]);

  return (
    <div className="shops-page shops-page--ventas">
      <header className="shops-page__header">
        <div className="shops-page__headLeft">
          <h1 className="shops-page__title">Ventas</h1>
          <p className="shops-page__subtitle">
            Tenant: <b>{tenantId}</b>
          </p>

          <div className="shops-page__metaRow">
            <span className="shops-badge">Ventas: {totals.count}</span>
            <span className="shops-badge">Ítems: {totals.items}</span>
            <span className="shops-badge">Total: {fmtMoney(totals.total)}</span>
            <span className="shops-metaText">{meta}</span>
          </div>
        </div>

        <div className="shops-page__actions">
          <button className="btn-ghost" type="button" onClick={refresh} disabled={loading}>
            {loading ? "Cargando..." : "Refrescar"}
          </button>

          <button className="btn-ghost" type="button" onClick={exportCsv} disabled={loading}>
            Exportar CSV
          </button>

          <button
            className="btn-secondary"
            type="button"
            onClick={() => alert("Nueva venta: ve al POS y cobra desde allí.")}
          >
            Nueva venta
          </button>
        </div>
      </header>

      <section className="shops-card shops-card--pad shops-card--glass">
        {/* Filtros */}
        <div className="shops-filters">
          <div className="shops-filters__left">
            <div className="shops-field">
              <label>Buscar</label>
              <input
                value={filters.q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ID, resumen, método, canal..."
              />
            </div>

            <div className="shops-field">
              <label>Desde</label>
              <input type="date" value={filters.desde} onChange={(e) => setDesde(e.target.value)} />
            </div>

            <div className="shops-field">
              <label>Hasta</label>
              <input type="date" value={filters.hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>

            <div className="shops-field">
              <label>Método</label>
              <select value={filters.metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                <option value="todos">Todos</option>
                {metodosDisponibles.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="shops-field">
              <label>Canal</label>
              <select value={filters.canal} onChange={(e) => setCanal(e.target.value)}>
                <option value="todos">Todos</option>
                {canalesDisponibles.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="shops-field">
              <label>Estado</label>
              <select value={filters.estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="emitida">emitida</option>
                <option value="anulada">anulada</option>
              </select>
            </div>
          </div>

          <div className="shops-filters__right">
            <button className="btn-ghost" type="button" onClick={clearFilters} disabled={loading}>
              Limpiar filtros
            </button>

            <div className="shops-field shops-field--small">
              <label>Por página</label>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value) || 25)}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {error && <div className="shops-alert shops-alert--error">❌ {error}</div>}
        {!error && info && <div className="shops-alert shops-alert--info">{info}</div>}

        {/* Tabla */}
        {!error && !loading && ventasPage.length === 0 ? (
          <div className="shops-empty">
            <div className="shops-empty__title">No hay ventas con estos filtros</div>
            <div className="shops-empty__text">Prueba a limpiar filtros o ampliar el rango de fechas.</div>
          </div>
        ) : (
          <div className="shops-tableWrap">
            <table className="shops-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>ID</th>
                  <th>Resumen</th>
                  <th>Método</th>
                  <th>Canal</th>
                  <th>Estado</th>
                  <th className="t-right">Ítems</th>
                  <th className="t-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {ventasPage.map((v) => (
                  <tr key={v.id}>
                    <td>{fmtDateTime(v.fecha)}</td>
                    <td className="mono">{v.id?.slice?.(-8) || v.id}</td>
                    <td title={v.resumen}>{v.resumen}</td>
                    <td>{v.metodoPago}</td>
                    <td>{v.canal}</td>
                    <td>
                      <span className={`shops-pill ${v.estado === "anulada" ? "is-bad" : "is-ok"}`}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="t-right">{v.itemsCount}</td>
                    <td className="t-right">{fmtMoney(v.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        <div className="shops-pager">
          <button className="btn-ghost" disabled={loading || page <= 1} onClick={() => setPage(1)}>
            « Primero
          </button>
          <button className="btn-ghost" disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>
            ‹ Anterior
          </button>

          <span className="shops-pager__info">
            Página <b>{page}</b> / {pageCount}
          </span>

          <button
            className="btn-ghost"
            disabled={loading || page >= pageCount}
            onClick={() => setPage(page + 1)}
          >
            Siguiente ›
          </button>
          <button
            className="btn-ghost"
            disabled={loading || page >= pageCount}
            onClick={() => setPage(pageCount)}
          >
            Último »
          </button>
        </div>
      </section>
    </div>
  );
}

export default function VentasPageShop() {
  const { tenantId: tenantIdParam } = useParams();
  const { tenantId: tenantIdCtx } = useTenant();

  const tenantId = tenantIdParam || tenantIdCtx;

  if (!tenantId) {
    return <div style={{ padding: 16 }}>❌ No hay tenantId (ni en URL ni en TenantContext)</div>;
  }

  return (
    <VentasProvider tenantId={tenantId} defaultPageSize={25}>
      <VentasPageShopInner />
    </VentasProvider>
  );
}
