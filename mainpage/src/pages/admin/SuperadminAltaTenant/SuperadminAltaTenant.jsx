import { useEffect, useMemo, useState } from "react";
import api from "../../../utils/api";

// ✅ reusa los pasos del registro real
import Paso1DatosRestaurante from "../../../components/Registro/Paso1DatosRestaurante.jsx";
import Paso2ConfiguracionBasica from "../../../components/Registro/Paso2ConfiguracionBasica.jsx";
import Paso3ServiciosExtras from "../../../components/Registro/Paso3ServiciosExtras.jsx";
import PanelPrecio from "../../../components/Registro/PanelPrecio.jsx";

// ✅ paso 4 admin (nuevo)
import Paso4Provision from "./Paso4Provision.jsx";

import "../../../styles/Registro.css";

function calcPrecio(precioBasePlan, servicios) {
  const mensual =
    (Number(precioBasePlan) || 0) +
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
    (servicios.tpvOpcion === "nuevo"
      ? (Number(servicios.tpvNuevo) || 0) * PRECIO_TPV_NUEVO
      : servicios.instalacionTpvPropio
        ? PRECIO_INSTALACION_TPV_PROPIO
        : 0) +
    (Number(servicios.pantallas) || 0) *
      (servicios.pantallaTipo === "pro" ? PRECIO_PANTALLA_PRO : PRECIO_TABLET) +
    (Number(servicios.impresoras) || 0) * PRECIO_IMPRESORA +
    (Number(servicios.pda) || 0) * PRECIO_PDA +
    (servicios.cargaProductos ? PRECIO_CARGA_PRODUCTOS : 0) +
    (servicios.mesasQr ? PRECIO_MESAS_QR : 0) +
    (servicios.formacion ? PRECIO_FORMACION : 0) +
    (servicios.fotografia ? PRECIO_FOTOGRAFIA : 0);

  return {
    mensual,
    unico,
    totalPrimerMes: mensual + unico,
  };
}

