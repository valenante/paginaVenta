import React, { useState } from "react";

const fmtMoney = (n) => `${Number(n || 0).toFixed(2).replace(".", ",")} €`;
const fmtMonthYear = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es", { month: "short", year: "numeric" });
};
const fmtDateLong = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};
const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
};
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

// ── KPIs compactos para el hero ───────────────────────────────────────────────
export function HeaderKPIs({ stats }) {
  if (!stats || stats.visitas === 0) return null;
  const items = [
    { icon: "🍽️", label: stats.visitas === 1 ? "visita" : "visitas", value: stats.visitas },
    stats.diaFavorito && { icon: "🗓️", label: "favorito", value: cap(stats.diaFavorito) },
    stats.horaFavorita && { icon: "⏰", label: "hora", value: stats.horaFavorita },
    stats.comensalesPromedio > 0 && {
      icon: "👥",
      label: "mesa",
      value: `${stats.comensalesPromedio}p`,
    },
    stats.primeraVisita && { icon: "📅", label: "desde", value: cap(fmtMonthYear(stats.primeraVisita)) },
  ].filter(Boolean);
  return (
    <div className="cli-hero-kpis">
      {items.map((it, i) => (
        <div key={i} className="cli-hero-kpi">
          <span className="cli-hero-kpi__icon" aria-hidden="true">{it.icon}</span>
          <span className="cli-hero-kpi__value">{it.value}</span>
          <span className="cli-hero-kpi__label">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Banner ancho con progreso a próxima recompensa ───────────────────────────
export function ProximaRecompensaBanner({ proxima, saldo }) {
  if (!proxima) return null;
  return (
    <div className="cli-proxima">
      <div className="cli-proxima__head">
        <span className="cli-proxima__icon" aria-hidden="true">🎯</span>
        <div className="cli-proxima__text">
          <div className="cli-proxima__title">
            A {proxima.puntosFaltantes.toLocaleString("es")} pts de <strong>{proxima.nombre}</strong>
          </div>
          <div className="cli-proxima__sub">
            {saldo.toLocaleString("es")} / {proxima.coste.toLocaleString("es")} pts
          </div>
        </div>
        <div className="cli-proxima__pct">{proxima.porcentaje}%</div>
      </div>
      <div className="cli-proxima__bar">
        <div
          className="cli-proxima__fill"
          style={{ width: `${proxima.porcentaje}%` }}
          role="progressbar"
          aria-valuenow={proxima.porcentaje}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

// ── Tarjeta cliente: última visita + favoritos lado a lado ───────────────────
function UltimaVisitaPanel({ visita }) {
  if (!visita) return null;
  const items = visita.itemsSnapshot || [];
  const recompensa = visita.loyalty?.recompensaAplicada;
  const tieneRecompensa = recompensa && recompensa.recompensaId;
  return (
    <article className="cli-panel cli-panel--ultima">
      <header className="cli-panel__head">
        <h3>🕒 Tu última visita</h3>
        <span className="cli-panel__sub">{cap(fmtDateLong(visita.cierre))} · {fmtTime(visita.cierre)}</span>
      </header>
      <div className="cli-ultima-meta">
        <span className="cli-ultima-meta__chip">Mesa {visita.numero}</span>
        {visita.comensales > 0 && (
          <span className="cli-ultima-meta__chip">
            👥 {visita.comensales} {visita.comensales === 1 ? "persona" : "personas"}
          </span>
        )}
        {visita.camarero && <span className="cli-ultima-meta__chip">{visita.camarero}</span>}
      </div>
      <div className="cli-ultima-cifras">
        <div className="cli-ultima-cifras__total">
          <span className="cli-ultima-cifras__num">{fmtMoney(visita.total)}</span>
          {visita.descuentoAplicado > 0 && (
            <span className="cli-ultima-cifras__desc">
              <s>{fmtMoney(visita.totalBruto || visita.total)}</s>
              {" "}−{fmtMoney(visita.descuentoAplicado)}
            </span>
          )}
        </div>
        {visita.loyalty?.puntosAcumulados > 0 && (
          <div className="cli-ultima-cifras__pts">
            +{visita.loyalty.puntosAcumulados.toLocaleString("es")} pts
            {visita.loyalty.multiplicador > 1 && (
              <span className="cli-ultima-cifras__mult"> · ×{visita.loyalty.multiplicador}</span>
            )}
          </div>
        )}
      </div>
      {items.length > 0 && (
        <ul className="cli-ultima-items">
          {items.map((it, i) => (
            <li key={it._id || i} className="cli-ultima-items__row">
              <span className="cli-ultima-items__cant">×{it.cantidad}</span>
              <span className="cli-ultima-items__nombre">{it.nombre}</span>
              <span className="cli-ultima-items__precio">{fmtMoney(it.precio * it.cantidad)}</span>
            </li>
          ))}
        </ul>
      )}
      {tieneRecompensa && (
        <div className="cli-ultima-recompensa">
          🎁 Aplicaste <strong>{recompensa.nombre}</strong>
          {recompensa.descuento > 0 && ` (−${fmtMoney(recompensa.descuento)})`}
        </div>
      )}
    </article>
  );
}

function FavoritosPanel({ favoritos }) {
  if (!favoritos || favoritos.length === 0) return null;
  const max = favoritos[0]?.veces || 1;
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <article className="cli-panel cli-panel--favoritos">
      <header className="cli-panel__head">
        <h3>⭐ Tus favoritos aquí</h3>
        <span className="cli-panel__sub">Lo que más has pedido.</span>
      </header>
      <ol className="cli-favoritos-list">
        {favoritos.map((f, i) => (
          <li key={f.nombre} className="cli-favorito">
            <div className="cli-favorito__rank">{medals[i] || `${i + 1}º`}</div>
            <div className="cli-favorito__main">
              <div className="cli-favorito__nombre">{f.nombre}</div>
              <div className="cli-favorito__bar">
                <div
                  className="cli-favorito__fill"
                  style={{ width: `${(f.veces / max) * 100}%` }}
                />
              </div>
            </div>
            <div className="cli-favorito__veces">
              <strong>{f.veces}</strong>
              <span> {f.veces === 1 ? "vez" : "veces"}</span>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function TarjetaCliente({ resumen }) {
  if (!resumen || resumen.stats?.visitas === 0) {
    return (
      <div className="cliente-empty cliente-empty--small">
        <p>Aún no has visitado este restaurante. Cuando vayas y te identifiques al cobrar, aquí verás tus visitas, productos favoritos y más.</p>
      </div>
    );
  }
  return (
    <div className="cli-expediente-grid">
      <UltimaVisitaPanel visita={resumen.ultimaVisita} />
      <FavoritosPanel favoritos={resumen.favoritos} />
    </div>
  );
}

// ── Timeline expandible ──────────────────────────────────────────────────────
export function TimelineVisitas({ items, total, loading, hasMore, onLoadMore }) {
  const [openId, setOpenId] = useState(null);
  if (!loading && (!items || items.length === 0)) return null;
  return (
    <section className="cliente-section">
      <div className="cliente-section__header">
        <div>
          <h2>📒 Todas tus visitas</h2>
          <p className="cliente-section__sub">
            {total} {total === 1 ? "visita" : "visitas"} en este restaurante.
          </p>
        </div>
      </div>
      <ul className="cli-timeline">
        {items.map((v) => {
          const open = openId === v._id;
          return (
            <li key={v._id} className={`cli-timeline-item ${open ? "is-open" : ""}`}>
              <button
                type="button"
                className="cli-timeline-row"
                onClick={() => setOpenId(open ? null : v._id)}
                aria-expanded={open}
              >
                <span className="cli-timeline-row__fecha">
                  {cap(fmtDateLong(v.cierre))} · {fmtTime(v.cierre)}
                </span>
                <span className="cli-timeline-row__meta">
                  Mesa {v.numero}
                  {v.comensales > 0 && ` · ${v.comensales}p`}
                </span>
                <span className="cli-timeline-row__total">{fmtMoney(v.total)}</span>
                {v.loyalty?.puntosAcumulados > 0 && (
                  <span className="cli-timeline-row__pts">
                    +{v.loyalty.puntosAcumulados} pts
                  </span>
                )}
                <span className="cli-timeline-row__caret" aria-hidden="true">
                  {open ? "▾" : "▸"}
                </span>
              </button>
              {open && (
                <div className="cli-timeline-detalle">
                  {(v.itemsSnapshot || []).map((it, i) => (
                    <div key={it._id || i} className="cli-timeline-item-row">
                      <span>×{it.cantidad}</span>
                      <span className="cli-timeline-item-row__nombre">{it.nombre}</span>
                      <span>{fmtMoney(it.precio * it.cantidad)}</span>
                    </div>
                  ))}
                  {v.loyalty?.recompensaAplicada?.recompensaId && (
                    <div className="cli-timeline-recompensa">
                      🎁 {v.loyalty.recompensaAplicada.nombre}
                      {v.loyalty.recompensaAplicada.descuento > 0 &&
                        ` · −${fmtMoney(v.loyalty.recompensaAplicada.descuento)}`}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <div className="cli-timeline-more">
          <button
            type="button"
            className="cliente-btn cliente-btn--ghost"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? "Cargando…" : "Ver más visitas"}
          </button>
        </div>
      )}
    </section>
  );
}
