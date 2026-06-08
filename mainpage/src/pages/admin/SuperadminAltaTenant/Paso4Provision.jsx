import React from "react";

export default function Paso4Provision({
  tenant,
  admin,
  config,
  servicios,
  precio,
  precioBasePlan,
  plan,
  periodo,
  setPeriodo,
  isShop,
  loading,
  onProvision,
  successMsg,
}) {
  const totalHoy =
    periodo === "mensual" ? precio.totalPrimerMes : precio.unico + precio.mensual * 11;

  return (
    <section className="paso4-resumen section section--wide">
      <header className="paso4-header">
        <h2>Resumen y provisión</h2>
        <p>
          Esto crea el tenant igual que el registro real, pero como superadmin no se paga.
          Se envía email con link de set-password.
        </p>
      </header>

      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <h3>Datos</h3>
        <p><strong>Negocio:</strong> {tenant.nombre || "—"}</p>
        <p><strong>Email dueño:</strong> {tenant.email || "—"}</p>
        <p><strong>Admin:</strong> {admin.name || "—"} ({admin.email || "—"})</p>
        <p><strong>Plan:</strong> {plan?.nombre || tenant.plan || "—"}</p>
        <p><strong>Tipo:</strong> {isShop ? "shop" : "restaurante"}</p>
      </div>

      <div className="resumen-periodo card" style={{ marginBottom: 12 }}>
        <h3>Tipo de facturación (para dejarlo guardado)</h3>
        <div className="periodo-cards">
          <div
            className={`periodo-card ${periodo === "mensual" ? "active" : ""}`}
            onClick={() => setPeriodo("mensual")}
          >
            <h4>Mensual</h4>
            <p className="periodo-precio">{precioBasePlan} €/mes</p>
          </div>

          <div
            className={`periodo-card ${periodo === "anual" ? "active" : ""}`}
            onClick={() => setPeriodo("anual")}
          >
            <h4>Anual</h4>
            <p className="periodo-precio">{(precioBasePlan * 11).toFixed(2)} €/año</p>
            <p className="periodo-detalle ahorro">1 mes gratis</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <h3>Coste estimado</h3>
        <p><strong>Suscripción:</strong> {periodo === "mensual" ? `${precio.mensual.toFixed(2)} €/mes` : `${(precio.mensual * 11).toFixed(2)} €/año`}</p>
        <p><strong>Único inicial:</strong> {precio.unico.toFixed(2)} €</p>
        <hr />
        <p><strong>{periodo === "mensual" ? "Total primer mes" : "Total hoy"}:</strong> {totalHoy.toFixed(2)} €</p>
      </div>

      <div className="resumen-pago">
        <button
          className="boton-pago btn btn-primario "
          onClick={onProvision}
          disabled={loading}
        >
          {loading ? "Provisionando..." : "Crear y provisionar (sin pago)"}
        </button>

        {successMsg && (
          <p className="mensaje-exito badge badge-exito" style={{ marginTop: 10 }}>
            {successMsg}
          </p>
        )}
      </div>
    </section>
  );
}
