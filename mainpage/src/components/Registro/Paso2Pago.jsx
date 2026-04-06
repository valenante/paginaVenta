import React from "react";
import api from "../../utils/api";
import "./Paso2Pago.css";

export default function Paso2Pago({
  tenant, admin, plan, precio, periodo, setPeriodo,
  precheckoutId, setPrecheckoutId,
  loading, setLoading, error, setError, isShop,
}) {

  const handlePagar = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Crear precheckout si no existe
      let pid = precheckoutId;
      if (!pid) {
        const { data } = await api.post("/pago/precheckout", {
          tenant: { nombre: tenant.nombre.trim() },
          admin: { name: admin.name.trim(), email: admin.email.trim().toLowerCase() },
          plan: `${plan.slug}_${periodo === "anual" ? "anual" : "mensual"}`,
          tipoNegocio: tenant.tipoNegocio || (isShop ? "shop" : "restaurante"),
        });

        pid = data?.precheckoutId || data?.data?.precheckoutId;
        if (!pid) throw new Error("PRECHECKOUT_FAIL");
        setPrecheckoutId(pid);
      }

      // 2. Crear sesion de pago en Stripe
      const { data: sesion } = await api.post("/pago/crear-sesion", { precheckoutId: pid });
      if (!sesion?.url) throw new Error("SESSION_FAIL");

      // 3. Limpiar borrador y redirigir
      try { localStorage.removeItem("alef_registro_draft"); } catch {}
      window.location.href = sesion.url;
    } catch (err) {
      console.error("Error al procesar pago:", err);
      setError("Error al procesar el pago. Intentalo de nuevo.");
      setLoading(false);
    }
  };

  const labelNegocio = isShop ? "tienda" : "restaurante";

  return (
    <section className="paso2-pago">

      {/* Resumen del negocio */}
      <div className="p2-resumen">
        <h3>Tu {labelNegocio}</h3>
        <dl className="p2-dl">
          <dt>Nombre</dt>
          <dd>{tenant.nombre || "-"}</dd>
          <dt>Email</dt>
          <dd>{admin.email || "-"}</dd>
          <dt>Administrador</dt>
          <dd>{admin.name || "-"}</dd>
        </dl>
      </div>

      {/* Plan */}
      <div className="p2-plan">
        <h3>Plan: {plan?.nombre || "-"}</h3>
        {plan?.descripcion && <p className="p2-plan-desc">{plan.descripcion}</p>}
      </div>

      {/* Periodo */}
      <div className="p2-periodo">
        <h3>Tipo de facturacion</h3>
        <div className="p2-periodo-cards">
          <button
            type="button"
            className={`p2-periodo-card ${periodo === "mensual" ? "p2-periodo-card--active" : ""}`}
            onClick={() => setPeriodo("mensual")}
          >
            <strong>Mensual</strong>
            <span className="p2-periodo-precio">{precio.mensual} €/mes</span>
            <small>Se factura cada mes</small>
          </button>

          <button
            type="button"
            className={`p2-periodo-card ${periodo === "anual" ? "p2-periodo-card--active" : ""}`}
            onClick={() => setPeriodo("anual")}
          >
            <strong>Anual</strong>
            <span className="p2-periodo-precio">{precio.anual} €/año</span>
            <small>Ahorras 1 mes</small>
            <span className="p2-periodo-badge">Recomendado</span>
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="p2-total">
        <div className="p2-total-row">
          <span>Total hoy</span>
          <strong className="p2-total-amount">{precio.total} €</strong>
        </div>
        <p className="p2-total-note">
          Sin permanencia. Cancela o cambia de plan cuando quieras.
        </p>
      </div>

      {/* CTA */}
      <button
        type="button"
        className="p2-btn-pagar"
        onClick={handlePagar}
        disabled={loading}
      >
        {loading ? "Redirigiendo a Stripe..." : `Pagar ${precio.total} € y empezar`}
      </button>

      <p className="p2-legal">
        Al continuar aceptas los{" "}
        <a href="/aviso-legal" target="_blank" rel="noreferrer">terminos de uso</a>{" "}
        y la{" "}
        <a href="/privacidad" target="_blank" rel="noreferrer">politica de privacidad</a>.
      </p>

      {/* Post-pago info */}
      <div className="p2-info">
        <p>
          Despues de pagar podras configurar colores, mesas, carta digital,
          impresoras, personal y todo lo demas desde tu panel de gestion.
        </p>
      </div>
    </section>
  );
}
