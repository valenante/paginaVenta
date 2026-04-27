import React, { useEffect, useState } from "react";
import { getLoyaltyClienteDetalle } from "../services/loyaltyAdminService";
import "./ClienteLoyaltyDrawer.css";

const fmtMoney = (n) => `${Number(n || 0).toFixed(2).replace(".", ",")} €`;
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("es") : "—");
const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("es")} ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
};
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");

const NIVELES = {
  nuevo:    { label: "Nuevo",    cls: "nivel-nuevo",    icon: "🌱", desc: "Una sola visita." },
  habitual: { label: "Habitual", cls: "nivel-habitual", icon: "🍽️", desc: "Cliente recurrente." },
  vip:      { label: "VIP",      cls: "nivel-vip",      icon: "⭐", desc: "Alta frecuencia y gasto." },
  dormido:  { label: "Dormido",  cls: "nivel-dormido",  icon: "💤", desc: "Sin visitas en >30 días." },
};

const TIPO_MOV = {
  acumulacion:   { icon: "🛒", label: "Compra",      cls: "mov-acum" },
  canjeo:        { icon: "🎁", label: "Canjeo",      cls: "mov-canj" },
  ajuste_manual: { icon: "✏️", label: "Ajuste",      cls: "mov-ajus" },
  caducidad:     { icon: "⏳", label: "Caducidad",   cls: "mov-cad"  },
};

export default function ClienteLoyaltyDrawer({ clienteId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clienteId) return;
    setLoading(true); setError(null);
    (async () => {
      try {
        const d = await getLoyaltyClienteDetalle(clienteId);
        setData(d);
      } catch (err) {
        setError(err?.response?.data?.message || "No se pudo cargar el cliente.");
      } finally { setLoading(false); }
    })();
  }, [clienteId]);

  // ESC para cerrar
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!clienteId) return null;

  return (
    <div className="cld-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <aside className="cld-drawer" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cld-close" onClick={onClose} aria-label="Cerrar">×</button>

        {loading && <div className="cld-loading">Cargando cliente…</div>}
        {error && <div className="cld-error">⚠️ {error}</div>}

        {data && <DetalleCliente data={data} />}
      </aside>
    </div>
  );
}

