import React, { useState } from "react";
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
  loading,
  setLoading,
  error,
  setError,

  precheckoutId,
  setPrecheckoutId,

  precioBasePlan,
  plan,
  periodo,
  setPeriodo,
  isShop = false,
}) {
  const handlePago = async () => {
    if (loading) return; // evita doble click

    setLoading(true);
    setError("");

    try {
      if (!plan?.slug) throw new Error("PLAN_NO_CARGADO");

      const slugCompleto = `${plan.slug}_${periodo}`;

      let pid = precheckoutId;

      if (!pid) {
        const { data: pre } = await api.post("/pago/precheckout", {
          tenant,
          config,
          servicios,
          precio,
          admin,
          plan: slugCompleto,
          colores: config.colores,
          tipoNegocio: isShop ? "shop" : "restaurante",
        });

        if (!pre?.precheckoutId) throw new Error("PRECHECKOUT_FAIL");
        pid = pre.precheckoutId;
        setPrecheckoutId(pid);
      }

      const { data: sesion } = await api.post("/pago/crear-sesion", { precheckoutId: pid });

      if (!sesion?.url) {
        throw new Error("SESSION_FAIL");
      }

      // Limpiar borrador del registro antes de salir a Stripe
      try { localStorage.removeItem("alef_registro_draft"); } catch {}
      window.location.href = sesion.url;
      // NO pongas setLoading(false) aquí porque ya te vas
    } catch (err) {
      console.error("❌ Error al procesar pago:", err);
      setError("Error al procesar el pago. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  const features = plan?.features || [];
  const featuresConfig = features.filter((f) => f.configKey);
  const featuresFijas = features.filter((f) => !f.configKey);

  const PRECIO_CARGA_PRODUCTOS = 80;
  const PRECIO_MESAS_QR_BASE = 80;
  const PRECIO_IMPRESORA = 150;
  const PRECIO_PANTALLA = 250;
  const PRECIO_PDA = 180;
  const PRECIO_FOTOGRAFIA = 120;
  const PRECIO_CARGA_DATOS = 100;

  const [mostrarSoloActivas, setMostrarSoloActivas] = useState(true);

  const calcularPrecioMesasQr = (cantidadMesas) => {
    const n = Number(cantidadMesas) || 0;
    if (n <= 30) return PRECIO_MESAS_QR_BASE;
    return PRECIO_MESAS_QR_BASE + (n - 30) * 2;
  };

  const featuresConfigFiltradas = mostrarSoloActivas
    ? featuresConfig.filter((f) => !!config[f.configKey])
    : featuresConfig;

  const hayConfigurables = featuresConfig.length > 0;
  const hayFiltradas = featuresConfigFiltradas.length > 0;

  const tituloNegocio = isShop ? "🏬 Tienda" : "🏪 Restaurante";

  return (
    <section className="paso4-resumen section section--wide">
      <header className="paso4-header">
        <h2>💳 Resumen y contratación</h2>
        <p>
          Revisa que todos los datos estén correctos antes de finalizar el
          registro de tu {isShop ? "tienda" : "restaurante"}.
        </p>
      </header>

      {/* === DATOS DEL NEGOCIO === */}
      <div className="resumen-bloque card">
        <div className="resumen-bloque-header">
          <h3>{tituloNegocio}</h3>
          <span className="resumen-tag badge badge-aviso">Datos principales</span>
        </div>

        <dl className="resumen-datos">
          <div className="resumen-dato">
            <dt>Nombre</dt>
            <dd>{tenant.nombre || "—"}</dd>
          </div>
          <div className="resumen-dato">
            <dt>Email de contacto</dt>
            <dd>{admin?.email || "—"}</dd>
          </div>
          <div className="resumen-dato">
            <dt>Teléfono</dt>
            <dd>{config.informacionRestaurante.telefono || "—"}</dd>
          </div>
          <div className="resumen-dato">
            <dt>Dirección</dt>
            <dd>{config.informacionRestaurante.direccion || "—"}</dd>
          </div>
        </dl>
      </div>

      {/* === CONFIGURACIÓN INICIAL === */}
      <div className="resumen-bloque card">
        <div className="resumen-bloque-header">
          <h3>⚙️ Configuración inicial</h3>
          <span className="resumen-tag badge badge-aviso">
            Cómo se crea tu entorno Alef
          </span>
        </div>

        <div className="resumen-config-layout">
          <div className="resumen-config-col">
            <p className="resumen-list-title">Opciones configuradas ahora</p>

            {hayConfigurables && (
              <div className="resumen-filter-toggle">
                <button
                  type="button"
                  className={"toggle-pill" + (mostrarSoloActivas ? " toggle-pill--active" : "")}
                  onClick={() => setMostrarSoloActivas(true)}
                >
                  Solo activadas
                </button>
                <button
                  type="button"
                  className={"toggle-pill" + (!mostrarSoloActivas ? " toggle-pill--active" : "")}
                  onClick={() => setMostrarSoloActivas(false)}
                >
                  Ver todas
                </button>
              </div>
            )}

            {!hayConfigurables ? (
              <p className="resumen-empty">
                Este plan no tiene opciones configurables en el alta.
              </p>
            ) : !hayFiltradas && mostrarSoloActivas ? (
              <p className="resumen-empty">
                No has activado ninguna opción de este bloque.
              </p>
            ) : (
              <div className="resumen-list-scroll">
                <ul className="resumen-list">
                  {featuresConfigFiltradas.map((f) => {
                    const activo = !!config[f.configKey];
                    return (
                      <li key={f._id} className="resumen-list-item">
                        <span className="resumen-list-name">{f.nombre}</span>
                        <span className={`resumen-pill ${activo ? "pill-on" : "pill-off"}`}>
                          {activo ? "Activado" : "Desactivado"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="resumen-config-col">
            <p className="resumen-list-title">Incluido en tu plan</p>

            <ul className="resumen-list">
              {featuresFijas.map((f) => (
                <li key={f._id} className="resumen-list-item">
                  <span className="resumen-list-name">{f.nombre}</span>
                  <span className="resumen-pill pill-included">Incluida</span>
                </li>
              ))}

              <li className="resumen-list-item colores">
                <span className="resumen-list-name">Color principal</span>
                <span className="color-box" style={{ background: config.colores.principal }} />
              </li>
              <li className="resumen-list-item colores">
                <span className="resumen-list-name">Color secundario</span>
                <span className="color-box" style={{ background: config.colores.secundario }} />
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* === SERVICIOS CONTRATADOS === */}
      <div className="resumen-bloque card">
        <div className="resumen-bloque-header">
          <h3>🧾 Servicios contratados</h3>
          <span className="resumen-tag badge badge-aviso">Plan y extras</span>
        </div>

        <div className="resumen-servicios">
          <div className="resumen-servicios-linea">
            <span>Plan seleccionado</span>
            <strong>{tenant.plan}</strong>
          </div>
          <div className="resumen-servicios-linea">
            <span>Suscripción base</span>
            <strong>{precioBasePlan} €/mes</strong>
          </div>

          <ul className="resumen-servicios-lista">
            {servicios.cargaProductos && (
              <li>
                + {isShop ? "Carga completa de catálogo y productos" : "Carga completa de carta y productos"} —{" "}
                {PRECIO_CARGA_PRODUCTOS} € (único)
              </li>
            )}

            {!isShop && servicios.mesasQr && (
              <li>
                + Configuración de mesas + QR impresos{" "}
                {servicios.mesasQrCantidad ? `(${servicios.mesasQrCantidad} mesas)` : ""}
                {" — "}
                {calcularPrecioMesasQr(servicios.mesasQrCantidad)} € (único)
              </li>
            )}

            {servicios.impresoras > 0 && (
              <li>
                {servicios.impresoras} × Impresora térmica —{" "}
                {PRECIO_IMPRESORA * servicios.impresoras} €
              </li>
            )}

            {servicios.tpvOpcion === "nuevo" && (
              <li>
                + TPV nuevo instalado y listo — 550 €
              </li>
            )}

            {servicios.tpvOpcion === "propio" && servicios.instalacionTpvPropio && (
              <li>
                + Instalación en TPV propio — 120 €
              </li>
            )}

            {servicios.pantallas > 0 && (
              <li>
                {servicios.pantallas} ×{" "}
                {servicios.pantallaTipo === "pro"
                  ? "Pantalla táctil PRO"
                  : "Tablet táctil"}{" "}
                —{" "}
                {(servicios.pantallaTipo === "pro" ? 450 : 180) *
                  servicios.pantallas} €
              </li>
            )}

            {servicios.formacion && (
              <li>
                + Formación al equipo{" "}
                {servicios.formacionPersonas
                  ? `(${servicios.formacionPersonas} personas)`
                  : ""}{" "}
                — 120 €
              </li>
            )}

            {!isShop && servicios.pda > 0 && (
              <li>
                {servicios.pda} × PDA camarero — {PRECIO_PDA * servicios.pda} €
              </li>
            )}

            {isShop && (servicios.scanner ?? 0) > 0 && (
              <li>
                {servicios.scanner} × Scanner codigos de barras — consultar precio
              </li>
            )}

            {!isShop && servicios.fotografia && (
              <li>+ Servicio de fotografía profesional — {PRECIO_FOTOGRAFIA} €</li>
            )}

            {servicios.cargaDatos && (
              <li>
                + {isShop
                  ? "Carga inicial de catálogo y datos básicos"
                  : "Carga inicial de carta y datos básicos"} —{" "}
                {PRECIO_CARGA_DATOS} €
              </li>
            )}

            {!servicios.cargaProductos &&
              (!servicios.mesasQr || isShop) &&
              servicios.impresoras === 0 &&
              servicios.pantallas === 0 &&
              (!servicios.pda || isShop) &&
              !servicios.fotografia &&
              !servicios.cargaDatos &&
              (servicios.scanner ?? 0) === 0 && (
                <li className="resumen-empty">
                  No has añadido servicios adicionales. Podrás hacerlo más
                  adelante si lo necesitas.
                </li>
              )}
          </ul>
        </div>
      </div>

      {/* === RESUMEN DE PRECIOS === */}
      <div className="resumen-precio card">
        <div className="fila">
          <span>{periodo === "mensual" ? "Suscripción mensual" : "Suscripción anual"}</span>
          <strong>
            {periodo === "mensual"
              ? `${precio.mensual.toFixed(2)} €`
              : `${(precio.mensual * 11).toFixed(2)} € (1 mes gratis)`}
          </strong>
        </div>

        <div className="fila">
          <span>Coste único inicial</span>
          <strong>{precio.unico.toFixed(2)} €</strong>
        </div>

        <hr />

        <div className="fila total">
          <span>{periodo === "mensual" ? "Total primer mes" : "Total hoy"}</span>
          <strong>
            {periodo === "mensual"
              ? `${precio.totalPrimerMes.toFixed(2)} €`
              : `${(precio.unico + precio.mensual * 11).toFixed(2)} €`}
          </strong>
        </div>
      </div>

      {/* === SELECCIÓN MENSUAL / ANUAL === */}
      <div className="resumen-periodo card">
        <h3>🔁 Tipo de facturación</h3>
        <p className="periodo-descripcion">Elige cómo deseas pagar tu suscripción Alef.</p>

        <div className="periodo-cards">
          <div
            className={`periodo-card ${periodo === "mensual" ? "active" : ""}`}
            onClick={() => setPeriodo("mensual")}
          >
            <h4>Pago mensual</h4>
            <p className="periodo-precio">{precioBasePlan} €/mes</p>
            <p className="periodo-detalle">Se factura cada mes</p>
          </div>

          <div
            className={`periodo-card ${periodo === "anual" ? "active" : ""}`}
            onClick={() => setPeriodo("anual")}
          >
            <h4>Pago anual</h4>
            <p className="periodo-precio">{(precioBasePlan * 11).toFixed(2)} €/año</p>
            <p className="periodo-detalle ahorro">💡 Ahorras 1 mes</p>
          </div>
        </div>
      </div>

      {/* === PAGO === */}
      <div className="resumen-pago">
        <button
          className="boton-pago btn btn-primario "
          onClick={handlePago}
          disabled={loading}
        >
          {loading ? "Redirigiendo a Stripe..." : "Pagar y finalizar registro"}
        </button>

        {error && <p className="registro-error">{error}</p>}
      </div>

      <p className="nota-legal text-suave">
        Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
      </p>
    </section>
  );
}
