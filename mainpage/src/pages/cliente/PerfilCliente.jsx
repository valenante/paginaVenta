import React, { useEffect, useState, useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import { getMiLoyaltyPerfil, getMiHistorialLoyalty } from "../../services/loyaltyService";
import ClienteLayout from "./ClienteLayout";
import { tipoMovimiento, fechaRelativa, etiquetaMovimiento } from "./historial-helpers";
import "./cliente.css";

export default function PerfilCliente() {
  const { cliente, loading: loadingAuth } = useClienteAuth();
  const [perfilLoyalty, setPerfilLoyalty] = useState(null);
  const [tenantSeleccionado, setTenantSeleccionado] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [loadingHist, setLoadingHist] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loadingAuth || !cliente) return;
    (async () => {
      try {
        const data = await getMiLoyaltyPerfil();
        setPerfilLoyalty(data);
        if (data?.tenants?.length) setTenantSeleccionado(data.tenants[0].slug);
      } catch (err) {
        setError(err?.response?.data?.message || "No se pudo cargar tu perfil.");
      } finally { setLoadingPerfil(false); }
    })();
  }, [cliente, loadingAuth]);

  useEffect(() => {
    if (!tenantSeleccionado) return;
    setLoadingHist(true);
    (async () => {
      try {
        const data = await getMiHistorialLoyalty({ tenantSlug: tenantSeleccionado });
        setHistorial(data);
      } catch {
        setHistorial({ items: [], total: 0 });
      } finally { setLoadingHist(false); }
    })();
  }, [tenantSeleccionado]);

  const totalPuntos = useMemo(() => {
    return (perfilLoyalty?.tenants || []).reduce((acc, t) => acc + (t.puntos || 0), 0);
  }, [perfilLoyalty]);

  if (loadingAuth || loadingPerfil) {
    return (
      <ClienteLayout>
        <div className="cliente-skeleton">
          <div className="cliente-skel cliente-skel--hero" />
          <div className="cliente-skel cliente-skel--cards" />
        </div>
      </ClienteLayout>
    );
  }

  if (!cliente) return <Navigate to="/cliente/login" replace />;

  const tenants = perfilLoyalty?.tenants || [];
  const tenantActivo = tenants.find((t) => t.slug === tenantSeleccionado);

  const hero = (
    <section className="cli-hero">
      <div className="cli-hero__inner">
        <div className="cli-hero__user">
          <div className="cli-hero__avatar">{cliente.nombre?.[0]?.toUpperCase() || "·"}</div>
          <div>
            <span className="cli-hero__welcome">Bienvenido</span>
            <h1>Hola, {cliente.nombre.split(" ")[0]}</h1>
            <p className="cli-hero__email">{cliente.email}</p>
          </div>
        </div>
        <div className="cli-hero__saldo-box">
          <div className="cli-hero__saldo-num">{totalPuntos.toLocaleString("es")}</div>
          <div className="cli-hero__saldo-label">puntos acumulados</div>
          {tenants.length > 0 && (
            <div className="cli-hero__saldo-sub">
              en {tenants.length} {tenants.length === 1 ? "restaurante Alef" : "restaurantes Alef"}
            </div>
          )}
        </div>
      </div>
    </section>
  );

  return (
    <ClienteLayout hero={hero}>
      {error && <div className="cliente-alert cliente-alert--error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      {/* RESTAURANTES */}
      <section className="cliente-section">
        <div className="cliente-section__header">
          <div>
            <h2>Tus restaurantes ALEF</h2>
            <p className="cliente-section__sub">
              Saldo y puntos acumulados en cada local donde has consumido.
            </p>
          </div>
          <Link to="/cliente/restaurantes" className="cliente-btn cliente-btn--ghost">
            Descubrir restaurantes →
          </Link>
        </div>

        {tenants.length === 0 ? (
          <div className="cliente-empty">
            <div className="cliente-empty__icon">🏪</div>
            <h3>Aún no tienes puntos en ningún restaurante</h3>
            <p>
              La próxima vez que visites un restaurante con Alef, dile al camarero tu email
              o teléfono y empezarás a acumular puntos automáticamente.
            </p>
            <Link to="/cliente/restaurantes" className="cliente-btn cliente-btn--primary">
              Ver restaurantes ALEF
            </Link>
          </div>
        ) : (
          <div className="cliente-restaurantes-grid">
            {tenants.map((t) => (
              <button
                key={t.slug}
                type="button"
                className={`cliente-restaurante-card ${tenantSeleccionado === t.slug ? "is-active" : ""}`}
                onClick={() => setTenantSeleccionado(t.slug)}
              >
                <div className="cliente-restaurante-card__head">
                  <div className="cliente-restaurante-card__nombre">{t.nombre}</div>
                  {tenantSeleccionado === t.slug && <span className="cliente-restaurante-card__pin">●</span>}
                </div>
                <div className="cliente-restaurante-card__puntos">
                  <span className="cliente-restaurante-card__puntos-num">{t.puntos.toLocaleString("es")}</span>
                  <span className="cliente-restaurante-card__puntos-label">pts</span>
                </div>
                <div className="cliente-restaurante-card__visita">
                  Última visita: {t.lastVisit ? new Date(t.lastVisit).toLocaleDateString("es") : "—"}
                </div>
                <Link
                  to={`/cliente/restaurante/${t.slug}`}
                  className="cliente-restaurante-card__cta"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver recompensas →
                </Link>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* HISTORIAL */}
      {tenantSeleccionado && (
        <section className="cliente-section">
          <div className="cliente-section__header">
            <div>
              <h2>Historial de movimientos</h2>
              <p className="cliente-section__sub">
                Movimientos en <strong>{tenantActivo?.nombre || tenantSeleccionado}</strong>.
              </p>
            </div>
          </div>

          {loadingHist ? (
            <div className="cliente-skel cliente-skel--list" />
          ) : !historial?.items?.length ? (
            <div className="cliente-empty cliente-empty--small">
              <p>Sin movimientos en este restaurante todavía.</p>
            </div>
          ) : (
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
          )}
        </section>
      )}
    </ClienteLayout>
  );
}