function DetalleCliente({ data }) {
  const { cliente, saldo, resumen, visitasRecientes, movimientos } = data;
  const stats = resumen?.stats;
  const nivel = NIVELES[stats?.nivel || "nuevo"];
  const iniciales = (cliente.nombre || "?").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      {/* Header con avatar, datos básicos y badge de nivel */}
      <header className="cld-header">
        <div className="cld-header__top">
          <div className="cld-avatar">
            {cliente.avatarUrl
              ? <img src={cliente.avatarUrl} alt={cliente.nombre} />
              : <span>{iniciales}</span>}
          </div>
          <div className="cld-header__main">
            <h2>{cliente.nombre}</h2>
            <div className="cld-contacto">
              {cliente.email && <span>{cliente.email}</span>}
              {cliente.telefono && <span>·</span>}
              {cliente.telefono && <span>{cliente.telefono}</span>}
            </div>
            <div className="cld-badges">
              <span className={`cld-badge ${nivel.cls}`}>{nivel.label}</span>
              {cliente.estado !== "activo" && (
                <span className="cld-badge cld-badge--error">Bloqueado</span>
              )}
              {cliente.anonimizado && (
                <span className="cld-badge cld-badge--mute">Anonimizado</span>
              )}
            </div>
          </div>
          <div className="cld-saldo">
            <div className="cld-saldo__num">{Number(saldo).toLocaleString("es")}</div>
            <div className="cld-saldo__label">puntos</div>
          </div>
        </div>
      </header>

      {/* Banner de estado: días desde última visita */}
      {stats?.diasDesdeUltima !== null && stats?.visitas > 0 && (
        <div className={`cld-recencia ${stats.diasDesdeUltima > 30 ? "is-alert" : stats.diasDesdeUltima > 14 ? "is-warn" : ""}`}>
          <span className="cld-recencia__dot" aria-hidden="true" />
          {stats.diasDesdeUltima === 0
            ? "Visitó hoy"
            : stats.diasDesdeUltima === 1
            ? "Visitó ayer"
            : stats.diasDesdeUltima <= 30
            ? `Última visita hace ${stats.diasDesdeUltima} días`
            : `Sin visitas hace ${stats.diasDesdeUltima} días`}
          {stats.frecuenciaDias != null && stats.frecuenciaDias > 0 && (
            <span className="cld-recencia__sub"> · viene cada ~{stats.frecuenciaDias} días</span>
          )}
        </div>
      )}

      {/* Stats grid: KPIs principales */}
      {stats?.visitas > 0 ? (
        <section className="cld-section">
          <h3>Estadísticas</h3>
          <div className="cld-stats">
            <Stat label="Visitas"        value={stats.visitas} />
            <Stat label="Gasto total"    value={fmtMoney(stats.gastoTotal)} />
            <Stat label="Ticket medio"   value={fmtMoney(stats.gastoMedio)} />
            <Stat label="Cliente desde"  value={fmtDate(stats.primeraVisita)} />
            <Stat label="Día favorito"   value={cap(stats.diaFavorito)} />
            <Stat label="Hora favorita"  value={stats.horaFavorita || "—"} />
            {stats.comensalesPromedio > 0 && (
              <Stat label="Mesa media" value={`${stats.comensalesPromedio} pers.`} />
            )}
            <Stat label="Puntos ganados" value={Number(stats.puntosGanadosTotal).toLocaleString("es")} />
            {stats.puntosCanjeadosTotal > 0 && (
              <Stat label="Puntos canjeados" value={`${Number(stats.puntosCanjeadosTotal).toLocaleString("es")} (${stats.tasaCanjeo}%)`} />
            )}
          </div>
        </section>
      ) : (
        <section className="cld-section">
          <div className="cld-empty">Sin visitas todavía. Cuando cierre mesa con el cliente vinculado, aquí verás todos los datos.</div>
        </section>
      )}

      {/* Última visita */}
      {resumen?.ultimaVisita && (
        <section className="cld-section">
          <h3>Última visita</h3>
          <UltimaVisita visita={resumen.ultimaVisita} />
        </section>
      )}

      {/* Top favoritos */}
      {resumen?.favoritos?.length > 0 && (
        <section className="cld-section">
          <h3>Productos favoritos</h3>
          <Favoritos favoritos={resumen.favoritos} />
        </section>
      )}

      {/* Visitas recientes (5) */}
      {visitasRecientes?.items?.length > 0 && (
        <section className="cld-section">
          <h3>Últimas visitas <span className="cld-section__sub">({visitasRecientes.total})</span></h3>
          <ul className="cld-visitas">
            {visitasRecientes.items.map((v) => (
              <li key={v._id} className="cld-visita">
                <div className="cld-visita__head">
                  <span className="cld-visita__fecha">{fmtDateTime(v.cierre)}</span>
                  <span className="cld-visita__total">{fmtMoney(v.total)}</span>
                </div>
                <div className="cld-visita__meta">
                  Mesa {v.numero}
                  {v.comensales > 0 && ` · ${v.comensales} pers.`}
                  {v.camarero && ` · ${v.camarero}`}
                  {v.loyalty?.puntosAcumulados > 0 && (
                    <span className="cld-visita__pts"> · +{v.loyalty.puntosAcumulados} pts</span>
                  )}
                  {v.loyalty?.recompensaAplicada?.recompensaId && (
                    <span className="cld-visita__rec"> · {v.loyalty.recompensaAplicada.nombre}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Movimientos de puntos (10) */}
      {movimientos?.items?.length > 0 && (
        <section className="cld-section">
          <h3>Movimientos de puntos</h3>
          <ul className="cld-movs">
            {movimientos.items.map((m) => {
              const t = TIPO_MOV[m.tipo] || { icon: "•", label: m.tipo, cls: "" };
              const pos = m.puntos >= 0;
              return (
                <li key={m._id} className={`cld-mov ${t.cls}`}>
                  <span className="cld-mov__icon">{t.icon}</span>
                  <div className="cld-mov__body">
                    <div className="cld-mov__title">{t.label}{m.nota ? ` · ${m.nota}` : ""}</div>
                    <div className="cld-mov__fecha">{fmtDateTime(m.createdAt)}</div>
                  </div>
                  <div className={`cld-mov__pts ${pos ? "is-pos" : "is-neg"}`}>
                    {pos ? "+" : ""}{Number(m.puntos).toLocaleString("es")}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="cld-stat">
      <div className="cld-stat__label">{label}</div>
      <div className="cld-stat__value">{value}</div>
    </div>
  );
}

function UltimaVisita({ visita }) {
  const items = visita.itemsSnapshot || [];
  const rec = visita.loyalty?.recompensaAplicada;
  return (
    <div className="cld-ultima">
      <div className="cld-ultima__head">
        <div>
          <strong>{fmtDateTime(visita.cierre)}</strong>
          <div className="cld-ultima__meta">
            Mesa {visita.numero}
            {visita.comensales > 0 && ` · ${visita.comensales} pers.`}
            {visita.camarero && ` · ${visita.camarero}`}
          </div>
        </div>
        <div className="cld-ultima__cifras">
          <div className="cld-ultima__total">{fmtMoney(visita.total)}</div>
          {visita.loyalty?.puntosAcumulados > 0 && (
            <div className="cld-ultima__pts">+{visita.loyalty.puntosAcumulados} pts</div>
          )}
        </div>
      </div>
      {items.length > 0 && (
        <ul className="cld-ultima__items">
          {items.map((it, i) => (
            <li key={it._id || i}>
              <span>×{it.cantidad}</span>
              <span className="cld-ultima__item-name">{it.nombre}</span>
              <span>{fmtMoney(it.precio * it.cantidad)}</span>
            </li>
          ))}
        </ul>
      )}
      {rec?.recompensaId && (
        <div className="cld-ultima__rec">
          🎁 {rec.nombre}{rec.descuento > 0 && ` · −${fmtMoney(rec.descuento)}`}
        </div>
      )}
    </div>
  );
}

function Favoritos({ favoritos }) {
  const max = favoritos[0]?.veces || 1;
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <ol className="cld-favoritos">
      {favoritos.map((f, i) => (
        <li key={f.nombre} className="cld-favorito">
          <div className="cld-favorito__rank">{medals[i] || `${i + 1}º`}</div>
          <div className="cld-favorito__main">
            <div className="cld-favorito__nombre">{f.nombre}</div>
            <div className="cld-favorito__bar">
              <div className="cld-favorito__fill" style={{ width: `${(f.veces / max) * 100}%` }} />
            </div>
          </div>
          <div className="cld-favorito__veces">
            <strong>{f.veces}</strong>
            <span> {f.veces === 1 ? "vez" : "veces"}</span>
            {f.gastoEnProducto > 0 && (
              <div className="cld-favorito__gasto">{fmtMoney(f.gastoEnProducto)}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
