import React, { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import { getDetalleRestauranteCliente, getMiHistorialLoyalty } from "../../services/loyaltyService";
import ClienteLayout from "./ClienteLayout";
import RestaurantLogo from "./RestaurantLogo";
import { tipoMovimiento, fechaRelativa, etiquetaMovimiento } from "./historial-helpers";
import "./cliente.css";

const fmtMoney = (n) => `${Number(n || 0).toFixed(2).replace(".", ",")} €`;

const DIA_LABEL = ["D", "L", "M", "X", "J", "V", "S"];

const HISTORIAL_PAGE_SIZE = 10;

export default function DetalleRestauranteCliente() {
  const { slug } = useParams();
  const { cliente, loading: loadingAuth } = useClienteAuth();
  const [data, setData] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [page, setPage] = useState(1);
  const [loadingHist, setLoadingHist] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carga inicial del detalle (no se recarga al paginar)
  useEffect(() => {
    if (loadingAuth || !cliente) return;
    (async () => {
      try {
        const det = await getDetalleRestauranteCliente(slug);
        setData(det);
      } catch (err) {
        setError(err?.response?.data?.message || "No se pudo cargar el restaurante.");
      } finally { setLoading(false); }
    })();
  }, [slug, cliente, loadingAuth]);

  // Carga del historial — separada para que cambie con la paginación
  useEffect(() => {
    if (loadingAuth || !cliente) return;
    setLoadingHist(true);
    (async () => {
      try {
        const hist = await getMiHistorialLoyalty({ tenantSlug: slug, page, limit: HISTORIAL_PAGE_SIZE });
        setHistorial(hist);
      } catch {
        setHistorial({ items: [], total: 0 });
      } finally { setLoadingHist(false); }
    })();
  }, [slug, cliente, loadingAuth, page]);

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

  const hero = (
    <section className="cli-hero">
      <div className="cli-hero__inner">
        <div className="cli-hero__user">
          <RestaurantLogo nombre={restaurante.nombre} logoUrl={restaurante.logoUrl} size={64} />
          <div>
            <span className="cli-hero__welcome">Restaurante Alef</span>
            <h1>{restaurante.nombre}</h1>
            {(restaurante.direccion || restaurante.ciudad) && (
              <p className="cli-hero__email">
                {restaurante.direccion}{restaurante.direccion && restaurante.ciudad ? " · " : ""}{restaurante.ciudad}
              </p>
            )}
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

  // URLs cross-app a la carta del cliente: pre-rellenamos los datos del cliente
  // logueado para que no tenga que escribir nombre/email/teléfono al reservar.
  // Fallback dev: localhost:5174 si la env var no está definida.
  const cartaBase = (import.meta.env.VITE_CARTA_BASE_URL || "http://localhost:5174").replace(/\/$/, "");
  const cartaUrl = `${cartaBase}/${slug}/carta`;
  const reservasParams = new URLSearchParams({
    nombre: cliente?.nombre || "",
    email: cliente?.email || "",
    telefono: cliente?.telefono || "",
  }).toString();
  const reservasUrl = `${cartaBase}/${slug}/reservas?${reservasParams}`;

  // Cómo llegar: si tenemos dirección y/o ciudad, abrimos Google Maps.
  // Construye una query searcheable con todos los datos disponibles.
  const direccionFull = [restaurante.direccion, restaurante.ciudad, restaurante.nombre]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = direccionFull
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionFull)}`
    : null;

  const totalPaginas = Math.max(1, Math.ceil((historial?.total || 0) / HISTORIAL_PAGE_SIZE));

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

      {/* MULTIPLICADORES ACTIVOS */}
      {loyalty.multiplicadores?.length > 0 && (
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

      {/* RECOMPENSAS */}
      <section className="cliente-section">
        <div className="cliente-section__header">
          <div>
            <h2>🎁 Recompensas disponibles</h2>
            <p className="cliente-section__sub">
              Pide al camarero canjear cuando hayas decidido. El descuento se aplica
              automáticamente al cobrar.
            </p>
          </div>
        </div>

        {loyalty.recompensas.length === 0 ? (
          <div className="cliente-empty cliente-empty--small">
            <p>Este restaurante aún no tiene recompensas configuradas.</p>
          </div>
        ) : (
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
        )}
      </section>

      {/* HISTORIAL EN ESTE RESTAURANTE */}
      <section className="cliente-section">
        <div className="cliente-section__header">
          <div>
            <h2>📜 Tu historial aquí</h2>
            <p className="cliente-section__sub">
              Movimientos en {restaurante.nombre}
              {historial?.total ? ` · ${historial.total} ${historial.total === 1 ? "movimiento" : "movimientos"}` : ""}.
            </p>
          </div>
        </div>

        {loadingHist ? (
          <div className="cliente-skel cliente-skel--list" />
        ) : !historial?.items?.length ? (
          <div className="cliente-empty cliente-empty--small">
            <p>Sin movimientos todavía. Dile al camarero tu email en tu próxima visita.</p>
          </div>
        ) : (
          <>
            <ol className="cliente-historial">
              {historial.items.map((m) => {
                const tipo = tipoMovimiento(m.tipo);
                const positivo = m.puntos >= 0;
                return (
                  <li key={m._id} className={`cliente-mov cliente-mov--${tipo.key}`}>
                    <div className={`cliente-mov__icon cliente-mov__icon--${tipo.key}`} aria-hidden="true">
                      {tipo.icon}
                    </div>
                    <div className="cliente-mov__body">
                      <div className="cliente-mov__title">
                        <strong>{tipo.label}</strong>
                        {etiquetaMovimiento(m) && (
                          <span className="cliente-mov__nota"> · {etiquetaMovimiento(m)}</span>
                        )}
                      </div>
                      <div className="cliente-mov__fecha">{fechaRelativa(m.createdAt)}</div>
                    </div>
                    <div className={`cliente-mov__pts ${positivo ? "is-pos" : "is-neg"}`}>
                      {positivo ? "+" : ""}{m.puntos.toLocaleString("es")}
                      <span> pts</span>
                    </div>
                  </li>
                );
              })}
            </ol>

            {totalPaginas > 1 && (
              <div className="cli-historial-pager">
                <button
                  type="button"
                  className="cliente-btn cliente-btn--ghost"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loadingHist}
                >
                  ← Anterior
                </button>
                <span className="cli-historial-pager__info">
                  Página <strong>{page}</strong> de <strong>{totalPaginas}</strong>
                </span>
                <button
                  type="button"
                  className="cliente-btn cliente-btn--ghost"
                  onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
                  disabled={page >= totalPaginas || loadingHist}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </ClienteLayout>
  );
}
