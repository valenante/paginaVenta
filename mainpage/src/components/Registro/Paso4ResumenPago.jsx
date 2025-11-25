import React from "react";
import "./Paso4ResumenPago.css";
import { loadStripe } from "@stripe/stripe-js";
import api from "../../utils/api";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function Paso4ResumenPago({
  tenant,
  config,
  servicios,
  precio,
  admin,
  onSubmit,
  loading,
  success,
  precioBasePlan,
  plan
}) {
  const handlePago = async () => {
    try {
      const stripe = await stripePromise;

      const { data } = await api.post("/pago/crear-sesion", {
        tenant,
        precio,
        servicios,
        config,
        admin,
      });

      if (data.url) {
        window.location.href = data.url; // redirige a Stripe Checkout
      } else {
        alert("❌ No se pudo crear la sesión de pago.");
      }
    } catch (err) {
      console.error("❌ Error al procesar pago:", err);
      alert("Error al procesar el pago. Inténtalo de nuevo.");
    }
  };

  return (
    <section className="paso4-resumen">
      <h2>💳 Resumen y contratación</h2>
      <p>Revisa todos los datos y completa el registro de tu restaurante.</p>

      {/* === DATOS DEL RESTAURANTE === */}
      <div className="resumen-bloque">
        <h3>🏪 Restaurante</h3>
        <p><strong>Nombre:</strong> {tenant.nombre}</p>
        <p><strong>Email:</strong> {tenant.email}</p>
        <p><strong>Teléfono:</strong> {config.informacionRestaurante.telefono || "—"}</p>
        <p><strong>Dirección:</strong> {config.informacionRestaurante.direccion || "—"}</p>
      </div>

      {/* === CONFIGURACIÓN === */}
      <div className="resumen-bloque">
        <h3>⚙️ Configuración inicial</h3>

        <ul>
          {plan?.features?.map((f) => {
            // Si la feature tiene configKey, mostramos ON/OFF desde config
            if (f.configKey) {
              return (
                <li key={f._id}>
                  {f.nombre}:{" "}
                  {config[f.configKey] ? "✔️ Activado" : "❌ Desactivado"}
                </li>
              );
            }

            // Si NO tiene configKey → solo informativa: incluida
            return (
              <li key={f._id}>
                {f.nombre}: <span>✔️ Incluida</span>
              </li>
            );
          })}

          {/* Colores siempre visibles */}
          <li>
            Color principal:
            <span
              className="color-box"
              style={{ background: config.colores.principal }}
            />
          </li>

          <li>
            Color secundario:
            <span
              className="color-box"
              style={{ background: config.colores.secundario }}
            />
          </li>
        </ul>
      </div>


      {/* === SERVICIOS CONTRATADOS === */}
      <div className="resumen-bloque">
        <h3>🧾 Servicios contratados</h3>
        <ul>
          <p><strong>Plan seleccionado:</strong> {tenant.plan}</p>
          <p><strong>Suscripción base:</strong> {precioBasePlan} €/mes</p>
          {servicios.vozCocina && <li>+ Voz en cocina — 10 €/mes</li>}
          {servicios.vozComandas && <li>+ Voz en comandas — 10 €/mes</li>}
          {servicios.impresoras > 0 && <li>{servicios.impresoras} × Impresora térmica — {150 * servicios.impresoras} €</li>}
          {servicios.pantallas > 0 && <li>{servicios.pantallas} × Pantalla de cocina/barra — {250 * servicios.pantallas} €</li>}
          {servicios.pda > 0 && <li>{servicios.pda} × PDA camarero — {180 * servicios.pda} €</li>}
          {servicios.fotografia && <li>+ Servicio de fotografía profesional — 120 €</li>}
          {servicios.cargaDatos && <li>+ Carga inicial de carta y datos — 100 €</li>}
        </ul>
      </div>

      {/* === RESUMEN DE PRECIOS === */}
      <div className="resumen-precio">
        <div className="fila">
          <span>Suscripción mensual</span>
          <strong>{precio.mensual.toFixed(2)} €</strong>
        </div>
        <div className="fila">
          <span>Coste único inicial</span>
          <strong>{precio.unico.toFixed(2)} €</strong>
        </div>
        <hr />
        <div className="fila total">
          <span>Total primer mes</span>
          <strong>{precio.totalPrimerMes.toFixed(2)} €</strong>
        </div>
      </div>

      {/* === PAGO Y ESTADO === */}
      <div className="resumen-pago">
        <button className="boton-pago" onClick={handlePago} disabled={loading}>
          {loading ? "Procesando..." : "Pagar y finalizar registro"}
        </button>

        {success && (
          <p className="mensaje-exito">
            ✅ Restaurante creado correctamente. Redirigiendo...
          </p>
        )}
      </div>

      <p className="nota-legal">
        Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
      </p>
    </section>
  );
}
