import React, { useEffect, useState, useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import { getMiLoyaltyPerfil, getMiHistorialLoyalty } from "../../services/loyaltyService";
import "./cliente.css";

export default function PerfilCliente() {
  const { cliente, loading: loadingAuth, logout } = useClienteAuth();
  const [perfilLoyalty, setPerfilLoyalty] = useState(null);
  const [tenantSeleccionado, setTenantSeleccionado] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
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
      } finally {
        setLoadingPerfil(false);
      }
    })();
  }, [cliente, loadingAuth]);

  useEffect(() => {
    if (!tenantSeleccionado) return;
    (async () => {
      try {
        const data = await getMiHistorialLoyalty({ tenantSlug: tenantSeleccionado });
        setHistorial(data);
      } catch {
        setHistorial({ items: [], total: 0 });
      }
    })();
  }, [tenantSeleccionado]);

  const totalPuntos = useMemo(() => {
    return (perfilLoyalty?.tenants || []).reduce((acc, t) => acc + (t.puntos || 0), 0);
  }, [perfilLoyalty]);

  if (loadingAuth || loadingPerfil) {
    return <div className="cliente-auth"><div className="cliente-auth__card">Cargando…</div></div>;
  }
  if (!cliente) return <Navigate to="/cliente/login" replace />;

  return (
    <div className="cliente-perfil">
      <div className="cliente-perfil__header">
        <div>
          <h1>Hola, {cliente.nombre}</h1>
          <p className="cliente-perfil__email">{cliente.email}</p>
        </div>
        <button className="cliente-perfil__logout" onClick={logout}>Cerrar sesión</button>
      </div>

      {error && <div className="cliente-auth__error" style={{ marginBottom: 16 }}>{error}</div>}

      <section className="cliente-perfil__total">
        <div className="cliente-perfil__total-num">{totalPuntos}</div>
        <div className="cliente-perfil__total-label">puntos totales</div>
      </section>

      <section>
        <h2>Tus restaurantes ALEF</h2>
        {(!perfilLoyalty?.tenants || perfilLoyalty.tenants.length === 0) ? (
          <p className="cliente-perfil__vacio">
            Aún no tienes puntos en ningún restaurante. Da tu teléfono al camarero la próxima vez que visites un restaurante con ALEF para empezar a acumular.
          </p>
        ) : (
          <ul className="cliente-perfil__tenants">
            {perfilLoyalty.tenants.map((t) => (
              <li
                key={t.slug}
                className={`cliente-perfil__tenant ${tenantSeleccionado === t.slug ? "is-active" : ""}`}
                onClick={() => setTenantSeleccionado(t.slug)}
              >
                <div className="cliente-perfil__tenant-nombre">{t.nombre}</div>
                <div className="cliente-perfil__tenant-puntos">{t.puntos} pts</div>
                <div className="cliente-perfil__tenant-fecha">
                  Última visita: {new Date(t.lastVisit).toLocaleDateString("es")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {tenantSeleccionado && historial && (
        <section className="cliente-perfil__historial">
          <h2>Historial</h2>
          {historial.items.length === 0 ? (
            <p className="cliente-perfil__vacio">Sin movimientos todavía.</p>
          ) : (
            <ul>
              {historial.items.map((m) => (
                <li key={m._id} className="cliente-perfil__movimiento">
                  <div>
                    <strong>{etiquetaTipo(m.tipo)}</strong>
                    {m.nota && <span className="cliente-perfil__nota"> — {m.nota}</span>}
                  </div>
                  <div className={m.puntos >= 0 ? "puntos-positivos" : "puntos-negativos"}>
                    {m.puntos >= 0 ? `+${m.puntos}` : m.puntos} pts
                  </div>
                  <div className="cliente-perfil__fecha">
                    {new Date(m.createdAt).toLocaleString("es")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="cliente-perfil__footer">
        <Link to="/">← Volver a softalef.com</Link>
      </p>
    </div>
  );
}

function etiquetaTipo(t) {
  switch (t) {
    case "acumulacion": return "Compra";
    case "canjeo": return "Canjeo";
    case "caducidad": return "Caducidad";
    case "ajuste_manual": return "Ajuste";
    default: return t;
  }
}
