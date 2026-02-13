import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/Registro.css";

import Paso1DatosRestaurante from "../components/Registro/Paso1DatosRestaurante.jsx";
import Paso2ConfiguracionBasica from "../components/Registro/Paso2ConfiguracionBasica.jsx";
import Paso3ServiciosExtras from "../components/Registro/Paso3ServiciosExtras.jsx";
import Paso4ResumenPago from "../components/Registro/Paso4ResumenPago.jsx";
import PanelPrecio from "../components/Registro/PanelPrecio.jsx";

export default function Registro() {
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [periodo, setPeriodo] = useState("mensual");

  // ======== QUERY ========
  const params = new URLSearchParams(window.location.search);
  const planSlug = (params.get("plan") || "").toLowerCase();

  // ======== ESTADOS PRINCIPALES ========
  const [tenant, setTenant] = useState({
    nombre: "",
    plan: "premium",
    tipoNegocio: null,
  });

  const [admin, setAdmin] = useState({
    name: "",
    email: "",
  });

  const [config, setConfig] = useState({
    permitePedidosComida: true,
    permitePedidosBebida: true,
    stockHabilitado: true,
    colores: { principal: "#6A0DAD", secundario: "#FF6700" },
    informacionRestaurante: { telefono: "", direccion: "" },
  });

  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [precioBasePlan, setPrecioBasePlan] = useState(0);

  const [servicios, setServicios] = useState({
    // servicios previos
    vozCocina: false,
    vozComandas: false,

    // puesta en marcha
    cargaProductos: false,
    mesasQr: false,
    mesasQrCantidad: "",
    cartaAdjuntos: [], // [{ key, url, name, size, type }]
    mesasAdjuntos: [], // [{ key, url, name, size, type }]

    // hardware
    tpvOpcion: "propio",          // "propio" | "nuevo"
    instalacionTpvPropio: true,   // bool
    tpvNuevo: 0,                  // nº de TPV nuevos (normalmente 1)

    impresoras: 0,

    pantallaTipo: "tablet",       // "tablet" | "pro"
    pantallas: 0,

    pda: 0,
    scanner: 0,                   // shop

    // extras
    fotografia: false,
    formacion: false,
    formacionPersonas: "",
  });

  const [precio, setPrecio] = useState({
    mensual: 0,
    unico: 0,
    totalPrimerMes: 0,
  });

  const [pago, setPago] = useState({
    metodo: "simulado",
    idPago: "TEST-" + Date.now(),
  });

  // ✅ Determinar tipo de negocio (preferimos el del plan; fallback por URL)
  const isShop = useMemo(() => {
    const t = (planSeleccionado?.tipoNegocio || "").toLowerCase();
    if (t) return t === "shop";
    return planSlug === "shop" || planSlug.includes("shop");
  }, [planSeleccionado, planSlug]);

  // ✅ Steps con labels dinámicos (sin cambiar estructura)
  const STEPS = useMemo(
    () => [
      { id: 1, label: isShop ? "Datos de la tienda" : "Datos del restaurante" },
      { id: 2, label: isShop ? "Configuración inicial" : "Configuración inicial" },
      { id: 3, label: isShop ? "Servicios y herramientas" : "Servicios y hardware" },
      { id: 4, label: "Resumen y pago" },
    ],
    [isShop]
  );

  useEffect(() => {
    if (!planSlug) {
      navigate("/?seleccionarPlan=1");
    }
  }, [planSlug, navigate]);

  // ======== CARGAR PLAN (1) – guarda planSeleccionado y precio base ========
  useEffect(() => {
    const cargarPlan = async () => {
      if (!planSlug) return;

      try {
        const { data } = await api.get("/admin/superadminPlans/publicPlans");
        const encontrado = data.find(
          (p) => p.slug.toLowerCase() === planSlug.toLowerCase()
        );

        if (!encontrado) {
          alert("El plan seleccionado no existe.");
          navigate("/");
          return;
        }

        setPlanSeleccionado(encontrado);

        // ✅ set tipoNegocio (plan > fallback URL)
        const tipoNegocio =
          (encontrado.tipoNegocio || "").toLowerCase() ||
          (planSlug === "shop" || planSlug.includes("shop") ? "shop" : "restaurante");

        setTenant((prev) => ({
          ...prev,
          plan: encontrado.slug,
          tipoNegocio, // 👈 NUEVO
        }));

        setPrecio((prev) => ({
          ...prev,
          mensual: encontrado.precioMensual,
          totalPrimerMes: encontrado.precioMensual + prev.unico,
        }));

        setPrecioBasePlan(encontrado.precioMensual);
      } catch (err) {
        console.error("Error cargando plan:", err);
      }
    };

    cargarPlan();
  }, [planSlug, navigate]);

  // ======== CALCULAR PRECIO ========
  useEffect(() => {
    const mensual =
      precioBasePlan +
      (servicios.vozCocina ? 10 : 0) +
      (servicios.vozComandas ? 10 : 0);

    const PRECIO_TPV_NUEVO = 550;
    const PRECIO_INSTALACION_TPV_PROPIO = 120;

    const PRECIO_TABLET = 180;
    const PRECIO_PANTALLA_PRO = 450;

    const PRECIO_IMPRESORA = 150;
    const PRECIO_PDA = 180;

    const PRECIO_FORMACION = 120;
    const PRECIO_FOTOGRAFIA = 120;
    const PRECIO_CARGA_PRODUCTOS = 80;
    const PRECIO_MESAS_QR = 80;

    const unico =
      // TPV principal
      (servicios.tpvOpcion === "nuevo"
        ? servicios.tpvNuevo * PRECIO_TPV_NUEVO
        : servicios.instalacionTpvPropio
          ? PRECIO_INSTALACION_TPV_PROPIO
          : 0) +

      // pantallas
      servicios.pantallas *
      (servicios.pantallaTipo === "pro"
        ? PRECIO_PANTALLA_PRO
        : PRECIO_TABLET) +

      // hardware
      servicios.impresoras * PRECIO_IMPRESORA +
      servicios.pda * PRECIO_PDA +

      // servicios
      (servicios.cargaProductos ? PRECIO_CARGA_PRODUCTOS : 0) +
      (servicios.mesasQr ? PRECIO_MESAS_QR : 0) +
      (servicios.formacion ? PRECIO_FORMACION : 0) +
      (servicios.fotografia ? PRECIO_FOTOGRAFIA : 0);

    setPrecio({
      mensual,
      unico,
      totalPrimerMes: mensual + unico,
    });
  }, [servicios, precioBasePlan]);

  useEffect(() => {
    document.title = "Registro | Alef";

    // meta robots: noindex
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");

    // opcional: canonical para esta página
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.href);
  }, []);

  const pasos = [
    <Paso1DatosRestaurante
      tenant={tenant}
      setTenant={setTenant}
      admin={admin}
      setAdmin={setAdmin}
      isShop={isShop} // 👈 por si quieres adaptar textos/campos dentro
    />,
    <Paso2ConfiguracionBasica
      config={config}
      setConfig={setConfig}
      plan={planSeleccionado}
      isShop={isShop}
    />,
    <Paso3ServiciosExtras
      servicios={servicios}
      setServicios={setServicios}
      isShop={isShop}
    />,
    <Paso4ResumenPago
      tenant={tenant}
      admin={admin}
      config={config}
      servicios={servicios}
      precio={precio}
      pago={pago}
      loading={loading}
      setLoading={setLoading}
      error={error}
      setError={setError}
      // success no lo uses aquí (Stripe te saca de la página)
      precioBasePlan={precioBasePlan}
      plan={planSeleccionado}
      periodo={periodo}
      setPeriodo={setPeriodo}
      isShop={isShop}
    />,
  ];

  const stepActual = STEPS.find((s) => s.id === paso);

  return (
    <main className="registro-avanzado registro-page">

      <div className="registro-shell">
        {/* COLUMNA PRINCIPAL */}
        <div className="registro-main card">
          <header className="registro-header">
            <div>
              <p className="registro-kicker">
                Alta de {isShop ? "tienda" : "restaurante"}
              </p>

              <h1 className="registro-title">
                Configura tu {isShop ? "tienda online" : "restaurante"} en Alef
              </h1>

              <p className="registro-subtitle">
                Completa estos pasos para crear tu entorno y empezar a trabajar con{" "}
                {isShop ? "Alef Shop" : "el TPV"}.
              </p>
            </div>

            {planSeleccionado && (
              <div className="registro-plan-box">
                <span className="registro-plan-label">Plan seleccionado</span>
                <strong className="registro-plan-nombre">
                  {planSeleccionado.nombre}
                </strong>
                <span className="registro-plan-precio">
                  {planSeleccionado.precioMensual} €/mes
                </span>
              </div>
            )}
          </header>

          {/* STEPPER */}
          <div className="registro-stepper">
            {STEPS.map((step, index) => {
              const isActive = paso === step.id;
              const isDone = paso > step.id;

              return (
                <div className="registro-step" key={step.id}>
                  <div
                    className={`registro-step-circle ${isActive ? "active" : ""} ${isDone ? "done" : ""
                      }`}
                  >
                    {isDone ? "✓" : step.id}
                  </div>
                  <span
                    className={`registro-step-label ${isActive ? "active" : ""}`}
                  >
                    {step.label}
                  </span>
                  {index < STEPS.length - 1 && <div className="registro-step-line" />}
                </div>
              );
            })}
          </div>

          <p className="registro-step-counter">
            Paso {paso} de {STEPS.length}: <span>{stepActual?.label}</span>
          </p>

          {/* CONTENIDO DEL PASO */}
          <div className="registro-step-content">{pasos[paso - 1]}</div>

          {/* NAVIGATION BOTTOM */}
          <div className="registro-nav">
            {paso > 1 && (
              <button
                type="button"
                className="registro-btn registro-btn-secundario"
                onClick={() => setPaso(paso - 1)}
                disabled={loading}
              >
                Anterior
              </button>
            )}
            {paso < STEPS.length && (
              <button
                type="button"
                className="registro-btn registro-btn btn-primario "
                onClick={() => setPaso(paso + 1)}
                disabled={loading}
              >
                Siguiente
              </button>
            )}
          </div>

          {error && <p className="registro-error">{error}</p>}
          {success && (
            <p className="registro-success">
              {isShop ? "Tienda" : "Restaurante"} creado correctamente. Redirigiendo...
            </p>
          )}
        </div>

        {/* COLUMNA DERECHA: RESUMEN DE PRECIOS */}
        <div className="registro-side">
          <PanelPrecio precio={precio} periodo={periodo} />
        </div>
      </div>
    </main>
  );
}