export default function SuperadminAltaTenant() {
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // mensual | anual
  const [periodo, setPeriodo] = useState("mensual");

  // planes
  const [planes, setPlanes] = useState([]);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [precioBasePlan, setPrecioBasePlan] = useState(0);

  // estados: iguales al registro real
  const [tenant, setTenant] = useState({
    nombre: "",
    email: "",
    plan: "",
    tipoNegocio: null,
  });

  const [admin, setAdmin] = useState({
    name: "",
    email: "",
  });

  const [config, setConfig] = useState({
    // básicos (y luego Paso2 añade configKeys del plan)
    permitePedidosComida: true,
    permitePedidosBebida: true,
    stockHabilitado: true,
    colores: { principal: "#6A0DAD", secundario: "#FF6700" },
    informacionRestaurante: { telefono: "", direccion: "" },
  });

  const [servicios, setServicios] = useState({
    vozCocina: false,
    vozComandas: false,

    cargaProductos: false,
    mesasQr: false,
    mesasQrCantidad: "",
    cartaAdjuntos: [],
    mesasAdjuntos: [],

    tpvOpcion: "propio",
    instalacionTpvPropio: true,
    tpvNuevo: 0,

    impresoras: 0,

    pantallaTipo: "tablet",
    pantallas: 0,

    pda: 0,
    scanner: 0,

    fotografia: false,
    formacion: false,
    formacionPersonas: "",
  });

  const [precio, setPrecio] = useState({ mensual: 0, unico: 0, totalPrimerMes: 0 });

  const isShop = useMemo(() => {
    const t = (planSeleccionado?.tipoNegocio || "").toLowerCase();
    if (t) return t === "shop";
    return (tenant.tipoNegocio || "").toLowerCase() === "shop";
  }, [planSeleccionado, tenant.tipoNegocio]);

  const STEPS = useMemo(
    () => [
      { id: 1, label: isShop ? "Datos de la tienda" : "Datos del restaurante" },
      { id: 2, label: "Configuración inicial" },
      { id: 3, label: isShop ? "Servicios y herramientas" : "Servicios y hardware" },
      { id: 4, label: "Resumen y provisión" },
    ],
    [isShop]
  );

  // cargar planes
  useEffect(() => {
    (async () => {
      try {
        // usa el mismo endpoint que el registro real
        const { data } = await api.get("/admin/superadminPlans/publicPlans");
        setPlanes(data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // cuando cambia tenant.plan → planSeleccionado
  useEffect(() => {
    if (!tenant.plan) return;
    const p = planes.find((x) => x.slug === tenant.plan);
    setPlanSeleccionado(p || null);
    setPrecioBasePlan(Number(p?.precioMensual || 0));

    const tipoNegocio =
      (p?.tipoNegocio || "").toLowerCase() ||
      (tenant.plan.includes("shop") ? "shop" : "restaurante");

    setTenant((prev) => ({ ...prev, tipoNegocio }));

    // ✅ inicializa configKeys del plan en true por defecto (si no existían)
    if (p?.features?.length) {
      setConfig((prev) => {
        const next = { ...prev };
        for (const f of p.features) {
          if (f?.configKey && typeof next[f.configKey] === "undefined") {
            next[f.configKey] = true;
          }
        }
        return next;
      });
    }
  }, [tenant.plan, planes]);

  // recalcular precio
  useEffect(() => {
    setPrecio(calcPrecio(precioBasePlan, servicios));
  }, [precioBasePlan, servicios]);

  // submit final: precheckout + provision
  const handleProvision = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (!tenant.nombre || !tenant.email || !tenant.plan) {
        throw new Error("MISSING_TENANT_FIELDS");
      }
      if (!admin.name || !admin.email) {
        throw new Error("MISSING_ADMIN_FIELDS");
      }

      const prePayload = {
        tenant: {
          nombre: tenant.nombre,
          email: (tenant.email || "").toLowerCase(),
          plan: tenant.plan,
          tipoNegocio: tenant.tipoNegocio || (isShop ? "shop" : "restaurante"),
        },
        admin: {
          name: admin.name,
          email: (admin.email || "").toLowerCase(),
        },
        config,
        servicios,
        precio,
        ciclo: periodo.toUpperCase(), // "MENSUAL" | "ANUAL" (si lo guardas en PreCheckout)
        colores: config.colores,
      };

      const preRes = await api.post("/superadmin/onboarding/precheckout", prePayload);
      const precheckoutId = preRes.data?.precheckoutId;
      if (!precheckoutId) throw new Error("NO_PRECHECKOUT_ID");

      const provRes = await api.post("/superadmin/onboarding/provision", { precheckoutId });

      setSuccessMsg("✅ Entorno creado y provisionado.");
      // opcional: te devuelve passwordSetupUrl para copiar
      if (provRes.data?.passwordSetupUrl) {
        setSuccessMsg(
          `✅ Entorno provisionado. Link set-password: ${provRes.data.passwordSetupUrl}`
        );
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "Error al provisionar.");
    } finally {
      setLoading(false);
    }
  };

  const pasos = [
    // Paso 1: mismo Paso1 del registro + select de plan arriba (admin-only)
    <section className="section section--wide" key="p1">
      <div className="card" style={{ marginBottom: 12, padding: 16 }}>
        <h3 style={{ margin: 0 }}>📦 Plan</h3>
        <p style={{ marginTop: 6 }} className="text-suave">
          En el registro público el plan se elige antes. Aquí lo eliges como superadmin.
        </p>

        <label style={{ display: "block", marginTop: 10 }}>
          <span className="text-suave">Selecciona plan</span>
          <select
            style={{ width: "100%", marginTop: 6 }}
            value={tenant.plan}
            onChange={(e) => setTenant((p) => ({ ...p, plan: e.target.value }))}
            required
          >
            <option value="">— Selecciona —</option>
            {planes.map((p) => (
              <option key={p._id} value={p.slug}>
                {p.nombre} — {p.precioMensual}€/mes
              </option>
            ))}
          </select>
        </label>
      </div>

      <Paso1DatosRestaurante
        tenant={tenant}
        setTenant={setTenant}
        admin={admin}
        setAdmin={setAdmin}
        isShop={isShop}
      />
    </section>,

    <Paso2ConfiguracionBasica
      key="p2"
      config={config}
      setConfig={setConfig}
      plan={planSeleccionado}
      isShop={isShop}
    />,

    <Paso3ServiciosExtras
      key="p3"
      servicios={servicios}
      setServicios={setServicios}
      isShop={isShop}
    />,

    <Paso4Provision
      key="p4"
      tenant={tenant}
      admin={admin}
      config={config}
      servicios={servicios}
      precio={precio}
      precioBasePlan={precioBasePlan}
      plan={planSeleccionado}
      periodo={periodo}
      setPeriodo={setPeriodo}
      isShop={isShop}
      loading={loading}
      onProvision={handleProvision}
      successMsg={successMsg}
    />,
  ];

  const stepActual = STEPS.find((s) => s.id === paso);

  return (
    <main className="registro-avanzado registro-page">
      <div className="registro-shell">
        <div className="registro-main card">
          <header className="registro-header">
            <div>
              <p className="registro-kicker">Alta superadmin</p>
              <h1 className="registro-title">Crear y provisionar un nuevo tenant</h1>
              <p className="registro-subtitle">
                Mismas opciones que el registro real, pero sin pago (provisión manual).
              </p>
            </div>
          </header>

          <div className="registro-stepper">
            {STEPS.map((step, index) => {
              const isActive = paso === step.id;
              const isDone = paso > step.id;
              return (
                <div className="registro-step" key={step.id}>
                  <div className={`registro-step-circle ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
                    {isDone ? "✓" : step.id}
                  </div>
                  <span className={`registro-step-label ${isActive ? "active" : ""}`}>{step.label}</span>
                  {index < STEPS.length - 1 && <div className="registro-step-line" />}
                </div>
              );
            })}
          </div>

          <p className="registro-step-counter">
            Paso {paso} de {STEPS.length}: <span>{stepActual?.label}</span>
          </p>

          <div className="registro-step-content">{pasos[paso - 1]}</div>

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
        </div>

        <div className="registro-side">
          <PanelPrecio precio={precio} periodo={periodo} />
        </div>
      </div>
    </main>
  );
}
