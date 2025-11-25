import { useEffect, useState } from "react";
import api from "../../utils/api";
import "../../styles/BillingPage.css";

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await api.get("/superadminBilling");
        setData(res.data);
      } catch (err) {
        console.error("❌ Error billing:", err);
        setError("No se pudo cargar la información de facturación.");
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, []);

  if (loading) return <p className="billing-loading">Cargando datos...</p>;
  if (error) return <p className="billing-error">{error}</p>;

  const { mrr, totalTenants, pagos, suscripciones } = data;

  return (
    <div className="billing-page">
      <h1>📄 Facturación</h1>

      {/* ====== RESUMEN SUPERIOR ====== */}
      <div className="billing-cards">
        <div className="billing-card">
          <h3>MRR (Mensual)</h3>
          <p className="billing-number">€ {mrr.toFixed(2)}</p>
        </div>

        <div className="billing-card">
          <h3>Total Restaurantes</h3>
          <p className="billing-number">{totalTenants}</p>
        </div>

        <div className="billing-card">
          <h3>Suscripciones activas</h3>
          <p className="billing-number">{suscripciones.length}</p>
        </div>
      </div>

      {/* ====== ÚLTIMOS PAGOS ====== */}
      <h2 className="billing-section-title">💳 Últimos pagos Stripe</h2>

      <table className="billing-table">
        <thead>
          <tr>
            <th>Monto</th>
            <th>Estado</th>
            <th>Cliente</th>
            <th>Fecha</th>
          </tr>
        </thead>

        <tbody>
          {pagos.map((pago) => (
            <tr key={pago.id}>
              <td>€ {(pago.amount / 100).toFixed(2)}</td>
              <td>{pago.status}</td>
              <td>{pago.customer || "—"}</td>
              <td>{new Date(pago.created * 1000).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ====== SUSCRIPCIONES ====== */}
      <h2 className="billing-section-title">📦 Suscripciones</h2>

      <table className="billing-table">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Precio mensual</th>
            <th>Inicio</th>
            <th>Renovación</th>
          </tr>
        </thead>

        <tbody>
          {suscripciones.map((s) => (
            <tr key={s._id}>
              <td>{s.tenantId}</td>
              <td>€ {s.precioMensual}</td>
              <td>{new Date(s.fechaInicio).toLocaleDateString()}</td>
              <td>{new Date(s.fechaRenovacion).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
