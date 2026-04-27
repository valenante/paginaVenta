import React, { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import {
  getDetalleRestauranteCliente,
  getResumenRestauranteCliente,
  getVisitasRestauranteCliente,
} from "../../services/loyaltyService";
import ClienteLayout from "./ClienteLayout";
import RestaurantLogo from "./RestaurantLogo";
import {
  HeaderKPIs,
  ProximaRecompensaBanner,
  TarjetaCliente,
  TimelineVisitas,
} from "./ExpedienteRestaurante";
import "./cliente.css";

const fmtMoney = (n) => `${Number(n || 0).toFixed(2).replace(".", ",")} €`;
const DIA_LABEL = ["D", "L", "M", "X", "J", "V", "S"];
const VISITAS_PAGE_SIZE = 10;

export default function DetalleRestauranteCliente() {
  const { slug } = useParams();
  const { cliente, loading: loadingAuth } = useClienteAuth();
  const [data, setData] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [visitas, setVisitas] = useState({ items: [], total: 0 });
  const [visitasPage, setVisitasPage] = useState(1);
  const [loadingVisitas, setLoadingVisitas] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carga inicial: detalle + resumen en paralelo
  useEffect(() => {
    if (loadingAuth || !cliente) return;
    (async () => {
      try {
        const [det, res] = await Promise.all([
          getDetalleRestauranteCliente(slug),
          getResumenRestauranteCliente(slug).catch(() => null),
        ]);
        setData(det);
        setResumen(res);
      } catch (err) {
        setError(err?.response?.data?.message || "No se pudo cargar el restaurante.");
      } finally { setLoading(false); }
    })();
  }, [slug, cliente, loadingAuth]);

  // Primera página de visitas (timeline) cuando hay al menos una
  useEffect(() => {
    if (loadingAuth || !cliente || !resumen || resumen.stats?.visitas === 0) return;
    setLoadingVisitas(true);
    (async () => {
      try {
        const data = await getVisitasRestauranteCliente(slug, { page: 1, limit: VISITAS_PAGE_SIZE });
        setVisitas({ items: data.items || [], total: data.total || 0 });
        setVisitasPage(1);
      } catch {
        setVisitas({ items: [], total: 0 });
      } finally { setLoadingVisitas(false); }
    })();
  }, [slug, cliente, loadingAuth, resumen]);

  const cargarMasVisitas = async () => {
    if (loadingVisitas) return;
    setLoadingVisitas(true);
    try {
      const next = visitasPage + 1;
      const data = await getVisitasRestauranteCliente(slug, { page: next, limit: VISITAS_PAGE_SIZE });
      setVisitas((prev) => ({
        items: [...prev.items, ...(data.items || [])],
        total: data.total || prev.total,
      }));
      setVisitasPage(next);
    } finally { setLoadingVisitas(false); }
  };

  if (!loadingAuth && !cliente) return <Navigate to="/cliente/login" replace />;

  if (loading) {
    return (
      <ClienteLayout>
        <div className="cliente-skeleton">
          <div className="cliente-skel cliente-skel--hero" />
          <div className="cliente-skel cliente-skel--cards" />
        </div>
      </ClienteLayout>
    );
  }

  if (error || !data) {
    return (
      <ClienteLayout>
        <div className="cliente-empty">
          <div className="cliente-empty__icon">⚠️</div>
          <h3>{error || "Restaurante no encontrado"}</h3>
          <Link to="/cliente/restaurantes" className="cliente-btn cliente-btn--ghost">
            ← Volver a restaurantes
          </Link>
        </div>
      </ClienteLayout>
    );
  }

  const { restaurante, loyalty, saldo } = data;

  // Hero rediseñado: logo + nombre + dirección a la izquierda; saldo grande a la derecha;
  // KPIs inline debajo del nombre; barra de progreso integrada bajo el saldo.
  const hero = (
    <section className="cli-hero cli-hero--rest">
      <div className="cli-hero__inner">
        <div className="cli-hero__user">
          <RestaurantLogo nombre={restaurante.nombre} logoUrl={restaurante.logoUrl} size={72} />
          <div className="cli-hero__main">
            <span className="cli-hero__welcome">Restaurante Alef</span>
            <h1>{restaurante.nombre}</h1>
            {(restaurante.direccion || restaurante.ciudad) && (
              <p className="cli-hero__email">
                📍 {restaurante.direccion}{restaurante.direccion && restaurante.ciudad ? " · " : ""}{restaurante.ciudad}
              </p>
            )}
            <HeaderKPIs stats={resumen?.stats} />
          </div>
        </div>
        <div className="cli-hero__saldo-box">
          <div className="cli-hero__saldo-num">{saldo.toLocaleString("es")}</div>
          <div className="cli-hero__saldo-label">tus puntos aquí</div>
          <div className="cli-hero__saldo-sub">
            {loyalty.puntosPorEuro} pts por €
            {loyalty.minimoParaCanjear > 0 && ` · Mín. canjeo: ${loyalty.minimoParaCanjear}`}
          </div>
        </div>
      </div>
    </section>
  );

  // URLs cross-app a la carta del cliente. Pre-rellenamos los datos del cliente
  // en reservas para que no tenga que escribirlos.
  const cartaBase = (import.meta.env.VITE_CARTA_BASE_URL || "http://localhost:5174").replace(/\/$/, "");
  const cartaUrl = `${cartaBase}/${slug}/carta`;
  const reservasParams = new URLSearchParams({
    nombre: cliente?.nombre || "",
    email: cliente?.email || "",
    telefono: cliente?.telefono || "",
  }).toString();
  const reservasUrl = `${cartaBase}/${slug}/reservas?${reservasParams}`;

  const direccionFull = [restaurante.direccion, restaurante.ciudad, restaurante.nombre]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = direccionFull
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionFull)}`
    : null;

  const tieneVisitas = (resumen?.stats?.visitas || 0) > 0;
  const tieneRecompensas = (loyalty.recompensas || []).length > 0;
  const tieneMultiplicadores = (loyalty.multiplicadores || []).length > 0;

  return (
    <ClienteLayout hero={hero}>
      <Link to="/cliente/restaurantes" className="cliente-back">← Volver a Restaurantes</Link>

      <div className="cli-acciones-rest">
        <a
          href={cartaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cliente-btn cliente-btn--primary"
        >
          📋 Ver carta digital
        </a>
        <a
          href={reservasUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cliente-btn cliente-btn--accent"
        >
          📅 Reservar mesa
        </a>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cliente-btn cliente-btn--ghost"
            title={direccionFull}
          >
            📍 Cómo llegar
          </a>
        )}
      </div>

      {!loyalty.activo && (
        <div className="cliente-alert cliente-alert--warn" style={{ marginBottom: "1.5rem" }}>
          Este restaurante tiene el programa de fidelización temporalmente pausado.
        </div>
      )}

      {/* Próxima recompensa: banner ancho con progreso. Aparece solo si hay una alcanzable. */}
      {resumen?.proximaRecompensa && (
        <ProximaRecompensaBanner proxima={resumen.proximaRecompensa} saldo={saldo} />
      )}

      {/* Expediente del cliente: última visita + favoritos en grid 2 cols (1 col en mobile) */}
      {tieneVisitas ? (
        <section className="cliente-section">
          <TarjetaCliente resumen={resumen} />
        </section>
      ) : (
        <section className="cliente-section">
          <div className="cliente-empty cliente-empty--small">
            <p>Aún no has visitado este restaurante. Cuando vayas y te identifiques al cobrar, aquí verás tus visitas, productos favoritos y más.</p>
          </div>
        </section>
      )}

      {/* Recompensas disponibles: solo se renderiza si el restaurante tiene catálogo */}
      {tieneRecompensas && (
        <section className="cliente-section">
          <div className="cliente-section__header">
            <div>
              <h2>🎁 Recompensas</h2>
              <p className="cliente-section__sub">
                Pide al camarero canjear cuando hayas decidido. El descuento se aplica al cobrar.
              </p>
            </div>
          </div>
          <ul className="cliente-recompensas">
            {loyalty.recompensas.map((r) => (
              <li key={r._id} className={`cliente-recompensa ${r.puedoCanjear ? "is-canjeable" : ""}`}>
                <div className="cliente-recompensa__main">
                  <div className="cliente-recompensa__nombre">{r.nombre}</div>
                  {r.descripcion && <div className="cliente-recompensa__desc">{r.descripcion}</div>}
                  <div className="cliente-recompensa__valor">
                    {r.tipo === "descuento_pct"
                      ? `${r.valor}% de descuento`
                      : r.tipo === "producto_gratis"
                      ? `Producto gratis (≈ ${fmtMoney(r.valor)})`
                      : `${fmtMoney(r.valor)} de descuento`}
                  </div>
                </div>
                <div className="cliente-recompensa__side">
                  <div className="cliente-recompensa__coste">
                    <strong>{r.coste}</strong> pts
                  </div>
                  {r.puedoCanjear ? (
                    <span className="cliente-recompensa__chip cliente-recompensa__chip--ok">✓ Puedes canjear</span>
                  ) : (
                    <span className="cliente-recompensa__chip">
                      Te faltan <strong>{Math.max(0, r.coste - saldo)}</strong> pts
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Multiplicadores: solo si el restaurante tiene franjas configuradas */}
      {tieneMultiplicadores && (
        <section className="cliente-section">
          <div className="cliente-section__header">
            <div>
              <h2>⏱️ Horas con puntos extra</h2>
              <p className="cliente-section__sub">
                En estas franjas tus puntos se multiplican.
              </p>
            </div>
          </div>
          <div className="cliente-mult-grid">
            {loyalty.multiplicadores.map((m, i) => (
              <div key={i} className="cliente-mult">
                <div className="cliente-mult__factor">×{m.factor}</div>
                <div>
                  <div className="cliente-mult__nombre">{m.nombre}</div>
                  <div className="cliente-mult__detalle">
                    {m.horaInicio} – {m.horaFin}
                  </div>
                  <div className="cliente-mult__dias">
                    {DIA_LABEL.map((d, idx) => (
                      <span
                        key={idx}
                        className={`cliente-mult__dia ${(m.diasSemana || []).includes(idx) ? "is-on" : ""}`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Timeline completo de visitas. Es el único histórico — ya no duplicamos
          los movimientos de puntos: los puntos van como chip dentro de cada fila. */}
      {tieneVisitas && (
        <TimelineVisitas
          items={visitas.items}
          total={visitas.total}
          loading={loadingVisitas}
          hasMore={visitas.items.length < visitas.total}
          onLoadMore={cargarMasVisitas}
        />
      )}
    </ClienteLayout>
  );
}
