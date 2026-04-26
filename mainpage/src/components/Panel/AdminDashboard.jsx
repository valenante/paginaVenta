// src/components/Panel/AdminDashboard.jsx
import React, { useState, useMemo } from "react";
import { useAdminDashboard } from "../../hooks/useAdminDashboard";
import { useFeature } from "../../Hooks/useFeature";
import { ComparativaCard, RatioTipoCard, VentasPorHoraCard } from "./AnalyticsFase2";
import { CorrelacionCard, AlertasCard } from "./AnalyticsFase3";
import UpsellEstadisticasPro from "../Estadisticas/UpsellEstadisticasPro";
import "./AdminDashboard.css";

const fmt = (v) => Number(v || 0).toFixed(2);
const fmtHora = (d) => {
  if (!d) return "--";
  try {
    return new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  } catch { return "--"; }
};

// Día operativo: corte 04:00 Madrid = 02:00 UTC
// Si son las 00:00-02:00 UTC, pertenece al día operativo anterior
function fechaOperativaHoy() {
  const ahora = new Date();
  const d = new Date(ahora);
  if (ahora.getUTCHours() < 2) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function fmtFechaLabel(fechaStr) {
  try {
    const [y, m, day] = fechaStr.split("-").map(Number);
    const d = new Date(y, m - 1, day);
    return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  } catch { return fechaStr; }
}

export default function AdminDashboard() {
  const hoy = useMemo(() => fechaOperativaHoy(), []);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const esHoy = fechaSeleccionada === hoy;
  const isPremium = useFeature("estadisticas_avanzadas");

  // Siempre pasamos la fecha operativa al backend para garantizar filtro correcto
  const { loading, error, data, refresh } = useAdminDashboard(fechaSeleccionada);
  const [modal, setModal] = useState(null); // "stock" | "reservas" | "eliminaciones" | null
  const [topTab, setTopTab] = useState("plato"); // "plato" | "bebida"
  const [topSort, setTopSort] = useState("cantidad"); // "cantidad" | "importe"

  const { resumen, caja, topProductos, staff, eliminaciones, reservas } = data;

  const elimItems = Array.isArray(eliminaciones?.items) ? eliminaciones.items : Array.isArray(eliminaciones) ? eliminaciones : [];
  const reservasList = Array.isArray(reservas?.items) ? reservas.items : Array.isArray(reservas) ? reservas : [];
  const staffList = Array.isArray(staff?.items) ? staff.items : Array.isArray(staff) ? staff : [];
  const topItemsAll = topProductos?.items || topProductos || [];
  const topItems = Array.isArray(topItemsAll)
    ? topItemsAll
        .filter((p) => (p.tipo || "plato") === topTab)
        .sort((a, b) => topSort === "importe"
          ? (b.ingresos || b.total || 0) - (a.ingresos || a.total || 0)
          : (b.cantidad || 0) - (a.cantidad || 0)
        )
        .slice(0, 10)
    : [];

  if (loading && !resumen) {
    return <div className="adm-loading">Cargando panel operativo...</div>;
  }

  if (error) {
    return (
      <div className="adm-error">
        <p>{error}</p>
        <button onClick={refresh}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="adm">
      {/* ── Header con selector de fecha ── */}
      <header className="adm__header">
        <div className="adm__header-info">
          <span className="adm__header-title">{fmtFechaLabel(fechaSeleccionada)}</span>
          {esHoy ? (
            <span className="adm__badge-hoy">HOY</span>
          ) : (
            <span className="adm__badge-past">Día histórico</span>
          )}
        </div>
        <div className="adm__header-controls">
          <input
            type="date"
            className="adm__date"
            value={fechaSeleccionada}
            max={hoy}
            onChange={(e) => setFechaSeleccionada(e.target.value || hoy)}
          />
          {!esHoy && (
            <button className="adm__btn-hoy" onClick={() => setFechaSeleccionada(hoy)}>
              Hoy
            </button>
          )}
        </div>
      </header>

      {/* ── KPIs principales ── */}
      <div className="adm__kpis">
        <div className="adm__kpi adm__kpi--total">
          <span className="adm__kpi-value">{fmt(caja?.totalRealizado)} €</span>
          <span className="adm__kpi-label">Total realizado</span>
        </div>
        <div className="adm__kpi adm__kpi--cobrado">
          <span className="adm__kpi-value">{fmt(caja?.cobrado)} €</span>
          <span className="adm__kpi-label">Cobrado</span>
        </div>
        <div className="adm__kpi adm__kpi--mesas">
          <span className="adm__kpi-value">{(caja?.mesasCerradas ?? 0) + (caja?.mesasAbiertas ?? 0)}</span>
          <span className="adm__kpi-label">Mesas del día{esHoy && caja?.mesasAbiertas > 0 ? ` (${caja.mesasAbiertas} abiertas)` : ""}</span>
        </div>
        {esHoy && caja?.mesasAbiertas > 0 && (
          <div className="adm__kpi adm__kpi--mesas">
            <span className="adm__kpi-value">{fmt(caja?.enMesasAbiertas)} €</span>
            <span className="adm__kpi-label">En mesas abiertas</span>
          </div>
        )}
        <div className="adm__kpi adm__kpi--comensales">
          <span className="adm__kpi-value">{resumen?.comensalesHoy ?? "--"}</span>
          <span className="adm__kpi-label">Comensales hoy</span>
        </div>
        <div className="adm__kpi adm__kpi--ticket">
          <span className="adm__kpi-value">{fmt(resumen?.ticketMedioMesa)} €</span>
          <span className="adm__kpi-label">Ticket medio / mesa</span>
        </div>
        <div className="adm__kpi adm__kpi--ticket-com">
          <span className="adm__kpi-value">{fmt(resumen?.ticketMedioComensal)} €</span>
          <span className="adm__kpi-label">Ticket medio / comensal</span>
        </div>
        <div className="adm__kpi adm__kpi--pedidos">
          <span className="adm__kpi-value">{resumen?.pedidosHoy ?? 0}</span>
          <span className="adm__kpi-label">Pedidos</span>
        </div>
        <button className="adm__kpi adm__kpi--cancelados" onClick={() => setModal("eliminaciones")}>
          <span className="adm__kpi-value">{elimItems.length}</span>
          <span className="adm__kpi-label">Cancelados</span>
        </button>
        {resumen?.duracionMediaMin != null && (
          <div className="adm__kpi adm__kpi--duracion">
            <span className="adm__kpi-value">
              {resumen.duracionMediaMin >= 60
                ? `${Math.floor(resumen.duracionMediaMin / 60)}h ${resumen.duracionMediaMin % 60}m`
                : `${resumen.duracionMediaMin} min`}
            </span>
            <span className="adm__kpi-label">Tiempo medio / mesa</span>
          </div>
        )}
      </div>

      {/* ── Tarjetas secundarias (clickables) ── */}
      <div className="adm__cards">
        {esHoy && (
          <button className="adm__card" onClick={() => setModal("reservas")}>
            <span className="adm__card-icon">📅</span>
            <span className="adm__card-value">{resumen?.reservasHoy ?? 0}</span>
            <span className="adm__card-label">Reservas</span>
          </button>
        )}
        {esHoy && (
          <button className="adm__card" onClick={() => setModal("stock")}>
            <span className="adm__card-icon">📦</span>
            <span className="adm__card-value">{resumen?.stockBajo ?? 0}</span>
            <span className="adm__card-label">Stock bajo</span>
          </button>
        )}
      </div>

      {/* ── Desglose + Top productos (2 columnas) ── */}
      <div className="adm__row">
        <section className="adm__section">
          <h3 className="adm__section-title">Desglose de cobro</h3>
          <div className="adm__desglose">
            <div className="adm__desglose-row">
              <span>Efectivo</span>
              <span>{fmt(caja?.ventasEfectivo)} €</span>
            </div>
            <div className="adm__desglose-row">
              <span>Tarjeta</span>
              <span>{fmt(caja?.ventasTarjeta)} €</span>
            </div>
            <div className="adm__desglose-row">
              <span>Propinas</span>
              <span>{fmt(caja?.propinas)} €</span>
            </div>
            <div className="adm__desglose-row adm__desglose-row--total">
              <span>Cobrado</span>
              <span>{fmt(caja?.cobrado)} €</span>
            </div>
          </div>
        </section>

        <section className="adm__section">
          <div className="adm__section-title">
            <span>Top productos</span>
            <div className="adm__tabs">
              <button
                className={`adm__tab ${topTab === "plato" ? "adm__tab--active" : ""}`}
                onClick={() => setTopTab("plato")}
              >
                🍽 Platos
              </button>
              <button
                className={`adm__tab ${topTab === "bebida" ? "adm__tab--active" : ""}`}
                onClick={() => setTopTab("bebida")}
              >
                🍺 Bebidas
              </button>
              <span className="adm__tabs-sep">|</span>
              <button
                className={`adm__tab ${topSort === "cantidad" ? "adm__tab--active" : ""}`}
                onClick={() => setTopSort("cantidad")}
              >
                Cantidad
              </button>
              <button
                className={`adm__tab ${topSort === "importe" ? "adm__tab--active" : ""}`}
                onClick={() => setTopSort("importe")}
              >
                Importe
              </button>
            </div>
          </div>
          <div className="adm__top">
            {topItems.length > 0 ? (
              topItems.map((p, i) => (
                <div key={i} className="adm__top-row">
                  <span className="adm__top-pos">{i + 1}</span>
                  <span className="adm__top-name">{p.nombre}</span>
                  <span className="adm__top-qty">{p.cantidad}u</span>
                  <span className="adm__top-amt">{fmt(p.ingresos || p.total)} €</span>
                </div>
              ))
            ) : (
              <p className="adm__empty">Sin datos de {topTab === "plato" ? "platos" : "bebidas"}</p>
            )}
          </div>
        </section>
      </div>

      {/* ── Fila: Ticket por comensales + Camareros (Premium) ── */}
      {isPremium && (
      <div className="adm__row adm__row--half">
        {resumen?.ticketPorComensales?.length > 0 && (
          <section className="adm__section">
            <h3 className="adm__section-title">Ticket por comensales</h3>
            <div className="adm__staff">
              <div className="adm__staff-head">
                <span>Comensales</span>
                <span>Mesas</span>
                <span>Ticket / mesa</span>
                <span>Ticket / persona</span>
              </div>
              {resumen.ticketPorComensales.map((b) => (
                <div key={b.rango} className="adm__staff-row">
                  <span className="adm__staff-name">{b.rango}</span>
                  <span>{b.mesas}</span>
                  <span className="adm__staff-amt">{fmt(b.ticketMedioMesa)} €</span>
                  <span className="adm__staff-amt">{fmt(b.ticketMedioComensal)} €</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="adm__section">
          <h3 className="adm__section-title">Camareros hoy</h3>
          {staffList.length > 0 ? (
            <div className="adm__staff">
              <div className="adm__staff-head">
                <span>Nombre</span>
                <span>Pedidos</span>
                <span>Productos</span>
                <span>Importe</span>
              </div>
              {staffList.map((s, i) => (
                <div key={i} className="adm__staff-row">
                  <span className="adm__staff-name">{s.nombre}</span>
                  <span>{s.totalPedidos}</span>
                  <span>{s.totalProductos}</span>
                  <span className="adm__staff-amt">{fmt(s.totalImporte)} €</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="adm__empty">Sin actividad de camareros hoy</p>
          )}
        </section>
      </div>
      )}

      {/* ── Rotación de mesas + Cancelaciones (side by side) ── */}
      <div className="adm__row adm__row--half">
        {isPremium && resumen?.rotacionMesas?.length > 0 && (
          <section className="adm__section">
            <h3 className="adm__section-title">Rotación de mesas</h3>
            <div className="adm__staff">
              <div className="adm__staff-head adm__staff-head--5col">
                <span>Mesa</span>
                <span>Rot.</span>
                <span>Ingresos</span>
                <span>Ticket</span>
                <span>Tiempo</span>
              </div>
              {resumen.rotacionMesas.slice(0, 10).map((m) => (
                <div key={m.numero} className="adm__staff-row adm__staff-row--5col">
                  <span className="adm__staff-name">Mesa {m.numero}</span>
                  <span>{m.rotaciones}</span>
                  <span className="adm__staff-amt">{fmt(m.totalVentas)} €</span>
                  <span>{fmt(m.ticketMedio)} €</span>
                  <span>{m.duracionMediaMin ? `${m.duracionMediaMin}m` : "—"}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="adm__section">
          <h3 className="adm__section-title">
            Últimas cancelaciones
            {elimItems.length > 0 && (
              <button className="adm__section-link" onClick={() => setModal("eliminaciones")}>
                Ver todas ({elimItems.length})
              </button>
            )}
          </h3>
          {elimItems.length > 0 ? (
            <div className="adm__elim">
              {elimItems.slice(0, 5).map((e, i) => (
                <div key={i} className="adm__elim-row">
                  <span className="adm__elim-name">{e.producto?.nombre || "Producto"}</span>
                  <span className="adm__elim-mesa">Mesa {e.mesa?.numero ?? "--"}</span>
                  <span className="adm__elim-who">{e.nombreUsuario || "--"}</span>
                  <span className="adm__elim-time">{fmtHora(e.fecha)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="adm__empty">Sin cancelaciones hoy</p>
          )}
        </section>
      </div>

      {/* ── ANALYTICS (Premium) ── */}
      {isPremium ? (
        <>
          <div className="adm__analytics-grid">
            <ComparativaCard fecha={fechaSeleccionada} />
            <RatioTipoCard fecha={fechaSeleccionada} />
          </div>
          <VentasPorHoraCard fecha={fechaSeleccionada} />
          <AlertasCard />
          <CorrelacionCard />
        </>
      ) : (
        <UpsellEstadisticasPro />
      )}

      {/* ── MODALES ── */}
      {modal === "stock" && (
        <div className="adm__overlay" onClick={() => setModal(null)}>
          <div className="adm__modal" onClick={(e) => e.stopPropagation()}>
            <header className="adm__modal-header">
              <h3>Stock bajo</h3>
              <button onClick={() => setModal(null)}>✕</button>
            </header>
            <div className="adm__modal-body">
              {(resumen?.stockBajoItems || []).length > 0 ? (
                <div className="adm__modal-list">
                  <div className="adm__modal-list-head">
                    <span>Ingrediente</span>
                    <span>Actual</span>
                    <span>Mínimo</span>
                  </div>
                  {resumen.stockBajoItems.map((item, i) => (
                    <div key={i} className="adm__modal-list-row">
                      <span>{item.nombre}</span>
                      <span className="adm__modal-danger">{item.actual}</span>
                      <span>{item.minimo}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="adm__empty">No hay ingredientes con stock bajo</p>
              )}
            </div>
          </div>
        </div>
      )}

      {modal === "reservas" && (
        <div className="adm__overlay" onClick={() => setModal(null)}>
          <div className="adm__modal adm__modal--reservas" onClick={(e) => e.stopPropagation()}>
            <header className="adm__modal-header">
              <h3>Reservas de hoy</h3>
              <button onClick={() => setModal(null)}>✕</button>
            </header>
            <div className="adm__modal-body">
              {reservasList.length > 0 ? (
                <div className="adm__modal-list">
                  <div className="adm__modal-list-head">
                    <span>Hora</span>
                    <span>Nombre</span>
                    <span>Personas</span>
                    <span>Estado</span>
                  </div>
                  {reservasList.map((r, i) => (
                    <div key={i} className="adm__modal-list-row">
                      <span>{fmtHora(r.hora || r.fecha)}</span>
                      <span>{r.nombre || r.cliente?.nombre || "--"}</span>
                      <span>{r.comensales || r.personas || "--"}</span>
                      <span className={`adm__badge adm__badge--${r.estado}`}>{r.estado}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="adm__empty">No hay reservas para hoy</p>
              )}
            </div>
          </div>
        </div>
      )}

      {modal === "eliminaciones" && (
        <div className="adm__overlay" onClick={() => setModal(null)}>
          <div className="adm__modal adm__modal--wide" onClick={(e) => e.stopPropagation()}>
            <header className="adm__modal-header">
              <h3>Productos cancelados hoy ({elimItems.length})</h3>
              <button onClick={() => setModal(null)}>✕</button>
            </header>
            <div className="adm__modal-body">
              {elimItems.length > 0 ? (
                <div className="adm__modal-list">
                  <div className="adm__modal-list-head">
                    <span>Producto</span>
                    <span>Mesa</span>
                    <span>Cant.</span>
                    <span>Quién</span>
                    <span>Hora</span>
                  </div>
                  {elimItems.map((e, i) => (
                    <div key={i} className="adm__modal-list-row">
                      <span>{e.producto?.nombre || "Producto"}</span>
                      <span>{e.mesa?.numero ?? "--"}</span>
                      <span>{e.cantidad || 1}</span>
                      <span>{e.nombreUsuario || "--"}</span>
                      <span>{fmtHora(e.fecha)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="adm__empty">Sin cancelaciones</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
