import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/Registro.css";

import Paso1DatosRestaurante from "../components/Registro/Paso1DatosRestaurante.jsx";
import Paso2ConfiguracionBasica from "../components/Registro/Paso2ConfiguracionBasica.jsx";
import Paso3ServiciosExtras from "../components/Registro/Paso3ServiciosExtras.jsx";
import Paso4ResumenPago from "../components/Registro/Paso4ResumenPago.jsx";
import PanelPrecio from "../components/Registro/PanelPrecio.jsx";

const STEPS = [
  { id: 1, label: "Datos del restaurante" },
  { id: 2, label: "Configuración inicial" },
  { id: 3, label: "Servicios y hardware" },
  { id: 4, label: "Resumen y pago" },
];

export default function Registro() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [periodo, setPeriodo] = useState("mensual");

  // ======== ESTADOS PRINCIPALES ========
  const [tenant, setTenant] = useState({ nombre: "", email: "", plan: "premium" });
  const [admin, setAdmin] = useState({ name: "", password: "", admin: "" });

  const params = new URLSearchParams(window.location.search);
  const planSlug = params.get("plan");

  useEffect(() => {
    if (!planSlug) {
      navigate("/?seleccionarPlan=1");
    }
  }, []);

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
    vozCocina: false,
    vozComandas: false,
    impresoras: 0,
    pantallas: 0,
    pda: 0,
    fotografia: false,
    cargaDatos: false,
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

  // ======== CARGAR PLAN (1) – guarda planSeleccionado y precio base ========
  useEffect(() => {
    const cargarPlan = async () => {
      if (!planSlug) return;

      try {
        const { data } = await api.get("/superadminPlans/publicPlans");
        const encontrado = data.find(
          (p) => p.slug.toLowerCase() === planSlug.toLowerCase()
        );

        if (!encontrado) {
          alert("El plan seleccionado no existe.");
          navigate("/");
          return;
        }

        setPlanSeleccionado(encontrado);

        setTenant((prev) => ({
          ...prev,
          plan: encontrado.slug,
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
  }, [planSlug]);

  // ======== CALCULAR PRECIO ========
  useEffect(() => {
    const mensual =
      precioBasePlan +
      (servicios.vozCocina ? 10 : 0) +
      (servicios.vozComandas ? 10 : 0);

    const unico =
      servicios.impresoras * 150 +
      servicios.pantallas * 250 +
      servicios.pda * 180 +
      (servicios.fotografia ? 120 : 0) +
      (servicios.cargaDatos ? 100 : 0) +
      // ➕ NUEVO: carga completa de productos
      (servicios.cargaProductos ? 80 : 0) +
      // ➕ NUEVO: configuración de mesas + QR
      (servicios.mesasQr ? 80 : 0);
    // Si quieres que cada mesa cuente:
    // servicios.mesasQr && servicios.mesasQrCantidad
    //   ? servicios.mesasQrCantidad * 1.5 : 0

    setPrecio({
      mensual,
      unico,
      totalPrimerMes: mensual + unico,
    });
  }, [servicios, precioBasePlan]);

  // ======== CARGAR PLAN (2) – mantiene compatibilidad con tu código original ========
  useEffect(() => {
    const cargarPlan = async () => {
      if (!planSlug) return;

      try {
        const { data } = await api.get("/superadminPlans/publicPlans");
        const encontrado = data.find(
          (p) => p.slug.toLowerCase() === planSlug.toLowerCase()
        );

        if (!encontrado) {
          alert("El plan seleccionado no existe.");
          navigate("/");
          return;
        }

        setTenant((prev) => ({
          ...prev,
          plan: encontrado.slug,
        }));

        setPrecio((prev) => ({
          ...prev,
          mensual: encontrado.precioMensual,
          totalPrimerMes: encontrado.precioMensual + prev.unico,
        }));
      } catch (err) {
        console.error("Error cargando plan:", err);
      }
    };

    cargarPlan();
  }, [planSlug]);

  // ======== SUBMIT FINAL ========
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await api.post("/tenants/registro-avanzado", {
        tenant,
        admin,
        config,
        servicios,
        precio,
        pago,
      });
      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(
        err.response?.data?.error || "Error al registrar el restaurante."
      );
    } finally {
      setLoading(false);
    }
  };

  const pasos = [
    <Paso1DatosRestaurante
      tenant={tenant}
      setTenant={setTenant}
      admin={admin}
      setAdmin={setAdmin}
    />,
    <Paso2ConfiguracionBasica
      config={config}
      setConfig={setConfig}
      plan={planSeleccionado}
    />,
    <Paso3ServiciosExtras
      servicios={servicios}
      setServicios={setServicios}
    />,
    <Paso4ResumenPago
      tenant={tenant}
      admin={admin}
      config={config}
      servicios={servicios}
      precio={precio}
      pago={pago}
      onSubmit={handleSubmit}
      loading={loading}
      success={success}
      precioBasePlan={precioBasePlan}
      plan={planSeleccionado}
      periodo={periodo}            // 👈 nuevo
      setPeriodo={setPeriodo}      // 👈 nuevo
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
              <p className="registro-kicker">Alta de restaurante</p>
              <h1 className="registro-title">Configura tu restaurante en Alef</h1>
              <p className="registro-subtitle">
                Completa estos pasos para crear tu entorno y empezar a trabajar con el TPV.
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
                    className={`registro-step-circle ${isActive ? "active" : ""
                      } ${isDone ? "done" : ""}`}
                  >
                    {isDone ? "✓" : step.id}
                  </div>
                  <span
                    className={`registro-step-label ${isActive ? "active" : ""
                      }`}
                  >
                    {step.label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div className="registro-step-line" />
                  )}
                </div>
              );
            })}
          </div>

          <p className="registro-step-counter">
            Paso {paso} de {STEPS.length}:{" "}
            <span>{stepActual?.label}</span>
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
                className="registro-btn registro-btn-primario"
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
              Restaurante creado correctamente. Redirigiendo...
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
