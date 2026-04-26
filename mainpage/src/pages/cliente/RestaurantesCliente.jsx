import React, { useEffect, useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import { getRestaurantesLoyalty, getMiLoyaltyPerfil } from "../../services/loyaltyService";
import ClienteLayout from "./ClienteLayout";
import RestaurantLogo from "./RestaurantLogo";
import "./cliente.css";

export default function RestaurantesCliente() {
  const { cliente, loading: loadingAuth } = useClienteAuth();
  const [restaurantes, setRestaurantes] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (loadingAuth || !cliente) return;
    (async () => {
      try {
        const [r, p] = await Promise.all([getRestaurantesLoyalty(), getMiLoyaltyPerfil()]);
        setRestaurantes(r?.tenants || []);
        setPerfil(p);
      } finally { setLoading(false); }
    })();
  }, [cliente, loadingAuth]);

  const saldoPorSlug = useMemo(() => {
    const map = new Map();
    (perfil?.tenants || []).forEach((t) => map.set(t.slug, t.puntos));
    return map;
  }, [perfil]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return restaurantes || [];
    return (restaurantes || []).filter((r) =>
      [r.nombre, r.ciudad, r.direccion].filter(Boolean).some((s) => s.toLowerCase().includes(q))
    );
  }, [restaurantes, search]);

  if (!loadingAuth && !cliente) return <Navigate to="/cliente/login" replace />;

  return (
    <ClienteLayout>
      <section className="cliente-section">
        <div className="cliente-section__header">
          <div>
            <h1 className="cliente-section__h1">Restaurantes ALEF</h1>
            <p className="cliente-section__sub">
              Descubre todos los restaurantes que aceptan el programa de fidelización ALEF.
              Tu saldo viaja contigo en cada uno de ellos.
            </p>
          </div>
        </div>

        <div className="cliente-search">
          <input
            type="search"
            className="cliente-search__input"
            placeholder="Buscar por nombre, ciudad o dirección…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="cliente-search__count">{filtrados.length} restaurante{filtrados.length === 1 ? "" : "s"}</span>
        </div>

        {loading ? (
          <div className="cliente-skeleton">
            <div className="cliente-skel cliente-skel--cards" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="cliente-empty">
            <div className="cliente-empty__icon">🔎</div>
            <h3>{search ? "Sin resultados" : "Aún no hay restaurantes registrados"}</h3>
            <p>
              {search
                ? "Prueba con otra búsqueda."
                : "Pronto añadiremos más restaurantes con el programa Alef."}
            </p>
          </div>
        ) : (
          <div className="cliente-restaurantes-grid cliente-restaurantes-grid--big">
            {filtrados.map((r) => {
              const saldo = saldoPorSlug.get(r.slug) || 0;
              return (
                <Link
                  key={r._id}
                  to={`/cliente/restaurante/${r.slug}`}
                  className="cliente-restaurante-card cliente-restaurante-card--link"
                >
                  <div className="cliente-restaurante-card__top">
                    <RestaurantLogo nombre={r.nombre} logoUrl={r.logoUrl} size={48} />
                    <div className="cliente-restaurante-card__top-info">
                      <div className="cliente-restaurante-card__nombre">{r.nombre}</div>
                      {(r.direccion || r.ciudad) && (
                        <div className="cliente-restaurante-card__loc">
                          {r.direccion}{r.direccion && r.ciudad ? " · " : ""}{r.ciudad}
                        </div>
                      )}
                    </div>
                    {saldo > 0 && (
                      <span className="cliente-restaurante-card__pin" aria-label={`${saldo} puntos`}>
                        {saldo} pts
                      </span>
                    )}
                  </div>
                  <div className="cliente-restaurante-card__cta">Ver recompensas →</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </ClienteLayout>
  );
}
